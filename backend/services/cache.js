/**
 * Redis cache layer — wraps Supabase queries for hot data.
 * Falls back to direct DB calls if Redis is not configured.
 */

let redis = null;
const TTL = {
  tenant:   5 * 60,       // 5 min
  address:  10 * 60,      // 10 min
  rateData: 24 * 60 * 60, // 24 hr (currency rates)
};

async function initCache() {
  const url = process.env.REDIS_URL || process.env.UPSTASH_REDIS_URL;
  if (!url) return;

  try {
    const { createClient } = require('redis');
    redis = createClient({ url });
    redis.on('error', () => { redis = null; });
    await redis.connect();
  } catch (err) {
    redis = null;
  }
}

async function get(key) {
  if (!redis) return null;
  try {
    const val = await redis.get(key);
    return val ? JSON.parse(val) : null;
  } catch { return null; }
}

async function set(key, value, ttlSeconds = 300) {
  if (!redis) return;
  try {
    await redis.set(key, JSON.stringify(value), { EX: ttlSeconds });
  } catch { /* silently ignore */ }
}

async function del(key) {
  if (!redis) return;
  try { await redis.del(key); } catch { /* ignore */ }
}

async function delPattern(pattern) {
  if (!redis) return;
  try {
    const keys = await redis.keys(pattern);
    if (keys.length) await redis.del(keys);
  } catch { /* ignore */ }
}

// ── Higher-level helpers ──────────────────────────────────────────────────────

async function getTenant(slug) {
  return get(`tenant:${slug}`);
}

async function setTenant(slug, data) {
  return set(`tenant:${slug}`, data, TTL.tenant);
}

async function invalidateTenant(slug) {
  await del(`tenant:${slug}`);
  await del(`tenant:domain:${slug}`);
}

async function getAddress(code) {
  return get(`address:${code}`);
}

async function setAddress(code, data) {
  return set(`address:${code}`, data, TTL.address);
}

async function invalidateAddress(code) {
  return del(`address:${code}`);
}

module.exports = {
  initCache, get, set, del, delPattern,
  getTenant, setTenant, invalidateTenant,
  getAddress, setAddress, invalidateAddress,
  TTL,
};
