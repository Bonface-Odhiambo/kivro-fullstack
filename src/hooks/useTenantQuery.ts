/**
 * useTenantQuery — wraps Supabase queries to always scope by tenant_id.
 * Use this instead of calling supabase.from() directly on tenant-isolated tables.
 *
 * Usage:
 *   const { from } = useTenantQuery();
 *   const { data } = await from('kivro_addresses').select('*').eq('user_id', userId);
 */

import { useTenant } from '@/contexts/TenantContext';
import { supabase } from '@/integrations/supabase/client';

type TenantTable =
  | 'kivro_addresses'
  | 'packages'
  | 'api_keys'
  | 'inbox_messages'
  | 'webhooks'
  | 'referral_codes'
  | 'referral_uses';

export function useTenantQuery() {
  const { tenant } = useTenant();

  /**
   * Returns a Supabase query builder pre-filtered by tenant_id.
   * The RLS policy enforces this on the DB side too — this is a double-lock.
   */
  function from(table: TenantTable) {
    return supabase.from(table as string).eq('tenant_id', tenant.id);
  }

  /**
   * For INSERT operations: returns the tenant_id to embed in the row.
   */
  function tenantId(): string {
    return tenant.id;
  }

  return { from, tenantId };
}
