-- =====================================================
-- KIVRO OTP System - Troubleshooting & Fix Script
-- =====================================================
-- Run this in Supabase SQL Editor to diagnose and fix OTP issues
-- =====================================================

-- Step 1: Check if system_settings table exists
DO $$
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'system_settings'
    ) THEN
        RAISE NOTICE '✅ system_settings table exists';
    ELSE
        RAISE NOTICE '❌ system_settings table DOES NOT exist';
        RAISE NOTICE '   Run migration: 20251106000000_enable_otp_system.sql';
    END IF;
END $$;

-- Step 2: Check if otp_codes table exists
DO $$
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'otp_codes'
    ) THEN
        RAISE NOTICE '✅ otp_codes table exists';
    ELSE
        RAISE NOTICE '❌ otp_codes table DOES NOT exist';
        RAISE NOTICE '   Run migration: 20251106000000_enable_otp_system.sql';
    END IF;
END $$;

-- Step 3: Check current OTP settings
SELECT 
    setting_key,
    setting_value,
    setting_type,
    description
FROM system_settings
WHERE setting_key LIKE 'otp_%'
ORDER BY setting_key;

-- Step 4: Fix OTP SMS Provider (set to Twilio)
-- This is the most important fix for SMS not sending
UPDATE system_settings
SET setting_value = 'twilio',
    updated_at = NOW()
WHERE setting_key = 'otp_sms_provider';

-- Step 5: Ensure OTP is enabled globally
UPDATE system_settings
SET setting_value = 'true',
    updated_at = NOW()
WHERE setting_key = 'otp_enabled';

-- Step 6: Ensure OTP is required for login
UPDATE system_settings
SET setting_value = 'true',
    updated_at = NOW()
WHERE setting_key = 'otp_required_for_login';

-- Step 7: Verify the changes
SELECT 
    '🔍 CURRENT OTP CONFIGURATION' as info;

SELECT 
    CASE 
        WHEN setting_value = 'true' OR setting_key = 'otp_sms_provider' THEN '✅'
        ELSE '❌'
    END as status,
    setting_key,
    setting_value,
    CASE setting_key
        WHEN 'otp_enabled' THEN 'OTP System Status'
        WHEN 'otp_required_for_login' THEN 'OTP Required for Login'
        WHEN 'otp_sms_provider' THEN 'SMS Provider (should be "twilio")'
        WHEN 'otp_expiry_minutes' THEN 'OTP Expiry Time'
        WHEN 'otp_max_attempts' THEN 'Max Verification Attempts'
        ELSE description
    END as meaning
FROM system_settings
WHERE setting_key IN (
    'otp_enabled',
    'otp_required_for_login',
    'otp_sms_provider',
    'otp_expiry_minutes',
    'otp_max_attempts'
)
ORDER BY 
    CASE setting_key
        WHEN 'otp_enabled' THEN 1
        WHEN 'otp_required_for_login' THEN 2
        WHEN 'otp_sms_provider' THEN 3
        WHEN 'otp_expiry_minutes' THEN 4
        WHEN 'otp_max_attempts' THEN 5
        ELSE 6
    END;

-- Step 8: Check if there are any recent OTP codes in the database
DO $$
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'otp_codes'
    ) THEN
        RAISE NOTICE '✅ Checking otp_codes table...';
        PERFORM COUNT(*) FROM otp_codes;
        RAISE NOTICE '   Table exists and is accessible';
    ELSE
        RAISE NOTICE '⚠️  otp_codes table does not exist yet';
        RAISE NOTICE '   Run migration: 20251106000000_enable_otp_system.sql';
    END IF;
END $$;

-- Step 9: Check profiles table for phone numbers
SELECT 
    COUNT(*) as total_profiles,
    COUNT(CASE WHEN phone_number IS NOT NULL AND phone_number != '' THEN 1 END) as profiles_with_phone,
    COUNT(CASE WHEN phone_number IS NULL OR phone_number = '' THEN 1 END) as profiles_without_phone
FROM profiles;

-- Step 10: Output final status
DO $$
DECLARE
    v_otp_enabled VARCHAR;
    v_sms_provider VARCHAR;
    v_login_required VARCHAR;
BEGIN
    -- Get current values
    SELECT setting_value INTO v_otp_enabled FROM system_settings WHERE setting_key = 'otp_enabled';
    SELECT setting_value INTO v_sms_provider FROM system_settings WHERE setting_key = 'otp_sms_provider';
    SELECT setting_value INTO v_login_required FROM system_settings WHERE setting_key = 'otp_required_for_login';
    
    RAISE NOTICE '';
    RAISE NOTICE '═══════════════════════════════════════════════════════';
    RAISE NOTICE '📱 KIVRO OTP SYSTEM STATUS';
    RAISE NOTICE '═══════════════════════════════════════════════════════';
    RAISE NOTICE '';
    
    IF v_otp_enabled = 'true' THEN
        RAISE NOTICE '✅ OTP System: ENABLED';
    ELSE
        RAISE NOTICE '❌ OTP System: DISABLED';
    END IF;
    
    IF v_login_required = 'true' THEN
        RAISE NOTICE '✅ OTP Required for Login: YES';
    ELSE
        RAISE NOTICE '❌ OTP Required for Login: NO';
    END IF;
    
    RAISE NOTICE '📲 SMS Provider: %', COALESCE(v_sms_provider, 'NOT SET');
    
    IF v_sms_provider = 'twilio' THEN
        RAISE NOTICE '✅ Twilio SMS: CONFIGURED';
        RAISE NOTICE '';
        RAISE NOTICE 'Verify Twilio credentials in backend .env file:';
        RAISE NOTICE '  - TWILIO_ACCOUNT_SID';
        RAISE NOTICE '  - TWILIO_AUTH_TOKEN';
        RAISE NOTICE '  - TWILIO_PHONE_NUMBER';
    ELSIF v_sms_provider = 'disabled' THEN
        RAISE NOTICE '⚠️  SMS is DISABLED - OTP codes will only appear in console logs';
    ELSE
        RAISE NOTICE '⚠️  SMS Provider: % (not fully implemented)', v_sms_provider;
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '═══════════════════════════════════════════════════════';
    RAISE NOTICE 'To test OTP system:';
    RAISE NOTICE '1. Ensure user has phone_number in profiles table';
    RAISE NOTICE '2. Restart backend server (to load updated settings)';
    RAISE NOTICE '3. Sign in with email/password';
    RAISE NOTICE '4. OTP will be sent via Twilio SMS';
    RAISE NOTICE '5. Enter 6-digit code in OTP modal';
    RAISE NOTICE '═══════════════════════════════════════════════════════';
END $$;
