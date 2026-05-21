// API Key management utilities
// Keys are stored in Supabase via the backend; this file handles frontend generation helpers and storage

import { supabase } from '@/integrations/supabase/client';

export interface ApiKey {
  id: string;
  name: string;
  key_prefix: string; // first 8 chars shown, rest masked
  full_key?: string;  // only present on creation
  plan: 'pro' | 'business' | 'enterprise' | 'government';
  status: 'active' | 'revoked';
  requests_today: number;
  requests_month: number;
  rate_limit_per_min: number;
  last_used_at: string | null;
  created_at: string;
  expires_at: string | null;
}

export type NewApiKeyResult = {
  key: ApiKey;
  plaintext: string; // shown once on creation
};

// Rate limits by plan
export const RATE_LIMITS: Record<ApiKey['plan'], number> = {
  pro: 60,
  business: 300,
  enterprise: 1000,
  government: 500,
};

// Generate a cryptographically random API key (frontend preview — backend creates the real one)
export function generateKeyPreview(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  const hex = Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('');
  return `kv_live_${hex}`;
}

// Create an API key via backend
export async function createApiKey(
  name: string,
  plan: ApiKey['plan']
): Promise<NewApiKeyResult> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  const res = await fetch(`${apiUrl}/api/keys`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ name, plan }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to create API key');
  }

  return res.json();
}

// List all API keys for the authenticated user
export async function listApiKeys(): Promise<ApiKey[]> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return [];

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  const res = await fetch(`${apiUrl}/api/keys`, {
    headers: { 'Authorization': `Bearer ${session.access_token}` },
  });

  if (!res.ok) return [];
  const data = await res.json();
  return data.keys || [];
}

// Revoke an API key
export async function revokeApiKey(keyId: string): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  const res = await fetch(`${apiUrl}/api/keys/${keyId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${session.access_token}` },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to revoke key');
  }
}

// Mask a key for display: kv_live_ab12cd34••••••••••••••••••••••••
export function maskKey(fullKey: string): string {
  if (fullKey.length <= 16) return fullKey;
  return fullKey.slice(0, 16) + '•'.repeat(fullKey.length - 16);
}
