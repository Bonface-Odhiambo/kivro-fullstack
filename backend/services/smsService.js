/**
 * SMS Service — Africa's Talking (primary, cheaper in Africa) + Twilio fallback.
 *
 * Africa's Talking covers: KE, NG, GH, TZ, UG, ET, CM, ZM, MW, SN, CI
 * Twilio is used for any country AT doesn't cover.
 *
 * Set AT_API_KEY + AT_USERNAME to enable Africa's Talking.
 * Set TWILIO_* to enable Twilio fallback.
 */

const AT_USERNAME = process.env.AT_USERNAME;
const AT_API_KEY  = process.env.AT_API_KEY;

// Country codes covered by Africa's Talking (cheaper rates)
const AT_COUNTRIES = ['KEN','NGA','GHA','TZA','UGA','ETH','CMR','ZMB','MWI','SEN','CIV','RWA','UGA'];

function shouldUseAT(phoneNumber) {
  // Detect by phone prefix
  const prefixes = ['+254','+256','+255','+250','+251','+237','+233','+234','+221','+225'];
  return AT_API_KEY && prefixes.some(p => phoneNumber.startsWith(p));
}

async function sendViaAfricasTalking(to, message) {
  const fetch = require('cross-fetch');
  const params = new URLSearchParams({
    username: AT_USERNAME,
    to,
    message,
    from: process.env.AT_SENDER_ID || 'KIVRO',
  });

  const res = await fetch('https://api.africastalking.com/version1/messaging', {
    method: 'POST',
    headers: {
      'apiKey': AT_API_KEY,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json',
    },
    body: params.toString(),
  });

  const data = await res.json();
  if (!res.ok || data.SMSMessageData?.Recipients?.[0]?.status !== 'Success') {
    throw new Error(data.SMSMessageData?.Recipients?.[0]?.status || 'AT delivery failed');
  }
  return { provider: 'africastalking', data };
}

async function sendViaTwilio(to, message) {
  const twilio = require('twilio');
  const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  const msg = await client.messages.create({
    body: message,
    from: process.env.TWILIO_PHONE_NUMBER,
    to,
  });
  return { provider: 'twilio', sid: msg.sid };
}

async function sendSMS(to, message) {
  if (shouldUseAT(to)) {
    return sendViaAfricasTalking(to, message);
  }
  return sendViaTwilio(to, message);
}

module.exports = { sendSMS, sendViaAfricasTalking, sendViaTwilio };
