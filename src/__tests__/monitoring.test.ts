import { describe, it, expect, vi } from 'vitest';

describe('captureException', () => {
  it('does not throw when Sentry is not configured', async () => {
    // In test env, VITE_SENTRY_DSN is not set
    const { captureException } = await import('../lib/monitoring');
    expect(() => captureException(new Error('test'))).not.toThrow();
  });

  it('accepts context object', async () => {
    const { captureException } = await import('../lib/monitoring');
    expect(() => captureException(new Error('ctx test'), { userId: 'abc' })).not.toThrow();
  });
});
