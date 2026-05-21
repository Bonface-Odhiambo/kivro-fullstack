/**
 * Tenant management routes (Kivro super-admin only)
 * POST   /api/tenants              — create a new white-label tenant
 * GET    /api/tenants              — list all tenants
 * GET    /api/tenants/:slug        — get tenant by slug
 * PATCH  /api/tenants/:slug        — update branding / plan
 * DELETE /api/tenants/:slug        — deactivate tenant
 * GET    /api/tenants/:slug/stats  — user count, address count, revenue
 */

const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY,
  { auth: { persistSession: false } }
);

// ── Super-admin auth ──────────────────────────────────────────────────────────
async function requireSuperAdmin(req, res, next) {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Missing token' });

  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) return res.status(401).json({ error: 'Invalid token' });

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('user_type')
    .eq('user_id', user.id)
    .single();

  if (!profile || profile.user_type !== 'admin') {
    return res.status(403).json({ error: 'Super-admin access required' });
  }

  req.adminUser = user;
  next();
}

// ── POST /api/tenants — create tenant ─────────────────────────────────────────
router.post('/', requireSuperAdmin, [
  body('slug').matches(/^[a-z0-9-]{2,63}$/).withMessage('Slug must be lowercase alphanumeric with hyphens'),
  body('name').notEmpty().isLength({ max: 255 }),
  body('owner_email').isEmail(),
  body('plan').isIn(['starter', 'growth', 'scale', 'enterprise']),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ error: 'Validation failed', details: errors.array() });

  const {
    slug, name, owner_email, plan = 'starter',
    logo_url, primary_color = '#0EA5E9', app_name,
    from_email, support_url, custom_domain, default_language = 'EN',
    max_users = 500,
  } = req.body;

  // Look up owner by email
  const { data: { users }, error: userErr } = await supabaseAdmin.auth.admin.listUsers();
  if (userErr) return res.status(500).json({ error: 'Failed to look up owner' });
  const owner = users.find(u => u.email === owner_email);

  const { data, error } = await supabaseAdmin
    .from('tenants')
    .insert({
      slug, name, owner_id: owner?.id || null, plan, logo_url,
      primary_color, app_name: app_name || name, from_email,
      support_url, custom_domain, default_language, max_users,
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') return res.status(409).json({ error: 'Slug or domain already taken' });
    return res.status(500).json({ error: 'Failed to create tenant', detail: error.message });
  }

  return res.status(201).json({ tenant: data });
});

// ── GET /api/tenants — list all ───────────────────────────────────────────────
router.get('/', requireSuperAdmin, async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('tenants')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: 'Failed to fetch tenants' });
  return res.json({ tenants: data });
});

// ── GET /api/tenants/:slug — get one ──────────────────────────────────────────
router.get('/:slug', async (req, res) => {
  // Public — used by frontend to load branding
  const { data, error } = await supabaseAdmin
    .from('tenants')
    .select('id, slug, name, app_name, logo_url, primary_color, from_email, support_url, plan, default_language, custom_domain')
    .eq('slug', req.params.slug)
    .eq('is_active', true)
    .single();

  if (error || !data) return res.status(404).json({ error: 'Tenant not found' });
  return res.json({ tenant: data });
});

// ── PATCH /api/tenants/:slug — update ─────────────────────────────────────────
router.patch('/:slug', requireSuperAdmin, async (req, res) => {
  const allowed = ['name', 'app_name', 'logo_url', 'primary_color', 'from_email',
    'support_url', 'custom_domain', 'plan', 'max_users', 'default_language', 'is_active'];

  const updates = Object.fromEntries(
    Object.entries(req.body).filter(([k]) => allowed.includes(k))
  );
  updates.updated_at = new Date().toISOString();

  const { data, error } = await supabaseAdmin
    .from('tenants')
    .update(updates)
    .eq('slug', req.params.slug)
    .select()
    .single();

  if (error) return res.status(500).json({ error: 'Update failed', detail: error.message });
  return res.json({ tenant: data });
});

// ── DELETE /api/tenants/:slug — deactivate ────────────────────────────────────
router.delete('/:slug', requireSuperAdmin, async (req, res) => {
  if (req.params.slug === 'kivro') {
    return res.status(400).json({ error: 'Cannot deactivate the default Kivro tenant' });
  }

  const { error } = await supabaseAdmin
    .from('tenants')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('slug', req.params.slug);

  if (error) return res.status(500).json({ error: 'Failed to deactivate tenant' });
  return res.json({ success: true });
});

// ── GET /api/tenants/:slug/stats ──────────────────────────────────────────────
router.get('/:slug/stats', requireSuperAdmin, async (req, res) => {
  const { data: tenant } = await supabaseAdmin
    .from('tenants')
    .select('id')
    .eq('slug', req.params.slug)
    .single();

  if (!tenant) return res.status(404).json({ error: 'Tenant not found' });

  const [usersRes, addressesRes, apiKeysRes] = await Promise.all([
    supabaseAdmin.from('profiles').select('id', { count: 'exact', head: true }).eq('tenant_id', tenant.id),
    supabaseAdmin.from('kivro_addresses').select('id', { count: 'exact', head: true }).eq('tenant_id', tenant.id),
    supabaseAdmin.from('api_keys').select('id', { count: 'exact', head: true }).eq('tenant_id', tenant.id).eq('status', 'active'),
  ]);

  return res.json({
    tenant_id: tenant.id,
    users: usersRes.count ?? 0,
    addresses: addressesRes.count ?? 0,
    active_api_keys: apiKeysRes.count ?? 0,
  });
});

module.exports = router;
