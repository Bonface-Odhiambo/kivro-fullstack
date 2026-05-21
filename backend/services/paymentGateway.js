/**
 * Multi-gateway payment service
 * Supports: M-Pesa (Kenya/Tanzania), Flutterwave (pan-Africa), Paystack (West Africa)
 * Gateway is selected based on country_code or explicit provider param.
 */

const fetch = require('cross-fetch');

// ── Gateway selection ──────────────────────────────────────────────────────

const MPESA_COUNTRIES  = ['KEN', 'TZA'];
const PAYSTACK_COUNTRIES = ['NGA', 'GHA', 'ZAF', 'KEN'];

function selectGateway(countryCode, explicitProvider) {
  if (explicitProvider) return explicitProvider.toLowerCase();
  if (MPESA_COUNTRIES.includes(countryCode)) return 'mpesa';
  if (PAYSTACK_COUNTRIES.includes(countryCode)) return 'paystack';
  return 'flutterwave'; // default for the rest of Africa
}

// ── M-Pesa ────────────────────────────────────────────────────────────────

async function initiateMpesa({ phone, amount, reference, description }) {
  const mpesaService = require('./mpesa');
  return mpesaService.initiateSTKPush(phone, amount, reference, description);
}

// ── Flutterwave ───────────────────────────────────────────────────────────

async function initiateFlutterwave({ phone, email, amount, currency = 'KES', reference, name, countryCode }) {
  const secretKey = process.env.FLUTTERWAVE_SECRET_KEY;
  if (!secretKey) throw new Error('FLUTTERWAVE_SECRET_KEY not configured');

  const res = await fetch('https://api.flutterwave.com/v3/charges?type=mobile_money_' + countryCode.toLowerCase(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${secretKey}`,
    },
    body: JSON.stringify({
      phone_number: phone,
      amount,
      currency,
      email,
      tx_ref: reference,
      fullname: name,
      client_ip: '154.123.220.1',
      device_fingerprint: reference,
    }),
  });

  const data = await res.json();
  if (!res.ok || data.status === 'error') {
    throw new Error(data.message || 'Flutterwave payment failed');
  }
  return {
    provider: 'flutterwave',
    status: data.status,
    transaction_id: data.data?.id,
    reference,
    raw: data,
  };
}

// ── Paystack ──────────────────────────────────────────────────────────────

async function initiatePaystack({ email, amount, reference, currency = 'NGN', phone, name }) {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) throw new Error('PAYSTACK_SECRET_KEY not configured');

  const amountKobo = Math.round(amount * 100); // Paystack uses smallest unit

  const res = await fetch('https://api.paystack.co/transaction/initialize', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${secretKey}`,
    },
    body: JSON.stringify({
      email,
      amount: amountKobo,
      reference,
      currency,
      metadata: { phone, name },
    }),
  });

  const data = await res.json();
  if (!res.ok || !data.status) {
    throw new Error(data.message || 'Paystack payment failed');
  }
  return {
    provider: 'paystack',
    status: 'pending',
    authorization_url: data.data?.authorization_url,
    reference,
    raw: data,
  };
}

// ── Verify payment (any provider) ─────────────────────────────────────────

async function verifyPayment(reference, provider) {
  switch (provider) {
    case 'paystack': {
      const res = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
        headers: { 'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
      });
      const data = await res.json();
      return { verified: data.data?.status === 'success', raw: data };
    }
    case 'flutterwave': {
      const res = await fetch(`https://api.flutterwave.com/v3/transactions/${reference}/verify`, {
        headers: { 'Authorization': `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}` },
      });
      const data = await res.json();
      return { verified: data.data?.status === 'successful', raw: data };
    }
    case 'mpesa': {
      const mpesaService = require('./mpesa');
      return mpesaService.querySTKPushStatus(reference);
    }
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}

// ── Public API ─────────────────────────────────────────────────────────────

async function initiatePayment({ phone, email, amount, currency, reference, description, name, countryCode, provider }) {
  const gateway = selectGateway(countryCode, provider);

  switch (gateway) {
    case 'mpesa':
      return initiateMpesa({ phone, amount, reference, description });
    case 'flutterwave':
      return initiateFlutterwave({ phone, email, amount, currency, reference, name, countryCode });
    case 'paystack':
      return initiatePaystack({ email, amount, reference, currency, phone, name });
    default:
      throw new Error(`Unsupported payment gateway: ${gateway}`);
  }
}

module.exports = { initiatePayment, verifyPayment, selectGateway };
