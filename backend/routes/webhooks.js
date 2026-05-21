/**
 * Webhook Management Routes
 * POST   /api/webhooks           — register a webhook endpoint
 * GET    /api/webhooks           — list registered webhooks for the user
 * DELETE /api/webhooks/:id       — remove a webhook
 * POST   /api/webhooks/dispatch  — internal: fire an event to all subscribers (service only)
 */

const express = require('express');
const router = express.Router();
const crypto = require('crypto');
let enqueueWebhook;
try { ({ enqueueWebhook } = require('../services/queue')); } catch { enqueueWebhook = null; }
const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  { auth: { persistSession: false } }
);

const SUPPORTED_EVENTS = [
  'address.created',
  'address.verified',
  'delivery.status_changed',
  'delivery.delivered',
  'payment.received',
];

// ── Auth helper ───────────────────────────────────────────────────────────────

async function requireAuth(req, res, next) {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Missing token' });
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) return res.status(401).json({ error: 'Invalid token' });
  req.user = user;
  next();
}

// ── POST /api/webhooks — register ─────────────────────────────────────────────

router.post('/', requireAuth, async (req, res) => {
  const { url, events = SUPPORTED_EVENTS, description = '' } = req.body;

  if (!url || !/^https:\/\//.test(url)) {
    return res.status(400).json({ error: 'url must be a valid HTTPS URL' });
  }
  const invalidEvents = (events || []).filter(e => !SUPPORTED_EVENTS.includes(e));
  if (invalidEvents.length) {
    return res.status(400).json({ error: `Unknown events: ${invalidEvents.join(', ')}` });
  }

  // Generate a signing secret shown once to the user
  const secret = `whsec_${crypto.randomBytes(24).toString('hex')}`;
  const secretHash = crypto.createHash('sha256').update(secret).digest('hex');

  const { data, error } = await supabaseAdmin
    .from('webhooks')
    .insert({
      user_id: req.user.id,
      tenant_id: req.tenant?.id || '00000000-0000-0000-0000-000000000001',
      url,
      events,
      description,
      secret_hash: secretHash,
      status: 'active',
    })
    .select('id, url, events, description, status, created_at')
    .single();

  if (error) {
    return res.status(500).json({ error: 'Failed to register webhook' });
  }

  return res.status(201).json({ webhook: data, secret });
});

// ── GET /api/webhooks — list ──────────────────────────────────────────────────

router.get('/', requireAuth, async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('webhooks')
    .select('id, url, events, description, status, created_at')
    .eq('user_id', req.user.id)
    .eq('tenant_id', req.tenant?.id || '00000000-0000-0000-0000-000000000001')
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: 'Failed to fetch webhooks' });
  return res.json({ webhooks: data || [] });
});

// ── DELETE /api/webhooks/:id — remove ────────────────────────────────────────

router.delete('/:id', requireAuth, async (req, res) => {
  const { data: existing } = await supabaseAdmin
    .from('webhooks')
    .select('id')
    .eq('id', req.params.id)
    .eq('user_id', req.user.id)
    .single();

  if (!existing) return res.status(404).json({ error: 'Webhook not found' });

  await supabaseAdmin.from('webhooks').delete().eq('id', req.params.id);
  return res.json({ success: true });
});

// ── Dispatch helper (call internally from other routes) ───────────────────────

async function dispatchWebhookEvent(userId, event, payload) {
  if (!SUPPORTED_EVENTS.includes(event)) return;

  const { data: hooks } = await supabaseAdmin
    .from('webhooks')
    .select('id, url, secret_hash')
    .eq('user_id', userId)
    .eq('status', 'active')
    .contains('events', [event]);

  if (!hooks || hooks.length === 0) return;

  const body = JSON.stringify({
    event,
    created_at: new Date().toISOString(),
    data: payload,
  });

  await Promise.allSettled(
    hooks.map(async (hook) => {
      if (enqueueWebhook) {
        // Async via BullMQ — retries, backoff, dead-letter
        await enqueueWebhook(hook.url, { event, ...JSON.parse(body) }, hook.secret_hash)
          .catch(() => {});
      } else {
        // Sync fallback
        const sig = crypto.createHmac('sha256', hook.secret_hash).update(body).digest('hex');
        try {
          await fetch(hook.url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Kivro-Signature': `sha256=${sig}`,
              'X-Kivro-Event': event,
            },
            body,
            signal: AbortSignal.timeout(10_000),
          });
        } catch { /* silently ignore */ }
      }
    })
  );
}

module.exports = router;
module.exports.dispatchWebhookEvent = dispatchWebhookEvent;
module.exports.SUPPORTED_EVENTS = SUPPORTED_EVENTS;
