const nodemailer = require('nodemailer');
const twilio = require('twilio');

class NotificationService {
  constructor() {
    // Initialize email transporter (optional)
    this.emailTransporter = null;
    if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
      try {
        // Use custom SMTP configuration
        this.emailTransporter = nodemailer.createTransport({
          host: process.env.EMAIL_HOST || 'send.one.com',
          port: parseInt(process.env.EMAIL_PORT) || 587,
          secure: false, // true for 465, false for other ports
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD
          },
          tls: {
            rejectUnauthorized: false // Accept self-signed certificates
          }
        });
      } catch (error) {
      }
    } else {
    }

    // Initialize Twilio client for SMS (optional)
    this.twilioClient = null;
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      try {
        this.twilioClient = twilio(
          process.env.TWILIO_ACCOUNT_SID,
          process.env.TWILIO_AUTH_TOKEN
        );
      } catch (error) {
      }
    } else {
    }
  }

  // Send congratulatory email for new address
  async sendAddressGeneratedEmail(recipientEmail, addressData) {
    if (!this.emailTransporter) {
      return { success: false, error: 'Email service not configured' };
    }

    try {
      const emailTemplate = this.generateEmailTemplate(addressData);
      
      const mailOptions = {
        from: process.env.EMAIL_FROM || 'noreply@kivro.africa',
        to: recipientEmail,
        subject: '🎉 Congratulations! Your KIVRO Address is Ready',
        html: emailTemplate,
        text: `Congratulations!\n\n${addressData.full_name ? `Hello ${addressData.full_name},\n\n` : ''}Your address is: ${addressData.display_address}\n\nYou can now receive packages and mail at this address. Share it with your friends and family!\n\nBest regards,\nThe KIVRO Team`
      };

      const result = await this.emailTransporter.sendMail(mailOptions);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Send congratulatory SMS for new address
  async sendAddressGeneratedSMS(phoneNumber, addressData) {
    if (!this.twilioClient) {
      return { success: false, error: 'SMS service not configured' };
    }

    try {
      const greeting = addressData.full_name ? `Hello ${addressData.full_name}!\n\n` : '';
      const smsMessage = `🎉 Congratulations!\n\n${greeting}Your KIVRO address is ready:\n${addressData.display_address}\n\nYou can now receive packages at this address. Welcome to KIVRO!`;

      const result = await this.twilioClient.messages.create({
        body: smsMessage,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phoneNumber
      });

      return { success: true, messageId: result.sid };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Send both email and SMS notifications
  async sendAddressNotifications(recipientEmail, phoneNumber, addressData) {
    const results = {
      email: { success: false },
      sms: { success: false }
    };

    // Send email if email is provided
    if (recipientEmail && this.isValidEmail(recipientEmail)) {
      results.email = await this.sendAddressGeneratedEmail(recipientEmail, addressData);
    } else if (recipientEmail) {
      results.email = { success: false, error: 'Invalid email format' };
    }

    // Send SMS if phone number is provided
    if (phoneNumber) {
      const formattedPhone = this.formatPhoneForSMS(phoneNumber);
      results.sms = await this.sendAddressGeneratedSMS(formattedPhone, addressData);
    }

    return results;
  }

  // Send email with KIVRO address details
  async sendKivroAddressEmail(recipientEmail, addressData, shareMessage = null) {
    if (!this.emailTransporter) {
      return { success: false, error: 'Email service not configured' };
    }

    try {
      const emailTemplate = this.generateShareEmailTemplate(addressData, shareMessage);
      
      const mailOptions = {
        from: process.env.EMAIL_FROM || 'noreply@kivro.africa',
        to: recipientEmail,
        subject: '📍 KIVRO Digital Address Shared With You',
        html: emailTemplate,
        text: `Hello!\n\nSomeone has shared their KIVRO digital address with you:\n\n${addressData.display_address || addressData.full_address}\n\nYou can use this address for deliveries and mail.\n\nBest regards,\nThe KIVRO Team`
      };

      const result = await this.emailTransporter.sendMail(mailOptions);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Generate HTML email template
  generateEmailTemplate(addressData) {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Your KIVRO Address is Ready!</title>
        <style>
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f4f4f4;
            }
            .container {
                background: white;
                padding: 30px;
                border-radius: 10px;
                box-shadow: 0 0 20px rgba(0,0,0,0.1);
            }
            .header {
                text-align: center;
                margin-bottom: 30px;
            }
            .logo {
                font-size: 28px;
                font-weight: bold;
                color: #2c5530;
                margin-bottom: 10px;
            }
            .congratulations {
                font-size: 24px;
                color: #2c5530;
                margin-bottom: 20px;
                text-align: center;
            }
            .address-box {
                background: #f8f9fa;
                border: 2px solid #2c5530;
                border-radius: 8px;
                padding: 20px;
                margin: 20px 0;
                text-align: center;
            }
            .address-label {
                font-size: 16px;
                color: #666;
                margin-bottom: 10px;
            }
            .address-text {
                font-size: 20px;
                font-weight: bold;
                color: #2c5530;
                font-family: 'Courier New', monospace;
            }
            .info-section {
                margin: 20px 0;
                padding: 15px;
                background: #e8f5e8;
                border-radius: 5px;
            }
            .footer {
                text-align: center;
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #eee;
                color: #666;
                font-size: 14px;
            }
            .cta-button {
                display: inline-block;
                background: #2c5530;
                color: white;
                padding: 12px 24px;
                text-decoration: none;
                border-radius: 5px;
                margin: 20px 0;
                font-weight: bold;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">🏠 KIVRO</div>
                <div style="color: #666;">Your Digital Address Solution</div>
            </div>
            
            <div class="congratulations">🎉 Congratulations!</div>
            
            ${addressData.full_name ? `<p>Hello <strong>${addressData.full_name}</strong>,</p>` : ''}
            <p>Your KIVRO address has been successfully generated and is now ready to use!</p>
            
            <div class="address-box">
                <div class="address-label">Your address is:</div>
                <div class="address-text">${addressData.display_address}</div>
            </div>
            
            <div class="info-section">
                <h3>📦 What's Next?</h3>
                <ul>
                    <li><strong>Share your address:</strong> Give this address to friends, family, and online stores</li>
                    <li><strong>Receive packages:</strong> All deliveries to this address will be routed to your location</li>
                    <li><strong>Track deliveries:</strong> Monitor your packages through the KIVRO app</li>
                </ul>
            </div>
            
            <div class="info-section">
                <h3>📍 Location Details</h3>
                <p><strong>Region:</strong> ${addressData.region}</p>
                <p><strong>District:</strong> ${addressData.district}</p>
                ${addressData.federal_member_state ? `<p><strong>State:</strong> ${addressData.federal_member_state}</p>` : ''}
            </div>
            
            <div style="text-align: center;">
                <a href="https://kivro.africa/dashboard" class="cta-button">View in Dashboard</a>
            </div>
            
            <div class="footer">
                <p>Thank you for choosing KIVRO!</p>
                <p>If you have any questions, contact us at support@kivro.africa</p>
                <p>© 2024 KIVRO. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  // Generate HTML email template for sharing addresses
  generateShareEmailTemplate(addressData, shareMessage = null) {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>KIVRO Address Shared With You</title>
        <style>
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f4f4f4;
            }
            .container {
                background: white;
                padding: 30px;
                border-radius: 10px;
                box-shadow: 0 0 20px rgba(0,0,0,0.1);
            }
            .header {
                text-align: center;
                margin-bottom: 30px;
            }
            .logo {
                font-size: 28px;
                font-weight: bold;
                color: #2c5530;
                margin-bottom: 10px;
            }
            .share-title {
                font-size: 24px;
                color: #2c5530;
                margin-bottom: 20px;
                text-align: center;
            }
            .address-box {
                background: #f8f9fa;
                border: 2px solid #2c5530;
                border-radius: 8px;
                padding: 20px;
                margin: 20px 0;
                text-align: center;
            }
            .address-label {
                font-size: 16px;
                color: #666;
                margin-bottom: 10px;
            }
            .address-text {
                font-size: 20px;
                font-weight: bold;
                color: #2c5530;
                font-family: 'Courier New', monospace;
            }
            .message-box {
                background: #e8f5e8;
                border-left: 4px solid #2c5530;
                padding: 15px;
                margin: 20px 0;
                border-radius: 0 5px 5px 0;
            }
            .info-section {
                margin: 20px 0;
                padding: 15px;
                background: #f0f8ff;
                border-radius: 5px;
            }
            .footer {
                text-align: center;
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #eee;
                color: #666;
                font-size: 14px;
            }
            .cta-button {
                display: inline-block;
                background: #2c5530;
                color: white;
                padding: 12px 24px;
                text-decoration: none;
                border-radius: 5px;
                margin: 20px 0;
                font-weight: bold;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">🏠 KIVRO</div>
                <div style="color: #666;">Your Digital Address Solution</div>
            </div>
            
            <div class="share-title">📍 Address Shared With You</div>
            
            <p>Hello!</p>
            <p>Someone has shared their KIVRO digital address with you. You can use this address for deliveries, mail, and location sharing.</p>
            
            ${shareMessage ? `
            <div class="message-box">
                <strong>Personal Message:</strong><br>
                "${shareMessage}"
            </div>
            ` : ''}
            
            <div class="address-box">
                <div class="address-label">KIVRO Digital Address:</div>
                <div class="address-text">${addressData.display_address || addressData.full_address}</div>
            </div>
            
            <div class="info-section">
                <h3>📦 How to Use This Address</h3>
                <ul>
                    <li><strong>For Deliveries:</strong> Use this address when ordering online or giving delivery instructions</li>
                    <li><strong>For Mail:</strong> This address can receive postal mail and packages</li>
                    <li><strong>For Location:</strong> Share this address instead of complex directions</li>
                </ul>
            </div>
            
            <div class="info-section">
                <h3>📍 Location Details</h3>
                <p><strong>Region:</strong> ${addressData.region || 'Not specified'}</p>
                <p><strong>District:</strong> ${addressData.district || 'Not specified'}</p>
                ${addressData.federal_member_state ? `<p><strong>State:</strong> ${addressData.federal_member_state}</p>` : ''}
                ${addressData.landmark ? `<p><strong>Landmark:</strong> ${addressData.landmark}</p>` : ''}
            </div>
            
            <div style="text-align: center;">
                <a href="https://kivro.africa" class="cta-button">Get Your Own KIVRO Address</a>
            </div>
            
            <div class="footer">
                <p>KIVRO makes digital addressing simple and reliable across Africa.</p>
                <p>Questions? Contact us at support@kivro.africa</p>
                <p>© 2024 KIVRO. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  // Validate email format
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Format phone number for SMS
  formatPhoneForSMS(phoneNumber) {
    // Remove all non-digits
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    
    // Add + if not present and starts with country code
    if (cleanNumber.startsWith('252') && !phoneNumber.startsWith('+')) {
      return '+' + cleanNumber;
    }
    
    return phoneNumber;
  }

  // Send email confirmation for new signups
  async sendConfirmationEmail(recipientEmail, userName, confirmationLink) {
    if (!this.emailTransporter) {
      return { success: false, error: 'Email service not configured' };
    }

    try {
      const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Confirm Your KIVRO Account</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Arial', sans-serif; background-color: #f4f4f4;">
            <div style="max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <!-- Header -->
                <div style="background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); padding: 40px 20px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: bold;">📧 Confirm Your Email</h1>
                    <p style="color: #dcfce7; margin: 10px 0 0 0; font-size: 16px;">Welcome to KIVRO!</p>
                </div>

                <!-- Content -->
                <div style="padding: 40px 30px;">
                    <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                        Hello <strong>${userName}</strong>,
                    </p>

                    <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                        Thank you for signing up with <strong>KIVRO</strong> - Somalia's revolutionary virtual address system! 🇸🇴
                    </p>

                    <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                        Please confirm your email address by clicking the button below:
                    </p>

                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${confirmationLink}" 
                           style="display: inline-block; background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 6px; font-size: 18px; font-weight: bold;">
                            Confirm Email Address
                        </a>
                    </div>

                    <p style="color: #666666; font-size: 14px; line-height: 1.6; margin: 30px 0 0 0;">
                        If the button doesn't work, copy and paste this link into your browser:
                    </p>
                    <p style="color: #16a34a; font-size: 13px; word-break: break-all; margin: 10px 0;">
                        ${confirmationLink}
                    </p>

                    <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 30px 0; border-radius: 4px;">
                        <p style="color: #92400e; margin: 0; font-size: 14px; line-height: 1.5;">
                            ⚠️ <strong>Security Note:</strong> If you didn't create a KIVRO account, please ignore this email.
                        </p>
                    </div>
                </div>

                <!-- Footer -->
                <div style="background-color: #f9f9f9; padding: 20px 30px; border-top: 1px solid #e5e7eb; text-align: center;">
                    <p style="color: #999999; font-size: 12px; margin: 0 0 10px 0;">
                        This email was sent from KIVRO - Virtual Address System
                    </p>
                    <p style="color: #999999; font-size: 12px; margin: 0;">
                        © ${new Date().getFullYear()} KIVRO. All rights reserved.
                    </p>
                </div>
            </div>
        </body>
        </html>
      `;

      const mailOptions = {
        from: `"KIVRO" <${process.env.EMAIL_FROM || process.env.EMAIL_USER || 'noreply@kivro.africa'}>`,
        to: recipientEmail,
        subject: '📧 Confirm Your KIVRO Account',
        html: emailHtml
      };

      const result = await this.emailTransporter.sendMail(mailOptions);
      return { success: true, messageId: result.messageId };

    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Send welcome email for new users
  async sendWelcomeEmail(recipientEmail, userName, userType = 'user') {
    if (!this.emailTransporter) {
      return false;
    }

    try {
      const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Welcome to KIVRO</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Arial', sans-serif; background-color: #f4f4f4;">
            <div style="max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <!-- Header -->
                <div style="background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); padding: 40px 20px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: bold;">🎉 Welcome to KIVRO!</h1>
                    <p style="color: #dcfce7; margin: 10px 0 0 0; font-size: 16px;">Your Virtual Address System</p>
                </div>

                <!-- Content -->
                <div style="padding: 40px 30px;">
                    <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                        Hello <strong>${userName}</strong>,
                    </p>

                    <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                        Welcome to <strong>KIVRO</strong> - Somalia's revolutionary virtual address system! 🇸🇴
                    </p>

                    ${userType === 'courier' ? `
                    <div style="background-color: #dcfce7; border-left: 4px solid #16a34a; padding: 15px; margin: 20px 0; border-radius: 4px;">
                        <h3 style="color: #15803d; margin: 0 0 10px 0; font-size: 18px;">🚚 Courier Account Created</h3>
                        <p style="color: #166534; margin: 0; font-size: 14px; line-height: 1.5;">
                            Your courier account has been successfully created! You can now access the courier dashboard and start delivering packages.
                        </p>
                    </div>
                    ` : `
                    <div style="background-color: #dcfce7; border-left: 4px solid #16a34a; padding: 15px; margin: 20px 0; border-radius: 4px;">
                        <h3 style="color: #15803d; margin: 0 0 10px 0; font-size: 18px;">📦 Your Account is Ready</h3>
                        <p style="color: #166534; margin: 0; font-size: 14px; line-height: 1.5;">
                            You can now generate your KIVRO addresses, manage deliveries, and enjoy our virtual address services.
                        </p>
                    </div>
                    `}

                    <h3 style="color: #333333; font-size: 18px; margin: 30px 0 15px 0;">What you can do:</h3>
                    <ul style="color: #555555; font-size: 15px; line-height: 1.8; padding-left: 20px;">
                        <li>🏠 Generate unique virtual addresses</li>
                        <li>📍 Track package locations in real-time</li>
                        <li>📱 Manage all your addresses from one dashboard</li>
                        <li>👍 Share addresses easily with others</li>
                        ${userType === 'courier' ? '<li>🚚 Access delivery navigation and package details</li>' : ''}
                    </ul>

                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${process.env.FRONTEND_URL || 'http://localhost:8080'}/auth" 
                           style="display: inline-block; background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-size: 16px; font-weight: bold;">
                            Get Started →
                        </a>
                    </div>

                    <p style="color: #666666; font-size: 14px; line-height: 1.6; margin: 30px 0 0 0;">
                        If you have any questions, please don't hesitate to reach out to our support team.
                    </p>
                </div>

                <!-- Footer -->
                <div style="background-color: #f9f9f9; padding: 20px 30px; border-top: 1px solid #e5e7eb; text-align: center;">
                    <p style="color: #999999; font-size: 12px; margin: 0 0 10px 0;">
                        This email was sent from KIVRO - Virtual Address System
                    </p>
                    <p style="color: #999999; font-size: 12px; margin: 0;">
                        © ${new Date().getFullYear()} KIVRO. All rights reserved.
                    </p>
                </div>
            </div>
        </body>
        </html>
      `;

      const mailOptions = {
        from: `"KIVRO" <${process.env.EMAIL_USER || 'noreply@kivro.africa'}>`,
        to: recipientEmail,
        subject: userType === 'courier' ? '🚚 Welcome to KIVRO - Courier Account Created!' : '🎉 Welcome to KIVRO - Your Account is Ready!',
        html: emailHtml
      };

      await this.emailTransporter.sendMail(mailOptions);
      return true;

    } catch (error) {
      return false;
    }
  }

  // Send custom email from admin
  async sendCustomEmail(recipientEmail, recipientName, subject, message) {
    if (!this.emailTransporter) {
      return false;
    }

    try {
      const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${subject}</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Arial', sans-serif; background-color: #f4f4f4;">
            <div style="max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <!-- Header -->
                <div style="background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); padding: 30px 20px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">KIVRO</h1>
                    <p style="color: #dcfce7; margin: 10px 0 0 0; font-size: 14px;">Virtual Address System</p>
                </div>

                <!-- Content -->
                <div style="padding: 40px 30px;">
                    <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                        Hello <strong>${recipientName}</strong>,
                    </p>

                    <div style="color: #333333; font-size: 15px; line-height: 1.8; margin: 20px 0;">
                        ${message.replace(/\n/g, '<br>')}
                    </div>

                    <p style="color: #666666; font-size: 14px; line-height: 1.6; margin: 30px 0 0 0;">
                        Best regards,<br>
                        <strong>The KIVRO Team</strong>
                    </p>
                </div>

                <!-- Footer -->
                <div style="background-color: #f9f9f9; padding: 20px 30px; border-top: 1px solid #e5e7eb; text-align: center;">
                    <p style="color: #999999; font-size: 12px; margin: 0 0 10px 0;">
                        This email was sent from KIVRO - Virtual Address System
                    </p>
                    <p style="color: #999999; font-size: 12px; margin: 0;">
                        © ${new Date().getFullYear()} KIVRO. All rights reserved.
                    </p>
                </div>
            </div>
        </body>
        </html>
      `;

      const mailOptions = {
        from: `"KIVRO" <${process.env.EMAIL_USER || 'noreply@kivro.africa'}>`,
        to: recipientEmail,
        subject: subject,
        html: emailHtml
      };

      await this.emailTransporter.sendMail(mailOptions);
      return true;

    } catch (error) {
      return false;
    }
  }
}

module.exports = new NotificationService();
