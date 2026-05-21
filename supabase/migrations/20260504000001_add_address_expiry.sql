-- ============================================================================
-- Address Expiry Enforcement
-- Adds expires_at to kivro_addresses and a cron-ready cleanup function.
-- Free tier: addresses expire after 30 days.
-- Paid tiers: expires_at is NULL (permanent).
-- ============================================================================

-- Add expiry column if not already present
ALTER TABLE public.kivro_addresses
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS plan_tier  VARCHAR(20) DEFAULT 'free'
    CHECK (plan_tier IN ('free', 'pro', 'business', 'enterprise', 'government'));

-- Index for expiry queries
CREATE INDEX IF NOT EXISTS idx_kivro_addresses_expires_at
  ON public.kivro_addresses(expires_at)
  WHERE expires_at IS NOT NULL;

-- Function: set expiry on new free-tier addresses (call from trigger or backend)
CREATE OR REPLACE FUNCTION public.set_address_expiry()
RETURNS TRIGGER AS $$
BEGIN
  -- Only set expiry for free tier; paid tiers get NULL (permanent)
  IF NEW.plan_tier = 'free' AND NEW.expires_at IS NULL THEN
    NEW.expires_at := NOW() + INTERVAL '30 days';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_set_address_expiry
  BEFORE INSERT ON public.kivro_addresses
  FOR EACH ROW EXECUTE FUNCTION public.set_address_expiry();

-- View: active (non-expired) addresses
CREATE OR REPLACE VIEW public.active_kivro_addresses AS
  SELECT * FROM public.kivro_addresses
  WHERE expires_at IS NULL OR expires_at > NOW();

-- Function: archive expired addresses (run via pg_cron or scheduled Supabase Edge Function)
CREATE OR REPLACE FUNCTION public.archive_expired_addresses()
RETURNS INTEGER AS $$
DECLARE
  archived_count INTEGER;
BEGIN
  WITH archived AS (
    UPDATE public.kivro_addresses
    SET is_active = false
    WHERE expires_at IS NOT NULL
      AND expires_at <= NOW()
      AND is_active = true
    RETURNING id
  )
  SELECT COUNT(*) INTO archived_count FROM archived;

  RETURN archived_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.archive_expired_addresses IS
  'Deactivates expired free-tier addresses. Run daily via pg_cron or Supabase Edge Functions.';
