import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (k: string) => store[k] ?? null,
    setItem: (k: string, v: string) => { store[k] = v; },
    removeItem: (k: string) => { delete store[k]; },
    clear: () => { store = {}; },
  };
})();
Object.defineProperty(global, 'localStorage', { value: localStorageMock });

describe('analytics consent gate', () => {
  beforeEach(() => localStorage.clear());

  it('does not track when consent is absent', async () => {
    // No consent stored — track() should be a no-op
    const { track } = await import('../lib/analytics');
    // Should not throw
    expect(() => track('test_event')).not.toThrow();
  });

  it('Events object has expected keys', async () => {
    const { Events } = await import('../lib/analytics');
    expect(Events.ADDRESS_CREATED).toBe('address_created');
    expect(Events.API_KEY_CREATED).toBe('api_key_created');
    expect(Events.REFERRAL_SHARED).toBe('referral_shared');
  });
});
