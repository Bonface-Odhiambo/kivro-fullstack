import { describe, it, expect } from 'vitest';
import crypto from 'crypto';

// Mirror the server-side generateCode function
function generateCode(userId: string): string {
  return crypto.createHash('sha256').update(userId).digest('hex').slice(0, 8).toUpperCase();
}

describe('referral code generation', () => {
  it('generates an 8-character code', () => {
    const code = generateCode('test-user-id');
    expect(code.length).toBe(8);
  });

  it('is deterministic for the same user', () => {
    const uid = 'user-abc-123';
    expect(generateCode(uid)).toBe(generateCode(uid));
  });

  it('produces different codes for different users', () => {
    expect(generateCode('user-1')).not.toBe(generateCode('user-2'));
  });

  it('is uppercase alphanumeric only', () => {
    const code = generateCode('some-user-id');
    expect(code).toMatch(/^[0-9A-F]{8}$/);
  });
});
