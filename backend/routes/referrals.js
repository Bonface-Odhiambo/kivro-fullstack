/**
 * Referral system
 * GET  /api/referrals/code      — get or generate the user's referral code
 * GET  /api/referrals/stats     — referral stats (invited, converted, reward)
 * POST /api/referrals/apply     — apply a referral code at sign-up
 */

const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  { auth: { persistSession: false } }
);

async function requireAuth(req, res, next) {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Missing token' });
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) return res.status(401).json({ error: 'Invalid token' });
  req.user = user;
  next();
}

function generateCode(userId) {
  // 8-char alphanumeric code seeded from user id
  return crypto.createHash('sha256').update(userId).digest('hex').slice(0, 8).toUpperCase();
}

// ── GET /api/referrals/code ───────────────────────────────────────────────

router.get('/code', requireAuth, async (req, res) => {
  const code = generateCode(req.user.id);

  // Upsert so the code is stable and stored
  await supabaseAdmin.from('referral_codes').upsert(
    { user_id: req.user.id, code, created_at: new Date().toISOString() },
    { onConflict: 'user_id' }
  );

  const shareUrl = `${process.env.FRONTEND_URL || 'https://kivro.africa'}/auth?ref=${code}`;
  return res.json({ code, shareUrl });
});

// ── GET /api/referrals/stats ──────────────────────────────────────────────

router.get('/stats', requireAuth, async (req, res) => {
  const code = generateCode(req.user.id);

  const { data: referrals } = await supabaseAdmin
    .from('referral_uses')
    .select('id, referred_user_id, converted, reward_granted, created_at')
    .eq('referrer_code', code)
    .order('created_at', { ascending: false });

  const total     = (referrals || []).length;
  const converted = (referrals || []).filter(r => r.converted).length;
  const pending   = total - converted;

  return res.json({ code, total, converted, pending, referrals: referrals || [] });
});

// ── POST /api/referrals/apply ─────────────────────────────────────────────

router.post('/apply', requireAuth, async (req, res) => {
  const { code } = req.body;
  if (!code || typeof code !== 'string' || code.length !== 8) {
    return res.status(400).json({ error: 'Invalid referral code' });
  }

  const normalised = code.toUpperCase();

  // Find referrer
  const { data: referralCode } = await supabaseAdmin
    .from('referral_codes')
    .select('user_id')
    .eq('code', normalised)
    .single();

  if (!referralCode) return res.status(404).json({ error: 'Referral code not found' });
  if (referralCode.user_id === req.user.id) {
    return res.status(400).json({ error: 'You cannot use your own referral code' });
  }

  // Check not already applied
  const { data: existing } = await supabaseAdmin
    .from('referral_uses')
    .select('id')
    .eq('referred_user_id', req.user.id)
    .single();

  if (existing) return res.status(409).json({ error: 'A referral code has already been applied to your account' });

  await supabaseAdmin.from('referral_uses').insert({
    referrer_code: normalised,
    referrer_user_id: referralCode.user_id,
    referred_user_id: req.user.id,
    converted: false,
    reward_granted: false,
  });

  return res.status(201).json({ success: true, message: 'Referral code applied. Thank you!' });
});

module.exports = router;
