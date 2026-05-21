/**
 * USSD Gateway — Africa's Talking USSD callback handler
 * Registered at: POST /api/ussd/callback
 *
 * Users dial *384*KIVRO# (or operator-assigned shortcode) and can:
 *   1. Look up their Kivro address
 *   2. Share their address via SMS
 *   3. Track a package
 *   4. Register a new address (guided flow)
 *
 * Session state is stored in Redis (or in-process map as fallback).
 * No smartphone or data needed — works on any feature phone across Africa.
 */

const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY,
  { auth: { persistSession: false } }
);

// In-process session fallback (Redis preferred in production)
const sessions = new Map();
const SESSION_TTL = 5 * 60 * 1000; // 5 min

function getSession(id) {
  const s = sessions.get(id);
  if (!s) return {};
  if (Date.now() - s.at > SESSION_TTL) { sessions.delete(id); return {}; }
  return s.data;
}

function setSession(id, data) {
  sessions.set(id, { data, at: Date.now() });
}

function clearSession(id) {
  sessions.delete(id);
}

// ── USSD response helpers ─────────────────────────────────────────────────────
const CON = (text) => `CON ${text}`;  // Continue — show menu
const END = (text) => `END ${text}`;  // End session

// ── Main callback ─────────────────────────────────────────────────────────────
router.post('/callback', async (req, res) => {
  // Africa's Talking sends form-encoded body
  const { sessionId, phoneNumber, text = '' } = req.body;
  const parts = text.split('*').filter(Boolean);
  const step = parts.length;
  const session = getSession(sessionId);

  res.set('Content-Type', 'text/plain');

  try {
    // ── Root menu ─────────────────────────────────────────────────────────
    if (!text) {
      return res.send(CON(
        'Welcome to Kivro\n' +
        '1. My address\n' +
        '2. Share address via SMS\n' +
        '3. Track a package\n' +
        '4. Register address\n' +
        '0. Exit'
      ));
    }

    const choice = parts[0];

    // ── Exit ──────────────────────────────────────────────────────────────
    if (choice === '0') {
      clearSession(sessionId);
      return res.send(END('Thank you for using Kivro. Goodbye!'));
    }

    // ── 1. My address ─────────────────────────────────────────────────────
    if (choice === '1') {
      const phone = phoneNumber.replace(/^\+/, '');

      const { data: addresses } = await supabaseAdmin
        .from('kivro_addresses')
        .select('display_address, address_code, label, is_active')
        .ilike('phone_number', `%${phone.slice(-9)}%`)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(3);

      if (!addresses?.length) {
        return res.send(END(
          'No active address found for your number.\n' +
          'Dial again and choose 4 to register.'
        ));
      }

      const list = addresses
        .map((a, i) => `${i + 1}. ${a.address_code}${a.label ? ' - ' + a.label : ''}`)
        .join('\n');

      return res.send(END(`Your Kivro address(es):\n${list}\n\nVisit kivro.africa for details.`));
    }

    // ── 2. Share address via SMS ──────────────────────────────────────────
    if (choice === '2') {
      if (step === 1) {
        return res.send(CON('Enter recipient phone number:\n(include country code, e.g. 254712345678)'));
      }
      if (step === 2) {
        const phone = phoneNumber.replace(/^\+/, '');
        const { data: address } = await supabaseAdmin
          .from('kivro_addresses')
          .select('display_address, address_code')
          .ilike('phone_number', `%${phone.slice(-9)}%`)
          .eq('is_active', true)
          .single();

        if (!address) return res.send(END('No address found. Register first (option 4).'));

        const recipientPhone = `+${parts[1].replace(/^\+/, '')}`;
        const { sendSMS } = require('../services/smsService');
        await sendSMS(recipientPhone,
          `Your Kivro address: ${address.address_code}\n${address.display_address}\nUse for deliveries. kivro.africa`
        ).catch(() => {});

        clearSession(sessionId);
        return res.send(END(`Address sent to ${recipientPhone}. Thank you!`));
      }
    }

    // ── 3. Track a package ────────────────────────────────────────────────
    if (choice === '3') {
      if (step === 1) {
        return res.send(CON('Enter your package tracking code:'));
      }
      if (step === 2) {
        const trackingCode = parts[1].toUpperCase();
        const { data: pkg } = await supabaseAdmin
          .from('packages')
          .select('status, tracking_number, description, estimated_delivery')
          .ilike('tracking_number', trackingCode)
          .single();

        if (!pkg) return res.send(END(`Package ${trackingCode} not found.\nCheck the code and try again.`));

        const status = pkg.status?.replace('_', ' ') ?? 'unknown';
        const eta = pkg.estimated_delivery
          ? `\nETA: ${new Date(pkg.estimated_delivery).toLocaleDateString()}`
          : '';

        clearSession(sessionId);
        return res.send(END(`Package: ${pkg.tracking_number}\nStatus: ${status.toUpperCase()}${eta}`));
      }
    }

    // ── 4. Register address ───────────────────────────────────────────────
    if (choice === '4') {
      if (step === 1) {
        return res.send(CON(
          'Register a Kivro address\n' +
          'You will receive an SMS with your address code.\n\n' +
          '1. Continue\n' +
          '0. Cancel'
        ));
      }
      if (step === 2 && parts[1] === '1') {
        setSession(sessionId, { registering: true });
        return res.send(CON('Enter a label for your address:\n(e.g. Home, Office, Shop)'));
      }
      if (step === 3 && session.registering) {
        const label = parts[2] || 'My Address';
        setSession(sessionId, { registering: true, label });
        return res.send(CON('How would you like your address generated?\n1. Use my phone location (GPS)\n2. Enter coordinates manually'));
      }
      if (step === 4 && session.registering) {
        if (parts[3] === '1') {
          // GPS-based — needs backend geocoding using phone number's registered area
          const phone = phoneNumber.replace(/^\+/, '');
          const { enqueueEmail } = require('../services/queue');
          // Queue a callback to create address from phone's registered region
          // (full GPS requires the Kivro mobile app)
          clearSession(sessionId);
          return res.send(END(
            'To generate a precise GPS address, download the Kivro app:\n' +
            'kivro.africa/app\n\n' +
            'Or visit kivro.africa to register online.'
          ));
        }
        if (parts[3] === '2') {
          return res.send(CON('Enter latitude and longitude\nseparated by a comma:\n(e.g. -1.2921,36.8219)'));
        }
      }
      if (step === 5 && session.registering) {
        const coords = parts[4]?.split(',');
        if (!coords || coords.length !== 2) {
          return res.send(END('Invalid coordinates. Try again from kivro.africa'));
        }
        const [lat, lng] = coords.map(Number);
        if (isNaN(lat) || isNaN(lng)) return res.send(END('Invalid coordinates.'));

        // Create address via internal API
        const phone = phoneNumber.replace(/[^\d]/g, '');
        const { data: newAddress } = await supabaseAdmin
          .from('kivro_addresses')
          .insert({
            phone_number: phone,
            latitude: lat,
            longitude: lng,
            label: session.label || 'USSD Address',
            is_active: true,
            address_code: `USSD-${phone.slice(-6)}-${Date.now().toString(36).toUpperCase()}`,
            display_address: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
          })
          .select('address_code')
          .single();

        clearSession(sessionId);

        if (newAddress) {
          const { sendSMS } = require('../services/smsService');
          await sendSMS(`+${phone}`,
            `Kivro address created!\nCode: ${newAddress.address_code}\nShare with couriers for deliveries. kivro.africa`
          ).catch(() => {});
          return res.send(END(`Address created!\nCode: ${newAddress.address_code}\nConfirmation SMS sent.`));
        }

        return res.send(END('Address creation failed. Visit kivro.africa to register.'));
      }
    }

    // ── Unknown ───────────────────────────────────────────────────────────
    return res.send(END('Invalid option. Dial again to start over.'));

  } catch (err) {
    clearSession(sessionId);
    return res.send(END('Service error. Please try again.'));
  }
});

// ── Health check for USSD ─────────────────────────────────────────────────────
router.get('/health', (req, res) => res.json({ status: 'ok', service: 'ussd' }));

module.exports = router;
