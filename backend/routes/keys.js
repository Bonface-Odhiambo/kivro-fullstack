/**
 * API Key Management Routes
 * POST   /api/keys          — create a new API key
 * GET    /api/keys          — list all keys for authenticated user
 * DELETE /api/keys/:id      — revoke a key
 */

const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');
const { sendApiKeyCreated } = require('../services/emailService');

// Supabase admin client (service role — never expose to frontend)
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  { auth: { persistSession: false } }
);

// Rate limits per plan (requests per minute)
const RATE_LIMITS = {
  pro: 60,
  business: 300,
  enterprise: 1000,
  government: 500,
};

// ── Auth middleware ──────────────────────────────────────────────────────────

async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing Authorization header' });
  }
  const token = authHeader.slice(7);
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
  req.user = user;
  next();
}

// ── POST /api/keys — create a key ───────────────────────────────────────────

router.post('/', requireAuth, async (req, res) => {
  try {
    const { name, plan = 'business' } = req.body;
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return res.status(400).json({ error: 'Key name must be at least 2 characters' });
    }
    if (!RATE_LIMITS[plan]) {
      return res.status(400).json({ error: `Invalid plan. Choose one of: ${Object.keys(RATE_LIMITS).join(', ')}` });
    }

    // Generate a secure 32-byte key
    const rawKey = crypto.randomBytes(32).toString('hex');
    const plaintext = `kv_live_${rawKey}`;

    // Hash it for storage — we store the hash, show plaintext once
    const keyHash = crypto.createHash('sha256').update(plaintext).digest('hex');
    const keyPrefix = plaintext.slice(0, 16); // "kv_live_XXXXXXXX"

    const { data, error } = await supabaseAdmin
      .from('api_keys')
      .insert({
        user_id: req.user.id,
        tenant_id: req.tenant?.id || '00000000-0000-0000-0000-000000000001',
        name: name.trim(),
        key_hash: keyHash,
        key_prefix: keyPrefix,
        plan,
        rate_limit_per_min: RATE_LIMITS[plan],
        status: 'active',
        requests_today: 0,
        requests_month: 0,
        last_used_at: null,
        expires_at: null,
      })
      .select('id, name, key_prefix, plan, status, rate_limit_per_min, requests_today, requests_month, last_used_at, created_at, expires_at')
      .single();

    if (error) {
      return res.status(500).json({ error: 'Failed to create API key' });
    }

    // Notify user via email (fire-and-forget)
    sendApiKeyCreated({ email: req.user.email, keyName: name.trim(), plan })
      .catch(() => {});

    return res.status(201).json({ key: data, plaintext });
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ── GET /api/keys — list keys ────────────────────────────────────────────────

router.get('/', requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('api_keys')
      .select('id, name, key_prefix, plan, status, rate_limit_per_min, requests_today, requests_month, last_used_at, created_at, expires_at')
      .eq('user_id', req.user.id)
      .eq('tenant_id', req.tenant?.id || '00000000-0000-0000-0000-000000000001')
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch keys' });
    }

    return res.json({ keys: data || [] });
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ── DELETE /api/keys/:id — revoke a key ──────────────────────────────────────

router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    // Ensure the key belongs to this user before revoking
    const { data: existing, error: fetchErr } = await supabaseAdmin
      .from('api_keys')
      .select('id, status')
      .eq('id', id)
      .eq('user_id', req.user.id)
      .eq('tenant_id', req.tenant?.id || '00000000-0000-0000-0000-000000000001')
      .single();

    if (fetchErr || !existing) {
      return res.status(404).json({ error: 'Key not found' });
    }
    if (existing.status === 'revoked') {
      return res.status(400).json({ error: 'Key already revoked' });
    }

    const { error: updateErr } = await supabaseAdmin
      .from('api_keys')
      .update({ status: 'revoked', revoked_at: new Date().toISOString() })
      .eq('id', id);

    if (updateErr) {
      return res.status(500).json({ error: 'Failed to revoke key' });
    }

    return res.json({ success: true, message: 'Key revoked' });
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Middleware: validate incoming API key for protected routes ────────────────
// Usage: app.use('/api/external', validateApiKey, externalRouter)

async function validateApiKey(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer kv_live_')) {
    return res.status(401).json({ error: 'Valid API key required' });
  }

  const plaintext = authHeader.slice(7);
  const keyHash = crypto.createHash('sha256').update(plaintext).digest('hex');

  const { data: keyRow, error } = await supabaseAdmin
    .from('api_keys')
    .select('id, user_id, plan, status, rate_limit_per_min, requests_today')
    .eq('key_hash', keyHash)
    .single();

  if (error || !keyRow) {
    return res.status(401).json({ error: 'Invalid API key' });
  }
  if (keyRow.status !== 'active') {
    return res.status(403).json({ error: 'API key has been revoked' });
  }

  // Update usage stats (fire-and-forget)
  supabaseAdmin
    .from('api_keys')
    .update({
      last_used_at: new Date().toISOString(),
      requests_today: (keyRow.requests_today || 0) + 1,
    })
    .eq('id', keyRow.id)
    .then(() => {})
    .catch(() => {});

  req.apiKey = keyRow;
  next();
}

module.exports = router;
module.exports.validateApiKey = validateApiKey;
