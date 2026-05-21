import { describe, it, expect, vi, beforeEach } from 'vitest';
import { maskKey, generateKeyPreview, RATE_LIMITS } from '../lib/apiKeys';

describe('maskKey', () => {
  it('masks everything after the first 16 characters', () => {
    const key = 'kv_live_ab12cd34efghijklmnop';
    const masked = maskKey(key);
    expect(masked.startsWith('kv_live_ab12cd34')).toBe(true);
    expect(masked).toContain('•');
    expect(masked).not.toContain('efghijklmnop');
  });

  it('returns short keys unchanged', () => {
    expect(maskKey('short')).toBe('short');
  });
});

describe('generateKeyPreview', () => {
  it('generates a key starting with kv_live_', () => {
    const key = generateKeyPreview();
    expect(key.startsWith('kv_live_')).toBe(true);
  });

  it('generates unique keys each time', () => {
    const k1 = generateKeyPreview();
    const k2 = generateKeyPreview();
    expect(k1).not.toBe(k2);
  });

  it('generates keys of correct length', () => {
    const key = generateKeyPreview();
    // 'kv_live_' (8) + 64 hex chars = 72
    expect(key.length).toBe(72);
  });
});

describe('RATE_LIMITS', () => {
  it('has all required plan tiers', () => {
    expect(RATE_LIMITS).toHaveProperty('pro');
    expect(RATE_LIMITS).toHaveProperty('business');
    expect(RATE_LIMITS).toHaveProperty('enterprise');
    expect(RATE_LIMITS).toHaveProperty('government');
  });

  it('enterprise has the highest limit', () => {
    expect(RATE_LIMITS.enterprise).toBeGreaterThan(RATE_LIMITS.business);
    expect(RATE_LIMITS.enterprise).toBeGreaterThan(RATE_LIMITS.pro);
    expect(RATE_LIMITS.enterprise).toBeGreaterThan(RATE_LIMITS.government);
  });
});
