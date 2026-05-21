// Test Twilio Credentials
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
require('dotenv').config(); // Also try current directory

const twilio = require('twilio');


if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_PHONE_NUMBER) {
    process.exit(1);
}

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

async function testTwilio() {
    try {
        
        // Test 1: Get account info
        const account = await client.api.accounts(process.env.TWILIO_ACCOUNT_SID).fetch();
        
        // Test 2: List phone numbers
        const phoneNumbers = await client.incomingPhoneNumbers.list({ limit: 5 });
        
        if (phoneNumbers.length > 0) {
        }
        
        
    } catch (error) {
        
        if (error.code === 20003) {
        } else if (error.code === 21608) {
        }
    }
}

testTwilio();
