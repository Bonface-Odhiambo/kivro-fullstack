/**
 * Tenant middleware — resolves the current tenant from the request.
 *
 * Resolution order:
 *   1. X-Tenant-Slug header (for API key requests)
 *   2. Host header subdomain  (ci.kivro.africa → slug "ci")
 *   3. Custom domain match    (adresci.com)
 *   4. Fallback               → Kivro default tenant
 */

const { createClient } = require('@supabase/supabase-js');
let cache;
try { cache = require('../services/cache'); } catch { cache = null; }

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY,
  { auth: { persistSession: false } }
);

const KIVRO_DEFAULT_TENANT_ID = '00000000-0000-0000-0000-000000000001';

const tenantCache = new Map();
const CACHE_TTL = 5 * 60 * 1000;

async function getTenantBySlug(slug) {
  // L1: Redis
  if (cache) { const r = await cache.getTenant(slug); if (r) return r; }
  // L2: In-process
  const cached = tenantCache.get(`slug:${slug}`);
  if (cached && Date.now() - cached.at < CACHE_TTL) return cached.tenant;
  const { data } = await supabaseAdmin.from('tenants').select('*').eq('slug', slug).eq('is_active', true).single();
  if (data) {
    if (cache) cache.setTenant(slug, data);
    tenantCache.set(`slug:${slug}`, { tenant: data, at: Date.now() });
  }
  return data;
}

async function getTenantByDomain(domain) {
  const cached = tenantCache.get(`domain:${domain}`);
  if (cached && Date.now() - cached.at < CACHE_TTL) return cached.tenant;
  const { data } = await supabaseAdmin.from('tenants').select('*').eq('custom_domain', domain).eq('is_active', true).single();
  if (data) tenantCache.set(`domain:${domain}`, { tenant: data, at: Date.now() });
  return data;
}

async function resolveTenant(req) {
  const slugHeader = req.headers['x-tenant-slug'];
  if (slugHeader) { const t = await getTenantBySlug(slugHeader); if (t) return t; }

  const host = (req.headers.host || '').split(':')[0];
  if (host && host !== 'localhost' && host !== 'kivro.africa') {
    if (host.endsWith('.kivro.africa')) {
      const sub = host.replace('.kivro.africa', '').replace(/^www\./, '');
      if (sub) { const t = await getTenantBySlug(sub); if (t) return t; }
    } else {
      const t = await getTenantByDomain(host);
      if (t) return t;
    }
  }
  return null;
}

async function tenantMiddleware(req, res, next) {
  try {
    const tenant = await resolveTenant(req);
    req.tenant = tenant || { id: KIVRO_DEFAULT_TENANT_ID, slug: 'kivro' };
    next();
  } catch {
    req.tenant = { id: KIVRO_DEFAULT_TENANT_ID, slug: 'kivro' };
    next();
  }
}

module.exports = { tenantMiddleware, KIVRO_DEFAULT_TENANT_ID };
