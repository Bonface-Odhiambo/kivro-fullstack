-- =====================================================
-- KIVRO OTP (One-Time Password) System
-- Created: 2025-10-22
-- Purpose: Phone number verification and secure authentication
-- Status: DISABLED by default (enable via system_settings)
-- =====================================================

-- Create OTP codes table
CREATE TABLE IF NOT EXISTS otp_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    phone_number VARCHAR(20) NOT NULL,
    otp_code VARCHAR(6) NOT NULL,
    purpose VARCHAR(50) NOT NULL, -- 'phone_verification', 'login', 'transaction', 'address_verification'
    is_used BOOLEAN DEFAULT FALSE,
    is_expired BOOLEAN DEFAULT FALSE,
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    used_at TIMESTAMP WITH TIME ZONE,
    ip_address INET,
    user_agent TEXT,
    
    -- Indexes for performance
    CONSTRAINT otp_code_length CHECK (LENGTH(otp_code) = 6),
    CONSTRAINT valid_purpose CHECK (purpose IN ('phone_verification', 'login', 'transaction', 'address_verification', 'password_reset'))
);

-- Create indexes (IF NOT EXISTS to avoid conflicts)
CREATE INDEX IF NOT EXISTS idx_otp_phone_number ON otp_codes(phone_number);
CREATE INDEX IF NOT EXISTS idx_otp_user_id ON otp_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_otp_expires_at ON otp_codes(expires_at);
CREATE INDEX IF NOT EXISTS idx_otp_created_at ON otp_codes(created_at);
CREATE INDEX IF NOT EXISTS idx_otp_purpose ON otp_codes(purpose);

-- Create OTP verification logs table (for security auditing)
CREATE TABLE IF NOT EXISTS otp_verification_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    otp_id UUID REFERENCES otp_codes(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    phone_number VARCHAR(20),
    verification_status VARCHAR(20) NOT NULL, -- 'success', 'failed', 'expired', 'max_attempts'
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_otp_logs_user_id ON otp_verification_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_otp_logs_phone ON otp_verification_logs(phone_number);
CREATE INDEX IF NOT EXISTS idx_otp_logs_created_at ON otp_verification_logs(created_at);

-- Add OTP-related columns to profiles table (if not exists)
DO $$ 
BEGIN
    -- Phone verification status
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'profiles' 
                   AND column_name = 'phone_verified') THEN
        ALTER TABLE public.profiles ADD COLUMN phone_verified BOOLEAN DEFAULT FALSE;
        COMMENT ON COLUMN public.profiles.phone_verified IS 'Whether user phone number has been verified via OTP';
    END IF;
    
    -- Phone verification timestamp
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'profiles' 
                   AND column_name = 'phone_verified_at') THEN
        ALTER TABLE public.profiles ADD COLUMN phone_verified_at TIMESTAMP WITH TIME ZONE;
        COMMENT ON COLUMN public.profiles.phone_verified_at IS 'Timestamp when phone was verified';
    END IF;
    
    -- OTP enabled for user
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'profiles' 
                   AND column_name = 'otp_enabled') THEN
        ALTER TABLE public.profiles ADD COLUMN otp_enabled BOOLEAN DEFAULT FALSE;
        COMMENT ON COLUMN public.profiles.otp_enabled IS 'Whether OTP verification is enabled for this user';
    END IF;
END $$;

-- Note: system_settings table already exists from previous migration
-- We'll just insert OTP-specific settings

-- Insert OTP system settings (DISABLED by default)
INSERT INTO public.system_settings (setting_key, setting_value, setting_type, category, description, is_public, is_editable)
VALUES 
    ('otp_enabled', 'false', 'boolean', 'security', 'Enable/disable OTP verification system globally', true, true),
    ('otp_required_for_login', 'false', 'boolean', 'security', 'Require OTP for user login', true, true),
    ('otp_required_for_phone_verification', 'false', 'boolean', 'security', 'Require OTP for phone number verification', true, true),
    ('otp_required_for_address_generation', 'false', 'boolean', 'security', 'Require OTP before generating KIVRO address', true, true),
    ('otp_expiry_minutes', '5', 'number', 'security', 'OTP expiration time in minutes (default: 5)', true, true),
    ('otp_max_attempts', '3', 'number', 'security', 'Maximum OTP verification attempts', true, true),
    ('otp_resend_cooldown_seconds', '300', 'number', 'security', 'Cooldown period before resending OTP (default: 300 = 5 minutes)', true, true),
    ('otp_sms_provider', 'disabled', 'string', 'security', 'SMS provider: twilio, africastalking, disabled', false, true),
    ('otp_sms_sender_id', 'KIVRO', 'string', 'security', 'SMS sender ID/name', false, true)
ON CONFLICT (setting_key) DO NOTHING;

-- Function to generate 6-digit OTP
CREATE OR REPLACE FUNCTION generate_otp_code()
RETURNS VARCHAR(6) AS $$
DECLARE
    otp_code VARCHAR(6);
BEGIN
    -- Generate random 6-digit code
    otp_code := LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
    RETURN otp_code;
END;
$$ LANGUAGE plpgsql;

-- Function to create OTP
CREATE OR REPLACE FUNCTION create_otp(
    p_user_id UUID,
    p_phone_number VARCHAR(20),
    p_purpose VARCHAR(50),
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS TABLE(
    otp_id UUID,
    otp_code VARCHAR(6),
    expires_at TIMESTAMP WITH TIME ZONE,
    success BOOLEAN,
    message TEXT
) AS $$
DECLARE
    v_otp_code VARCHAR(6);
    v_otp_id UUID;
    v_expires_at TIMESTAMP WITH TIME ZONE;
    v_expiry_minutes INTEGER;
    v_recent_count INTEGER;
BEGIN
    -- Check if OTP system is enabled
    IF NOT (SELECT setting_value::BOOLEAN FROM system_settings WHERE setting_key = 'otp_enabled') THEN
        RETURN QUERY SELECT NULL::UUID, NULL::VARCHAR(6), NULL::TIMESTAMP WITH TIME ZONE, 
                           FALSE, 'OTP system is currently disabled';
        RETURN;
    END IF;

    -- Get expiry time from settings
    SELECT setting_value::INTEGER INTO v_expiry_minutes 
    FROM system_settings WHERE setting_key = 'otp_expiry_minutes';
    
    -- Check rate limiting (max 3 OTPs per phone in last 10 minutes)
    SELECT COUNT(*) INTO v_recent_count
    FROM otp_codes
    WHERE phone_number = p_phone_number
    AND created_at > NOW() - INTERVAL '10 minutes';
    
    IF v_recent_count >= 3 THEN
        RETURN QUERY SELECT NULL::UUID, NULL::VARCHAR(6), NULL::TIMESTAMP WITH TIME ZONE,
                           FALSE, 'Too many OTP requests. Please try again later.';
        RETURN;
    END IF;

    -- Invalidate any existing unused OTPs for this phone/purpose
    UPDATE otp_codes
    SET is_expired = TRUE
    WHERE phone_number = p_phone_number
    AND purpose = p_purpose
    AND is_used = FALSE
    AND is_expired = FALSE;

    -- Generate new OTP
    v_otp_code := generate_otp_code();
    v_expires_at := NOW() + (v_expiry_minutes || ' minutes')::INTERVAL;

    -- Insert new OTP
    INSERT INTO otp_codes (
        user_id, phone_number, otp_code, purpose, 
        expires_at, ip_address, user_agent
    )
    VALUES (
        p_user_id, p_phone_number, v_otp_code, p_purpose,
        v_expires_at, p_ip_address, p_user_agent
    )
    RETURNING id INTO v_otp_id;

    -- Return OTP details
    RETURN QUERY SELECT v_otp_id, v_otp_code, v_expires_at, TRUE, 'OTP created successfully';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to verify OTP
CREATE OR REPLACE FUNCTION verify_otp(
    p_phone_number VARCHAR(20),
    p_otp_code VARCHAR(6),
    p_purpose VARCHAR(50),
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS TABLE(
    success BOOLEAN,
    message TEXT,
    user_id UUID
) AS $$
DECLARE
    v_otp_record RECORD;
    v_max_attempts INTEGER;
BEGIN
    -- Check if OTP system is enabled
    IF NOT (SELECT setting_value::BOOLEAN FROM system_settings WHERE setting_key = 'otp_enabled') THEN
        RETURN QUERY SELECT FALSE, 'OTP system is currently disabled', NULL::UUID;
        RETURN;
    END IF;

    -- Get max attempts from settings
    SELECT setting_value::INTEGER INTO v_max_attempts 
    FROM system_settings WHERE setting_key = 'otp_max_attempts';

    -- Find the OTP
    SELECT * INTO v_otp_record
    FROM otp_codes
    WHERE phone_number = p_phone_number
    AND otp_code = p_otp_code
    AND purpose = p_purpose
    AND is_used = FALSE
    AND is_expired = FALSE
    ORDER BY created_at DESC
    LIMIT 1;

    -- OTP not found
    IF v_otp_record IS NULL THEN
        -- Log failed attempt
        INSERT INTO otp_verification_logs (phone_number, verification_status, ip_address, user_agent)
        VALUES (p_phone_number, 'failed', p_ip_address, p_user_agent);
        
        RETURN QUERY SELECT FALSE, 'Invalid or expired OTP code', NULL::UUID;
        RETURN;
    END IF;

    -- Check if expired
    IF v_otp_record.expires_at < NOW() THEN
        UPDATE otp_codes SET is_expired = TRUE WHERE id = v_otp_record.id;
        
        INSERT INTO otp_verification_logs (otp_id, user_id, phone_number, verification_status, ip_address, user_agent)
        VALUES (v_otp_record.id, v_otp_record.user_id, p_phone_number, 'expired', p_ip_address, p_user_agent);
        
        RETURN QUERY SELECT FALSE, 'OTP code has expired', NULL::UUID;
        RETURN;
    END IF;

    -- Check max attempts
    IF v_otp_record.attempts >= v_max_attempts THEN
        UPDATE otp_codes SET is_expired = TRUE WHERE id = v_otp_record.id;
        
        INSERT INTO otp_verification_logs (otp_id, user_id, phone_number, verification_status, ip_address, user_agent)
        VALUES (v_otp_record.id, v_otp_record.user_id, p_phone_number, 'max_attempts', p_ip_address, p_user_agent);
        
        RETURN QUERY SELECT FALSE, 'Maximum verification attempts exceeded', NULL::UUID;
        RETURN;
    END IF;

    -- Increment attempts
    UPDATE otp_codes 
    SET attempts = attempts + 1
    WHERE id = v_otp_record.id;

    -- Verify OTP code
    IF v_otp_record.otp_code = p_otp_code THEN
        -- Mark as used
        UPDATE otp_codes 
        SET is_used = TRUE, used_at = NOW()
        WHERE id = v_otp_record.id;

        -- Update user phone verification if purpose is phone_verification
        IF p_purpose = 'phone_verification' AND v_otp_record.user_id IS NOT NULL THEN
            UPDATE public.profiles 
            SET phone_verified = TRUE, phone_verified_at = NOW()
            WHERE user_id = v_otp_record.user_id;
        END IF;

        -- Log success
        INSERT INTO otp_verification_logs (otp_id, user_id, phone_number, verification_status, ip_address, user_agent)
        VALUES (v_otp_record.id, v_otp_record.user_id, p_phone_number, 'success', p_ip_address, p_user_agent);

        RETURN QUERY SELECT TRUE, 'OTP verified successfully', v_otp_record.user_id;
    ELSE
        -- Log failed attempt
        INSERT INTO otp_verification_logs (otp_id, user_id, phone_number, verification_status, ip_address, user_agent)
        VALUES (v_otp_record.id, v_otp_record.user_id, p_phone_number, 'failed', p_ip_address, p_user_agent);
        
        RETURN QUERY SELECT FALSE, 'Invalid OTP code', NULL::UUID;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if OTP is required for a specific action
CREATE OR REPLACE FUNCTION is_otp_required(p_action VARCHAR(50))
RETURNS BOOLEAN AS $$
DECLARE
    v_otp_enabled BOOLEAN;
    v_action_required BOOLEAN;
BEGIN
    -- Check if OTP system is globally enabled
    SELECT setting_value::BOOLEAN INTO v_otp_enabled
    FROM system_settings WHERE setting_key = 'otp_enabled';
    
    IF NOT v_otp_enabled THEN
        RETURN FALSE;
    END IF;

    -- Check specific action requirement
    CASE p_action
        WHEN 'login' THEN
            SELECT setting_value::BOOLEAN INTO v_action_required
            FROM system_settings WHERE setting_key = 'otp_required_for_login';
        WHEN 'phone_verification' THEN
            SELECT setting_value::BOOLEAN INTO v_action_required
            FROM system_settings WHERE setting_key = 'otp_required_for_phone_verification';
        WHEN 'address_generation' THEN
            SELECT setting_value::BOOLEAN INTO v_action_required
            FROM system_settings WHERE setting_key = 'otp_required_for_address_generation';
        ELSE
            RETURN FALSE;
    END CASE;

    RETURN COALESCE(v_action_required, FALSE);
END;
$$ LANGUAGE plpgsql;

-- Cleanup function to remove expired OTPs (run periodically)
CREATE OR REPLACE FUNCTION cleanup_expired_otps()
RETURNS INTEGER AS $$
DECLARE
    v_deleted_count INTEGER;
BEGIN
    -- Delete OTPs older than 24 hours
    DELETE FROM otp_codes
    WHERE created_at < NOW() - INTERVAL '24 hours'
    RETURNING COUNT(*) INTO v_deleted_count;
    
    RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Enable Row Level Security
ALTER TABLE otp_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE otp_verification_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view their own OTPs" ON otp_codes;
DROP POLICY IF EXISTS "Service role can manage all OTPs" ON otp_codes;
DROP POLICY IF EXISTS "Users can view their own OTP logs" ON otp_verification_logs;
DROP POLICY IF EXISTS "Service role can manage all OTP logs" ON otp_verification_logs;

-- RLS Policies for otp_codes
CREATE POLICY "Users can view their own OTPs"
    ON otp_codes FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all OTPs"
    ON otp_codes FOR ALL
    USING (auth.role() = 'service_role');

-- RLS Policies for otp_verification_logs
CREATE POLICY "Users can view their own OTP logs"
    ON otp_verification_logs FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all OTP logs"
    ON otp_verification_logs FOR ALL
    USING (auth.role() = 'service_role');

-- Note: system_settings RLS policies already exist from previous migration

-- Create comments for documentation
COMMENT ON TABLE otp_codes IS 'Stores OTP codes for phone verification and authentication';
COMMENT ON TABLE otp_verification_logs IS 'Audit log for OTP verification attempts';
COMMENT ON TABLE system_settings IS 'System-wide configuration settings including OTP settings';
COMMENT ON FUNCTION create_otp IS 'Generate and store a new OTP code';
COMMENT ON FUNCTION verify_otp IS 'Verify an OTP code and mark as used if valid';
COMMENT ON FUNCTION is_otp_required IS 'Check if OTP is required for a specific action';
COMMENT ON FUNCTION cleanup_expired_otps IS 'Remove expired OTP codes (run via cron)';

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON system_settings TO authenticated;
GRANT SELECT ON otp_codes TO authenticated;
GRANT SELECT ON otp_verification_logs TO authenticated;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ OTP System Migration Completed Successfully';
    RAISE NOTICE '📍 Status: DISABLED by default';
    RAISE NOTICE '🔧 To enable: UPDATE system_settings SET setting_value = ''true'' WHERE setting_key = ''otp_enabled''';
    RAISE NOTICE '📊 Tables created: otp_codes, otp_verification_logs';
    RAISE NOTICE '⏱️  OTP Timer: 5 minutes expiry, 5 minutes resend cooldown';
    RAISE NOTICE '🔐 RLS policies enabled for security';
END $$;
