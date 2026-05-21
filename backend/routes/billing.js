/**
 * Billing routes
 * GET  /api/billing/subscription       — current user's subscription
 * POST /api/billing/subscribe          — create/upgrade subscription
 * POST /api/billing/cancel             — cancel subscription
 * GET  /api/billing/invoices           — list invoices for tenant
 * GET  /api/billing/invoices/:id       — get one invoice
 * GET  /api/billing/revenue/:period    — revenue summary (reseller)
 * POST /api/billing/generate-invoices  — admin: trigger monthly invoice generation
 */

const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { createClient } = require('@supabase/supabase-js');
const { createSubscription, generateInvoice, getRevenueSummary, processDunning } = require('../services/billingService');

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY,
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

// ── GET /api/billing/subscription ─────────────────────────────────────────────
router.get('/subscription', requireAuth, async (req, res) => {
  const { data } = await supabaseAdmin
    .from('subscriptions')
    .select('*')
    .eq('user_id', req.user.id)
    .eq('tenant_id', req.tenant.id)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  return res.json({ subscription: data });
});

// ── POST /api/billing/subscribe ───────────────────────────────────────────────
router.post('/subscribe', requireAuth, [
  body('plan').isIn(['free','pro','business','enterprise','government']),
  body('currency').optional().isLength({ min: 3, max: 3 }),
  body('interval').optional().isIn(['month','year']),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ error: 'Validation failed', details: errors.array() });

  try {
    const sub = await createSubscription({
      userId: req.user.id,
      tenantId: req.tenant.id,
      plan: req.body.plan,
      currency: req.body.currency || 'USD',
      interval: req.body.interval || 'month',
    });
    return res.status(201).json({ subscription: sub });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ── POST /api/billing/cancel ──────────────────────────────────────────────────
router.post('/cancel', requireAuth, async (req, res) => {
  const { error } = await supabaseAdmin
    .from('subscriptions')
    .update({ status: 'cancelled', cancelled_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('user_id', req.user.id)
    .eq('tenant_id', req.tenant.id)
    .in('status', ['active', 'trialing', 'past_due']);

  if (error) return res.status(500).json({ error: 'Failed to cancel subscription' });
  return res.json({ success: true, message: 'Subscription cancelled. Access continues until end of billing period.' });
});

// ── GET /api/billing/invoices ─────────────────────────────────────────────────
router.get('/invoices', requireAuth, async (req, res) => {
  const { data } = await supabaseAdmin
    .from('invoices')
    .select('id, invoice_number, period, status, total, currency, due_date, paid_at, pdf_url, created_at')
    .eq('tenant_id', req.tenant.id)
    .order('created_at', { ascending: false });

  return res.json({ invoices: data ?? [] });
});

// ── GET /api/billing/invoices/:id ─────────────────────────────────────────────
router.get('/invoices/:id', requireAuth, async (req, res) => {
  const { data } = await supabaseAdmin
    .from('invoices')
    .select('*')
    .eq('id', req.params.id)
    .eq('tenant_id', req.tenant.id)
    .single();

  if (!data) return res.status(404).json({ error: 'Invoice not found' });
  return res.json({ invoice: data });
});

// ── GET /api/billing/revenue/:period — reseller revenue summary ───────────────
router.get('/revenue/:period', requireAuth, async (req, res) => {
  const { period } = req.params;
  if (!/^\d{4}-\d{2}$/.test(period)) return res.status(400).json({ error: 'Invalid period format. Use YYYY-MM.' });

  try {
    const summary = await getRevenueSummary(req.tenant.id, period);
    return res.json({ period, ...summary });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ── POST /api/billing/generate-invoices — admin cron trigger ─────────────────
router.post('/generate-invoices', requireAuth, async (req, res) => {
  const { data: profile } = await supabaseAdmin
    .from('profiles').select('user_type').eq('user_id', req.user.id).single();
  if (!profile || profile.user_type !== 'admin') return res.status(403).json({ error: 'Admin only' });

  const period = req.body.period || new Date().toISOString().slice(0, 7);
  const { data: tenants } = await supabaseAdmin
    .from('tenants').select('id').eq('is_active', true).neq('slug', 'kivro');

  let generated = 0;
  for (const t of tenants ?? []) {
    try { await generateInvoice(t.id, period); generated++; } catch { /* skip */ }
  }

  return res.json({ success: true, generated, period });
});

// ── POST /api/billing/process-dunning — admin cron trigger ───────────────────
router.post('/process-dunning', requireAuth, async (req, res) => {
  const { data: profile } = await supabaseAdmin
    .from('profiles').select('user_type').eq('user_id', req.user.id).single();
  if (!profile || profile.user_type !== 'admin') return res.status(403).json({ error: 'Admin only' });

  const result = await processDunning();
  return res.json({ success: true, ...result });
});

module.exports = router;
