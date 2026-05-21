-- ============================================================================
-- Fix: Add tenant_id to user_inbox (the actual inbox table name)
-- The tenant migration incorrectly referenced inbox_messages
-- ============================================================================

-- Add tenant_id to user_inbox if it doesn't exist
ALTER TABLE public.user_inbox
  ADD COLUMN IF NOT EXISTS tenant_id UUID
    REFERENCES public.tenants(id) ON DELETE CASCADE
    DEFAULT '00000000-0000-0000-0000-000000000001';

UPDATE public.user_inbox
  SET tenant_id = '00000000-0000-0000-0000-000000000001'
  WHERE tenant_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_user_inbox_tenant_id ON public.user_inbox(tenant_id);

-- Update RLS to be tenant-aware (drop old policies first if they exist)
DROP POLICY IF EXISTS "Users can view own messages" ON public.user_inbox;

CREATE POLICY "Tenant-isolated inbox select"
  ON public.user_inbox FOR SELECT
  USING (
    tenant_id = public.current_tenant_id()
    AND recipient_user_id = auth.uid()
  );

-- Also alias: allow code that references inbox_messages to work via a view
CREATE OR REPLACE VIEW public.inbox_messages AS
  SELECT * FROM public.user_inbox;

COMMENT ON VIEW public.inbox_messages IS
  'Compatibility view — maps inbox_messages to user_inbox for code that uses either name.';
