================================================================================
KIVRO OTP (One-Time Password) SYSTEM
================================================================================
Status: DISABLED by default
Created: 2025-10-22
Purpose: Phone number verification and secure authentication

================================================================================
OVERVIEW
================================================================================

The OTP system provides secure phone number verification for KIVRO users.
It is currently DISABLED and ready for testing when you're ready to enable it.

Features:
✅ 6-digit OTP codes
✅ SMS delivery (when provider configured)
✅ Multiple purposes (login, phone verification, address generation, etc.)
✅ Rate limiting and security
✅ Expiration and attempt limits
✅ Resend with cooldown
✅ Audit logging

================================================================================
FILES CREATED
================================================================================

DATABASE:
📄 supabase/migrations/20251022000000_create_otp_system.sql
   - Creates otp_codes table
   - Creates otp_verification_logs table
   - Creates system_settings table
   - Database functions: create_otp(), verify_otp(), is_otp_required()
   - RLS policies for security

BACKEND:
📄 backend/services/otpService.js
   - OTP generation and verification logic
   - SMS sending (placeholder for Twilio/Africa's Talking)
   - Rate limiting and cooldown management

📄 backend/routes/otp.js
   - API endpoints for OTP operations
   - Validation middleware

FRONTEND:
📄 src/components/OTPInput.tsx
   - React component for OTP input
   - Auto-focus and paste support
   - Countdown timers
   - Resend functionality

================================================================================
HOW TO ENABLE OTP SYSTEM
================================================================================

STEP 1: Run Database Migration
-------------------------------
Run the migration file:
supabase/migrations/20251022000000_create_otp_system.sql

This creates all necessary tables and functions.

STEP 2: Enable OTP System
--------------------------
Execute this SQL command in Supabase:

UPDATE system_settings 
SET setting_value = 'true' 
WHERE setting_key = 'otp_enabled';

STEP 3: Configure OTP Settings (Optional)
------------------------------------------
You can customize these settings in the system_settings table:

-- Enable OTP for specific actions
UPDATE system_settings SET setting_value = 'true' 
WHERE setting_key = 'otp_required_for_login';

UPDATE system_settings SET setting_value = 'true' 
WHERE setting_key = 'otp_required_for_phone_verification';

UPDATE system_settings SET setting_value = 'true' 
WHERE setting_key = 'otp_required_for_address_generation';

-- Adjust timing
UPDATE system_settings SET setting_value = '10' 
WHERE setting_key = 'otp_expiry_minutes'; -- Default: 5 minutes

UPDATE system_settings SET setting_value = '5' 
WHERE setting_key = 'otp_max_attempts'; -- Default: 3 attempts

UPDATE system_settings SET setting_value = '120' 
WHERE setting_key = 'otp_resend_cooldown_seconds'; -- Default: 300 seconds (5 minutes)

STEP 4: Configure SMS Provider (When Ready)
--------------------------------------------
Currently SMS is DISABLED. When ready to send actual SMS:

Option A: Twilio
----------------
1. Sign up at twilio.com
2. Get Account SID, Auth Token, and Phone Number
3. Add to .env file:
   TWILIO_ACCOUNT_SID=your_account_sid
   TWILIO_AUTH_TOKEN=your_auth_token
   TWILIO_PHONE_NUMBER=your_twilio_number

4. Update system settings:
   UPDATE system_settings SET setting_value = 'twilio' 
   WHERE setting_key = 'otp_sms_provider';

5. Uncomment Twilio code in backend/services/otpService.js

Option B: Africa's Talking
---------------------------
1. Sign up at africastalking.com
2. Get API Key and Username
3. Add to .env file:
   AFRICASTALKING_API_KEY=your_api_key
   AFRICASTALKING_USERNAME=your_username

4. Update system settings:
   UPDATE system_settings SET setting_value = 'africastalking' 
   WHERE setting_key = 'otp_sms_provider';

5. Uncomment Africa's Talking code in backend/services/otpService.js

================================================================================
API ENDPOINTS
================================================================================

GET /api/otp/status
-------------------
Check if OTP system is enabled
Response: { "enabled": true/false }

GET /api/otp/settings
---------------------
Get OTP configuration settings
Response: { "settings": {...} }

POST /api/otp/generate
----------------------
Generate and send OTP
Body: {
  "phone_number": "+252612345678",
  "purpose": "phone_verification"
}
Response: {
  "success": true,
  "otpId": "uuid",
  "expiresAt": "2025-10-22T10:00:00Z"
}

POST /api/otp/verify
--------------------
Verify OTP code
Body: {
  "phone_number": "+252612345678",
  "otp_code": "123456",
  "purpose": "phone_verification"
}
Response: {
  "success": true,
  "verified": true,
  "userId": "uuid"
}

POST /api/otp/resend
--------------------
Resend OTP (with cooldown check)
Body: {
  "phone_number": "+252612345678",
  "purpose": "phone_verification"
}

GET /api/otp/required/:action
------------------------------
Check if OTP is required for an action
Actions: login, phone_verification, address_generation
Response: { "required": true/false }

================================================================================
FRONTEND USAGE
================================================================================

Import the OTP component:
-------------------------
import OTPInput from '@/components/OTPInput';

Use in your component:
----------------------
<OTPInput
  phoneNumber="+252612345678"
  purpose="phone_verification"
  onVerified={(userId) => {
    console.log('Phone verified!', userId);
    // Proceed with next step
  }}
  onCancel={() => {
    // User cancelled
  }}
  autoSend={true} // Auto-send OTP on mount
/>

================================================================================
OTP PURPOSES
================================================================================

1. phone_verification - Verify user's phone number
2. login - Two-factor authentication for login
3. address_generation - Verify before generating KIVRO address
4. transaction - Verify sensitive transactions
5. password_reset - Verify identity for password reset

================================================================================
SECURITY FEATURES
================================================================================

✅ Rate Limiting
   - Max 3 OTPs per phone in 10 minutes
   - Prevents spam and abuse

✅ Expiration
   - OTPs expire after 5 minutes (configurable)
   - Expired OTPs cannot be used

✅ Attempt Limits
   - Max 3 verification attempts per OTP (configurable)
   - Prevents brute force attacks

✅ Resend Cooldown
   - 5-minute wait between resends (matches OTP expiry)
   - Prevents SMS flooding and abuse

✅ Audit Logging
   - All verification attempts logged
   - Includes IP address and user agent
   - Success/failure tracking

✅ Row Level Security (RLS)
   - Users can only see their own OTPs
   - Admins have full access
   - Service role for backend operations

================================================================================
TESTING (DEVELOPMENT MODE)
================================================================================

When SMS is disabled (default), OTP codes are:
1. Logged to backend console
2. Returned in API response (development only)

Example console output:
📱 SMS disabled - OTP code for +252612345678: 123456
   Purpose: phone_verification
   ⚠️ Enable SMS provider in system_settings to send actual SMS

This allows testing without SMS costs.

================================================================================
DATABASE TABLES
================================================================================

otp_codes
---------
- id (UUID)
- user_id (UUID, nullable)
- phone_number (VARCHAR)
- otp_code (VARCHAR(6))
- purpose (VARCHAR)
- is_used (BOOLEAN)
- is_expired (BOOLEAN)
- attempts (INTEGER)
- max_attempts (INTEGER)
- expires_at (TIMESTAMP)
- created_at (TIMESTAMP)
- used_at (TIMESTAMP)
- ip_address (INET)
- user_agent (TEXT)

otp_verification_logs
---------------------
- id (UUID)
- otp_id (UUID)
- user_id (UUID)
- phone_number (VARCHAR)
- verification_status (VARCHAR) -- success, failed, expired, max_attempts
- ip_address (INET)
- user_agent (TEXT)
- created_at (TIMESTAMP)

system_settings
---------------
- id (UUID)
- setting_key (VARCHAR) -- unique
- setting_value (TEXT)
- setting_type (VARCHAR) -- string, boolean, number, json
- description (TEXT)
- is_public (BOOLEAN)
- updated_at (TIMESTAMP)
- updated_by (UUID)

================================================================================
CLEANUP
================================================================================

Automatic cleanup of old OTPs:
-------------------------------
Run this periodically (e.g., daily cron job):

SELECT cleanup_expired_otps();

This deletes OTPs older than 24 hours.

================================================================================
MONITORING
================================================================================

Check OTP usage:
----------------
SELECT 
  purpose,
  COUNT(*) as total,
  SUM(CASE WHEN is_used THEN 1 ELSE 0 END) as used,
  SUM(CASE WHEN is_expired THEN 1 ELSE 0 END) as expired
FROM otp_codes
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY purpose;

Check verification success rate:
--------------------------------
SELECT 
  verification_status,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM otp_verification_logs
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY verification_status;

================================================================================
TROUBLESHOOTING
================================================================================

OTP not sending:
----------------
1. Check if OTP system is enabled:
   SELECT setting_value FROM system_settings WHERE setting_key = 'otp_enabled';

2. Check SMS provider:
   SELECT setting_value FROM system_settings WHERE setting_key = 'otp_sms_provider';

3. Check backend logs for OTP code (development mode)

OTP verification failing:
-------------------------
1. Check if OTP is expired
2. Check attempt count (max 3 by default)
3. Verify phone number format matches exactly
4. Check otp_verification_logs for details

Rate limit errors:
------------------
1. Check recent OTP requests:
   SELECT * FROM otp_codes 
   WHERE phone_number = '+252612345678' 
   AND created_at > NOW() - INTERVAL '10 minutes';

2. Wait 10 minutes or clear old OTPs

================================================================================
FUTURE ENHANCEMENTS
================================================================================

Potential additions when needed:
- Email OTP (in addition to SMS)
- Voice call OTP
- Backup codes
- Remember device (skip OTP for trusted devices)
- Biometric verification
- Integration with authenticator apps (TOTP)

================================================================================
SUPPORT
================================================================================

For questions or issues:
1. Check backend logs
2. Check otp_verification_logs table
3. Verify system_settings configuration
4. Test with development mode first (SMS disabled)

================================================================================
END OF DOCUMENTATION
================================================================================
