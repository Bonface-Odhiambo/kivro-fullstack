-- =====================================================
-- KIVRO OTP System Setup Migration
-- =====================================================
-- This migration enables the OTP verification system
-- for login authentication using Twilio SMS
-- =====================================================

-- Step 1: System settings table already exists (created in earlier migration)
-- We'll just insert OTP-specific settings

-- Step 2: Create otp_codes table
CREATE TABLE IF NOT EXISTS otp_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    phone_number VARCHAR(20) NOT NULL,
    otp_code VARCHAR(6) NOT NULL,
    purpose VARCHAR(50) NOT NULL, -- 'login', 'phone_verification', 'transaction', etc.
    expires_at TIMESTAMPTZ NOT NULL,
    verified_at TIMESTAMPTZ,
    attempts INT DEFAULT 0,
    max_attempts INT DEFAULT 3,
    ip_address VARCHAR(50),
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 3: Create indexes for otp_codes
CREATE INDEX IF NOT EXISTS idx_otp_codes_phone_number ON otp_codes(phone_number);
CREATE INDEX IF NOT EXISTS idx_otp_codes_user_id ON otp_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_otp_codes_purpose ON otp_codes(purpose);
CREATE INDEX IF NOT EXISTS idx_otp_codes_expires_at ON otp_codes(expires_at);
CREATE INDEX IF NOT EXISTS idx_otp_codes_created_at ON otp_codes(created_at);

-- Step 4: Insert OTP system settings (with category column)
INSERT INTO system_settings (setting_key, setting_value, setting_type, category, description, is_public)
VALUES 
    ('otp_enabled', 'true', 'boolean', 'security', 'Enable/disable OTP system globally', true),
    ('otp_required_for_login', 'true', 'boolean', 'security', 'Require OTP for email/password login', true),
    ('otp_required_for_phone_verification', 'false', 'boolean', 'security', 'Require OTP for phone verification', true),
    ('otp_required_for_address_generation', 'false', 'boolean', 'security', 'Require OTP for address generation', true),
    ('otp_sms_provider', 'twilio', 'string', 'notifications', 'SMS provider (twilio, africastalking, disabled)', false),
    ('otp_sms_sender_id', 'KIVRO', 'string', 'notifications', 'SMS sender ID/name', false),
    ('otp_expiry_minutes', '5', 'number', 'security', 'OTP expiration time in minutes', true),
    ('otp_max_attempts', '3', 'number', 'security', 'Maximum verification attempts per OTP', true),
    ('otp_resend_cooldown_seconds', '60', 'number', 'security', 'Cooldown between OTP resends', true),
    ('otp_code_length', '6', 'number', 'security', 'Length of OTP code', false)
ON CONFLICT (setting_key) 
DO UPDATE SET 
    setting_value = EXCLUDED.setting_value,
    updated_at = NOW();

-- Step 5: Create function to generate random OTP code
CREATE OR REPLACE FUNCTION generate_otp_code(length INT DEFAULT 6)
RETURNS VARCHAR AS $$
DECLARE
    chars VARCHAR := '0123456789';
    result VARCHAR := '';
    i INT;
BEGIN
    FOR i IN 1..length LOOP
        result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    END LOOP;
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Step 6: Create function to create OTP
CREATE OR REPLACE FUNCTION create_otp(
    p_user_id UUID,
    p_phone_number VARCHAR,
    p_purpose VARCHAR,
    p_ip_address VARCHAR DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS TABLE(
    success BOOLEAN,
    message TEXT,
    otp_id UUID,
    otp_code VARCHAR,
    expires_at TIMESTAMPTZ
) AS $$
DECLARE
    v_otp_code VARCHAR;
    v_expires_at TIMESTAMPTZ;
    v_otp_id UUID;
    v_expiry_minutes INT;
    v_recent_otp_count INT;
BEGIN
    -- Get expiry minutes from settings
    SELECT setting_value::INT INTO v_expiry_minutes
    FROM system_settings
    WHERE setting_key = 'otp_expiry_minutes';
    
    IF v_expiry_minutes IS NULL THEN
        v_expiry_minutes := 5;
    END IF;

    -- Check for recent OTP requests (rate limiting - max 3 per 5 minutes)
    SELECT COUNT(*) INTO v_recent_otp_count
    FROM otp_codes
    WHERE phone_number = p_phone_number
        AND purpose = p_purpose
        AND created_at > NOW() - INTERVAL '5 minutes';
    
    IF v_recent_otp_count >= 3 THEN
        RETURN QUERY SELECT 
            false,
            'Too many OTP requests. Please try again later.'::TEXT,
            NULL::UUID,
            NULL::VARCHAR,
            NULL::TIMESTAMPTZ;
        RETURN;
    END IF;

    -- Generate OTP code
    v_otp_code := generate_otp_code(6);
    v_expires_at := NOW() + (v_expiry_minutes || ' minutes')::INTERVAL;

    -- Insert OTP record
    INSERT INTO otp_codes (
        user_id,
        phone_number,
        otp_code,
        purpose,
        expires_at,
        ip_address,
        user_agent
    ) VALUES (
        p_user_id,
        p_phone_number,
        v_otp_code,
        p_purpose,
        v_expires_at,
        p_ip_address,
        p_user_agent
    )
    RETURNING id INTO v_otp_id;

    -- Return success
    RETURN QUERY SELECT 
        true,
        'OTP generated successfully'::TEXT,
        v_otp_id,
        v_otp_code,
        v_expires_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 7: Create function to verify OTP
CREATE OR REPLACE FUNCTION verify_otp(
    p_phone_number VARCHAR,
    p_otp_code VARCHAR,
    p_purpose VARCHAR,
    p_ip_address VARCHAR DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS TABLE(
    success BOOLEAN,
    message TEXT,
    user_id UUID
) AS $$
DECLARE
    v_otp_record RECORD;
    v_max_attempts INT;
BEGIN
    -- Get max attempts from settings
    SELECT setting_value::INT INTO v_max_attempts
    FROM system_settings
    WHERE setting_key = 'otp_max_attempts';
    
    IF v_max_attempts IS NULL THEN
        v_max_attempts := 3;
    END IF;

    -- Find the most recent valid OTP
    SELECT * INTO v_otp_record
    FROM otp_codes
    WHERE phone_number = p_phone_number
        AND purpose = p_purpose
        AND verified_at IS NULL
        AND expires_at > NOW()
        AND attempts < v_max_attempts
    ORDER BY created_at DESC
    LIMIT 1;

    -- Check if OTP exists
    IF v_otp_record IS NULL THEN
        RETURN QUERY SELECT 
            false,
            'Invalid or expired OTP code'::TEXT,
            NULL::UUID;
        RETURN;
    END IF;

    -- Increment attempts
    UPDATE otp_codes
    SET attempts = attempts + 1,
        updated_at = NOW()
    WHERE id = v_otp_record.id;

    -- Check if code matches
    IF v_otp_record.otp_code != p_otp_code THEN
        IF v_otp_record.attempts + 1 >= v_max_attempts THEN
            RETURN QUERY SELECT 
                false,
                'Maximum verification attempts exceeded'::TEXT,
                NULL::UUID;
        ELSE
            RETURN QUERY SELECT 
                false,
                'Invalid OTP code'::TEXT,
                NULL::UUID;
        END IF;
        RETURN;
    END IF;

    -- Mark as verified
    UPDATE otp_codes
    SET verified_at = NOW(),
        updated_at = NOW()
    WHERE id = v_otp_record.id;

    -- Return success
    RETURN QUERY SELECT 
        true,
        'OTP verified successfully'::TEXT,
        v_otp_record.user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 8: Create function to clean up expired OTPs (run periodically)
CREATE OR REPLACE FUNCTION cleanup_expired_otps()
RETURNS INT AS $$
DECLARE
    deleted_count INT;
BEGIN
    DELETE FROM otp_codes
    WHERE expires_at < NOW() - INTERVAL '24 hours'
        OR (verified_at IS NOT NULL AND verified_at < NOW() - INTERVAL '7 days');
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Step 9: Create auto-update trigger for otp_codes
CREATE OR REPLACE FUNCTION update_otp_codes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_otp_codes_updated_at
    BEFORE UPDATE ON otp_codes
    FOR EACH ROW
    EXECUTE FUNCTION update_otp_codes_updated_at();

-- Step 10: System settings trigger already exists (created in earlier migration)
-- No need to recreate it

-- Step 11: Enable Row Level Security for otp_codes
ALTER TABLE otp_codes ENABLE ROW LEVEL SECURITY;

-- Step 12: Create RLS policies for otp_codes
-- Users can only view their own OTP codes
CREATE POLICY "Users can view own OTP codes"
    ON otp_codes FOR SELECT
    USING (auth.uid() = user_id);

-- Service role can manage all OTP codes
CREATE POLICY "Service role can manage OTP codes"
    ON otp_codes FOR ALL
    USING (auth.jwt()->>'role' = 'service_role');

-- Step 13: System settings RLS policies already exist (created in earlier migration)
-- No need to recreate them

-- =====================================================
-- Migration Complete
-- =====================================================
-- OTP system is now enabled and configured
-- 
-- To disable OTP:
-- UPDATE system_settings SET setting_value = 'false' WHERE setting_key = 'otp_enabled';
--
-- To disable OTP for login only:
-- UPDATE system_settings SET setting_value = 'false' WHERE setting_key = 'otp_required_for_login';
-- =====================================================

-- Output confirmation
DO $$
BEGIN
    RAISE NOTICE '✅ OTP System Migration Complete';
    RAISE NOTICE '📱 OTP is ENABLED for login authentication';
    RAISE NOTICE '🔐 Twilio SMS provider configured';
    RAISE NOTICE '⏱️  OTP expires in 5 minutes';
    RAISE NOTICE '🔄 Maximum 3 verification attempts per OTP';
    RAISE NOTICE '';
    RAISE NOTICE 'To test OTP:';
    RAISE NOTICE '1. Ensure user has phone_number in profiles table';
    RAISE NOTICE '2. Sign in with email/password';
    RAISE NOTICE '3. OTP will be sent via Twilio SMS';
    RAISE NOTICE '4. Enter 6-digit code to complete login';
END $$;
