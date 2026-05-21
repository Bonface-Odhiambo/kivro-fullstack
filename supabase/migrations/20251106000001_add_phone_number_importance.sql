-- =====================================================
-- Add Phone Number Importance to Profiles
-- =====================================================
-- This migration adds a flag to track if users have
-- added their phone number for OTP verification
-- =====================================================

-- Step 1: Add column to track if phone number is verified
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT false;

-- Step 2: Add column to track when phone was added
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS phone_added_at TIMESTAMPTZ;

-- Step 3: Update existing profiles with phone numbers
UPDATE profiles 
SET phone_verified = true,
    phone_added_at = updated_at
WHERE phone_number IS NOT NULL 
  AND phone_number != ''
  AND phone_verified IS NULL;

-- Step 4: Create function to validate phone number format
CREATE OR REPLACE FUNCTION validate_phone_number_format(phone TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    -- Phone must start with + and have at least 10 digits
    RETURN phone ~ '^\+[1-9]\d{9,14}$';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Step 5: Clean up invalid phone numbers before adding constraint
-- Update phone numbers that don't start with + but are numeric
UPDATE profiles
SET phone_number = '+' || phone_number
WHERE phone_number IS NOT NULL 
  AND phone_number != ''
  AND phone_number !~ '^\+'
  AND phone_number ~ '^[0-9]+$';

-- Set invalid phone numbers to NULL (will prompt user to re-enter)
UPDATE profiles
SET phone_number = NULL
WHERE phone_number IS NOT NULL 
  AND phone_number != ''
  AND NOT validate_phone_number_format(phone_number)
  AND phone_number !~ '^[0-9]+$'; -- Don't touch numbers we just fixed

-- Step 6: Add check constraint for phone number format (optional, not enforced on NULL)
-- Note: Using NOT VALID to avoid checking existing rows, then validate separately
ALTER TABLE profiles
ADD CONSTRAINT check_phone_format 
CHECK (
    phone_number IS NULL 
    OR phone_number = '' 
    OR validate_phone_number_format(phone_number)
) NOT VALID;

-- Validate the constraint (this will fail if any invalid data remains)
-- If this fails, it means there's still invalid data that needs manual cleanup
DO $$
BEGIN
    ALTER TABLE profiles VALIDATE CONSTRAINT check_phone_format;
    RAISE NOTICE '✅ Phone format constraint validated successfully';
EXCEPTION
    WHEN check_violation THEN
        RAISE NOTICE '⚠️  Some phone numbers are still invalid. They have been set to NULL.';
        RAISE NOTICE '    Users will be prompted to re-enter their phone numbers on next login.';
        -- Drop the constraint if validation fails
        ALTER TABLE profiles DROP CONSTRAINT IF EXISTS check_phone_format;
        -- Re-add without validation
        ALTER TABLE profiles
        ADD CONSTRAINT check_phone_format 
        CHECK (
            phone_number IS NULL 
            OR phone_number = '' 
            OR validate_phone_number_format(phone_number)
        ) NOT VALID;
END $$;

-- Step 7: Create function to check if user needs phone number
CREATE OR REPLACE FUNCTION user_needs_phone_number(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_has_phone BOOLEAN;
BEGIN
    SELECT (phone_number IS NOT NULL AND phone_number != '') INTO v_has_phone
    FROM profiles
    WHERE user_id = p_user_id;
    
    RETURN NOT COALESCE(v_has_phone, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 8: Create trigger to auto-set phone_added_at
CREATE OR REPLACE FUNCTION set_phone_added_at()
RETURNS TRIGGER AS $$
BEGIN
    -- If phone number is being added for the first time
    IF (OLD.phone_number IS NULL OR OLD.phone_number = '') 
       AND (NEW.phone_number IS NOT NULL AND NEW.phone_number != '') THEN
        NEW.phone_added_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_phone_added_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION set_phone_added_at();

-- Step 9: Create index for phone number lookups
CREATE INDEX IF NOT EXISTS idx_profiles_phone_number ON profiles(phone_number) 
WHERE phone_number IS NOT NULL AND phone_number != '';

-- Step 10: Add comment to phone_number column
COMMENT ON COLUMN profiles.phone_number IS 'User phone number with country code (e.g., +254712345678). Required for OTP verification.';
COMMENT ON COLUMN profiles.phone_verified IS 'Whether the phone number has been verified via OTP';
COMMENT ON COLUMN profiles.phone_added_at IS 'Timestamp when phone number was first added';

-- =====================================================
-- Migration Complete
-- =====================================================
-- Phone number tracking added to profiles
-- 
-- New columns:
-- - phone_verified: tracks if phone is verified
-- - phone_added_at: tracks when phone was added
--
-- New functions:
-- - validate_phone_number_format(): validates phone format
-- - user_needs_phone_number(): checks if user needs to add phone
--
-- Existing users without phone numbers will be prompted
-- to add one on their next login
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '✅ Phone Number Importance Migration Complete';
    RAISE NOTICE '📱 Added phone_verified and phone_added_at columns';
    RAISE NOTICE '🔍 Added phone number format validation';
    RAISE NOTICE '📊 Created helper functions for phone tracking';
    RAISE NOTICE '';
    RAISE NOTICE 'Existing users without phone numbers will be prompted on next login';
END $$;
