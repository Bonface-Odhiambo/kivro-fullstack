// Test SMS Sending Directly
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const twilio = require('twilio');
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

async function sendTestSMS() {
    try {
        
        // Test with US number (usually enabled by default)
        const phoneNumber = '+1234567890'; // Replace with a real US number if you have one
        const message = 'Test SMS from KIVRO: Your verification code is 123456. This is a test message.';
        
        
        const result = await client.messages.create({
            body: message,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: phoneNumber
        });
        
        
    } catch (error) {
        
        // Common Twilio error codes
        if (error.code === 21211) {
        } else if (error.code === 21608) {
        } else if (error.code === 21614) {
        }
    }
}

sendTestSMS();
