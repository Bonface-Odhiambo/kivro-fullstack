const { supabase } = require('../config/supabase');

/**
 * OTP Service for KIVRO
 * Handles OTP generation, verification, and SMS sending
 * Status: DISABLED by default - enable via system_settings
 */

class OTPService {
  /**
   * Check if OTP system is enabled
   */
  async isOTPEnabled() {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('setting_value')
        .eq('setting_key', 'otp_enabled')
        .single();

      if (error) {
        // If table doesn't exist or setting not found, default to enabled for development
        if (error.code === '42P01' || error.code === 'PGRST116') {
          return true; // Default to enabled for development
        }
        return false;
      }

      return data?.setting_value === 'true';
    } catch (error) {
      // Default to enabled in development
      return process.env.NODE_ENV === 'development';
    }
  }

  /**
   * Check if OTP is required for a specific action
   */
  async isOTPRequired(action) {
    try {
      const isEnabled = await this.isOTPEnabled();
      if (!isEnabled) return false;

      const settingKeyMap = {
        'login': 'otp_required_for_login',
        'phone_verification': 'otp_required_for_phone_verification',
        'address_generation': 'otp_required_for_address_generation'
      };

      const settingKey = settingKeyMap[action];
      if (!settingKey) return false;

      const { data, error } = await supabase
        .from('system_settings')
        .select('setting_value')
        .eq('setting_key', settingKey)
        .single();

      if (error) return false;

      return data?.setting_value === 'true';
    } catch (error) {
      return false;
    }
  }

  /**
   * Generate and send OTP
   */
  async generateOTP(userId, phoneNumber, purpose, ipAddress = null, userAgent = null) {
    try {

      // Check if OTP is enabled
      const isEnabled = await this.isOTPEnabled();
      if (!isEnabled) {
        return {
          success: false,
          message: 'OTP system is currently disabled',
          otpRequired: false
        };
      }

      // Call database function to create OTP
      const { data, error } = await supabase.rpc('create_otp', {
        p_user_id: userId,
        p_phone_number: phoneNumber,
        p_purpose: purpose,
        p_ip_address: ipAddress,
        p_user_agent: userAgent
      });

      if (error) {
        // If function doesn't exist, generate OTP manually for development
        if (error.code === '42883' || error.message?.includes('function') || error.message?.includes('does not exist')) {
          
          // Generate simple OTP for development
          const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
          const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
          
          
          // Send OTP via both SMS and Email
          const smsSent = await this.sendOTPSMS(phoneNumber, otpCode, purpose);
          const emailSent = await this.sendOTPEmail(userId, otpCode, purpose);
          
          // Determine success message
          let message = '';
          if (smsSent && emailSent) {
            message = 'OTP sent successfully via SMS and Email';
          } else if (emailSent) {
            message = 'OTP sent successfully via Email (SMS unavailable)';
          } else if (smsSent) {
            message = 'OTP sent successfully via SMS';
          } else {
            message = 'OTP generated (check your email for the code)';
          }
          
          return {
            success: true,
            message,
            otpId: 'fallback-' + Date.now(),
            expiresAt: expiresAt,
            sentVia: {
              sms: smsSent,
              email: emailSent
            },
            // Always include OTP code in fallback mode for testing
            otpCode: otpCode
          };
        }
        
        return {
          success: false,
          message: 'Failed to generate OTP',
          error: error.message
        };
      }

      const otpData = data[0];

      if (!otpData.success) {
        return {
          success: false,
          message: otpData.message
        };
      }


      // Send OTP via both SMS and Email
      const smsSent = await this.sendOTPSMS(phoneNumber, otpData.otp_code, purpose);
      const emailSent = await this.sendOTPEmail(userId, otpData.otp_code, purpose);

      // Determine success message
      let message = '';
      if (smsSent && emailSent) {
        message = 'OTP sent successfully via SMS and Email';
      } else if (emailSent) {
        message = 'OTP sent successfully via Email (SMS unavailable)';
      } else if (smsSent) {
        message = 'OTP sent successfully via SMS';
      } else {
        message = 'OTP generated (check your email for the code)';
      }

      return {
        success: true,
        message,
        otpId: otpData.otp_id,
        expiresAt: otpData.expires_at,
        sentVia: {
          sms: smsSent,
          email: emailSent
        },
        // Only include OTP code in development mode when both failed
        ...(process.env.NODE_ENV === 'development' && !smsSent && !emailSent && { otpCode: otpData.otp_code })
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to generate OTP',
        error: error.message
      };
    }
  }

  /**
   * Verify OTP code
   */
  async verifyOTP(phoneNumber, otpCode, purpose, ipAddress = null, userAgent = null) {
    try {

      // Check if OTP is enabled
      const isEnabled = await this.isOTPEnabled();
      if (!isEnabled) {
        return {
          success: true,
          message: 'OTP verification skipped (system disabled)',
          verified: true
        };
      }


      // Call database function to verify OTP
      const { data, error } = await supabase.rpc('verify_otp', {
        p_phone_number: phoneNumber,
        p_otp_code: otpCode,
        p_purpose: purpose,
        p_ip_address: ipAddress,
        p_user_agent: userAgent
      });

      if (error) {
        // If function doesn't exist, use development fallback
        if (error.code === '42883' || error.code === 'PGRST203' || error.message?.includes('function') || error.message?.includes('does not exist')) {
          
          // In development, accept any valid 6-digit code
          if (otpCode && otpCode.length === 6 && /^\d{6}$/.test(otpCode)) {
            return {
              success: true,
              message: 'OTP verified successfully (fallback mode)',
              verified: true
            };
          } else {
            return {
              success: false,
              message: 'Invalid OTP code format',
              verified: false
            };
          }
        }
        
        return {
          success: false,
          message: 'Failed to verify OTP',
          error: error.message
        };
      }

      const result = data[0];

      if (result.success) {
      } else {
      }

      return {
        success: result.success,
        message: result.message,
        userId: result.user_id,
        verified: result.success
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to verify OTP',
        error: error.message
      };
    }
  }

  /**
   * Send OTP via SMS
   * Currently disabled - implement when SMS provider is configured
   */
  async sendOTPSMS(phoneNumber, otpCode, purpose) {
    try {
      // Get SMS provider setting
      const { data: providerData } = await supabase
        .from('system_settings')
        .select('setting_value')
        .eq('setting_key', 'otp_sms_provider')
        .single();

      const provider = providerData?.setting_value || 'disabled';

      if (provider === 'disabled') {
        return false;
      }

      // Get sender ID
      const { data: senderData } = await supabase
        .from('system_settings')
        .select('setting_value')
        .eq('setting_key', 'otp_sms_sender_id')
        .single();

      const senderId = senderData?.setting_value || 'KIVRO';

      // Prepare SMS message
      const message = this.getOTPMessage(otpCode, purpose);

      // Send via configured provider
      switch (provider) {
        case 'twilio':
          return await this.sendViaTwilio(phoneNumber, message);
        
        case 'africastalking':
          return await this.sendViaAfricasTalking(phoneNumber, message, senderId);
        
        default:
          return false;
      }
    } catch (error) {
      return false;
    }
  }

  /**
   * Get OTP message template
   */
  getOTPMessage(otpCode, purpose) {
    const messages = {
      'phone_verification': `Your KIVRO verification code is: ${otpCode}. Valid for 5 minutes. Do not share this code.`,
      'login': `Your KIVRO login code is: ${otpCode}. Valid for 5 minutes. Do not share this code.`,
      'address_generation': `Your KIVRO address generation code is: ${otpCode}. Valid for 5 minutes.`,
      'transaction': `Your KIVRO transaction code is: ${otpCode}. Valid for 5 minutes.`,
      'password_reset': `Your KIVRO password reset code is: ${otpCode}. Valid for 5 minutes.`
    };

    return messages[purpose] || `Your KIVRO verification code is: ${otpCode}. Valid for 5 minutes.`;
  }

  /**
   * Send OTP via Email using Supabase
   */
  async sendOTPEmail(userId, otpCode, purpose) {
    try {
      // Get user email from profiles
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('email, full_name')
        .eq('user_id', userId)
        .single();

      if (profileError || !profile?.email) {
        return false;
      }

      const email = profile.email;
      const name = profile.full_name || 'User';

      // Get email message
      const { subject, htmlBody, textBody } = this.getOTPEmailContent(otpCode, purpose, name);


      // Use notificationService to send email
      const notificationService = require('./notificationService');
      const emailSent = await notificationService.sendCustomEmail(
        email,
        subject,
        htmlBody,
        textBody
      );

      if (emailSent) {
        return true;
      } else {
        return false;
      }
    } catch (error) {
      return false;
    }
  }

  /**
   * Get OTP email content
   */
  getOTPEmailContent(otpCode, purpose, userName) {
    const purposeTitles = {
      'phone_verification': 'Phone Verification',
      'login': 'Login Verification',
      'address_generation': 'Address Generation',
      'transaction': 'Transaction Verification',
      'password_reset': 'Password Reset'
    };

    const title = purposeTitles[purpose] || 'Verification';

    const subject = `Your KIVRO ${title} Code: ${otpCode}`;

    const htmlBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .otp-box { background: white; border: 2px solid #10b981; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }
          .otp-code { font-size: 32px; font-weight: bold; color: #10b981; letter-spacing: 8px; }
          .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px; }
          .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 KIVRO ${title}</h1>
            <p>Your verification code is ready</p>
          </div>
          <div class="content">
            <p>Hi ${userName},</p>
            <p>Your KIVRO verification code for <strong>${title}</strong> is:</p>
            
            <div class="otp-box">
              <div class="otp-code">${otpCode}</div>
              <p style="color: #6b7280; margin-top: 10px;">Valid for 5 minutes</p>
            </div>

            <div class="warning">
              <strong>⚠️ Security Notice:</strong>
              <ul style="margin: 10px 0;">
                <li>Never share this code with anyone</li>
                <li>KIVRO staff will never ask for your OTP code</li>
                <li>This code expires in 5 minutes</li>
              </ul>
            </div>

            <p>If you didn't request this code, please ignore this email or contact our support team.</p>

            <div class="footer">
              <p>© ${new Date().getFullYear()} KIVRO - Digital Address & Communication Platform</p>
              <p>🌍 Connecting Africa Digitally | www.kivro.africa</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    const textBody = `
Hi ${userName},

Your KIVRO verification code for ${title} is: ${otpCode}

This code is valid for 5 minutes.

⚠️ Security Notice:
- Never share this code with anyone
- KIVRO staff will never ask for your OTP code
- This code expires in 5 minutes

If you didn't request this code, please ignore this email.

© ${new Date().getFullYear()} KIVRO - Digital Address & Communication Platform
🌍 Connecting Africa Digitally | www.kivro.africa
    `;

    return { subject, htmlBody, textBody };
  }

  /**
   * Send SMS via Twilio
   */
  async sendViaTwilio(phoneNumber, message) {
    try {
      // Check if Twilio credentials are configured
      if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_PHONE_NUMBER) {
        return false;
      }

      const twilio = require('twilio');
      const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
      
      
      const result = await client.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phoneNumber
      });

      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Send SMS via Africa's Talking (implement when needed)
   */
  async sendViaAfricasTalking(phoneNumber, message, senderId) {
    // TODO: Implement Africa's Talking integration
    // const AfricasTalking = require('africastalking');
    // const africastalking = AfricasTalking({
    //   apiKey: process.env.AFRICASTALKING_API_KEY,
    //   username: process.env.AFRICASTALKING_USERNAME
    // });
    // const sms = africastalking.SMS;
    // await sms.send({
    //   to: [phoneNumber],
    //   message: message,
    //   from: senderId
    // });
    
    return false;
  }

  /**
   * Resend OTP (with cooldown check)
   */
  async resendOTP(userId, phoneNumber, purpose, ipAddress = null, userAgent = null) {
    try {
      // Get cooldown setting
      const { data: cooldownData } = await supabase
        .from('system_settings')
        .select('setting_value')
        .eq('setting_key', 'otp_resend_cooldown_seconds')
        .single();

      const cooldownSeconds = parseInt(cooldownData?.setting_value || '300'); // Default: 5 minutes

      // Check if recent OTP exists
      const { data: recentOTP, error } = await supabase
        .from('otp_codes')
        .select('created_at')
        .eq('phone_number', phoneNumber)
        .eq('purpose', purpose)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (recentOTP && !error) {
        const timeSinceLastOTP = (Date.now() - new Date(recentOTP.created_at).getTime()) / 1000;
        
        if (timeSinceLastOTP < cooldownSeconds) {
          const waitTime = Math.ceil(cooldownSeconds - timeSinceLastOTP);
          return {
            success: false,
            message: `Please wait ${waitTime} seconds before requesting a new OTP`,
            waitTime
          };
        }
      }

      // Generate new OTP
      return await this.generateOTP(userId, phoneNumber, purpose, ipAddress, userAgent);
    } catch (error) {
      return {
        success: false,
        message: 'Failed to resend OTP',
        error: error.message
      };
    }
  }

  /**
   * Get OTP settings (for frontend)
   */
  async getOTPSettings() {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('setting_key, setting_value, setting_type')
        .eq('is_public', true)
        .like('setting_key', 'otp_%');

      if (error) {
        return null;
      }

      // Convert to object
      const settings = {};
      data.forEach(setting => {
        let value = setting.setting_value;
        
        // Convert based on type
        if (setting.setting_type === 'boolean') {
          value = value === 'true';
        } else if (setting.setting_type === 'number') {
          value = parseInt(value);
        }
        
        settings[setting.setting_key] = value;
      });

      return settings;
    } catch (error) {
      return null;
    }
  }
}

module.exports = new OTPService();
