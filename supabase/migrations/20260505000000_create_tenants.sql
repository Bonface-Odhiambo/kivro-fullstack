-- ============================================================================
-- Multi-tenancy — Phase 1
-- Every white-label reseller is a "tenant". Kivro itself is tenant slug = 'kivro'.
-- All core tables get a tenant_id column with RLS enforcing isolation.
-- ============================================================================

-- ── 1. Tenants table ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.tenants (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug         VARCHAR(63) NOT NULL UNIQUE,   -- subdomain: ci, sn, ng …
    name         VARCHAR(255) NOT NULL,          -- "AdresCI", "Kivro Senegal"
    owner_id     UUID REFERENCES auth.users(id) ON DELETE SET NULL,

    -- Branding
    logo_url     TEXT,
    primary_color VARCHAR(7) DEFAULT '#0EA5E9',  -- hex
    app_name     VARCHAR(100) DEFAULT 'Kivro',
    from_email   TEXT DEFAULT 'hello@kivro.africa',
    support_url  TEXT,
    custom_domain TEXT UNIQUE,                   -- adresci.com (optional)

    -- Plan
    plan         VARCHAR(30) NOT NULL DEFAULT 'starter'
                   CHECK (plan IN ('starter','growth','scale','enterprise')),
    max_users    INTEGER NOT NULL DEFAULT 500,
    is_active    BOOLEAN NOT NULL DEFAULT true,

    -- Default language for this tenant's users
    default_language VARCHAR(5) DEFAULT 'EN',

    -- Timestamps
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert the default Kivro tenant so existing data keeps working
INSERT INTO public.tenants (id, slug, name, app_name, plan, max_users)
VALUES ('00000000-0000-0000-0000-000000000001', 'kivro', 'Kivro', 'Kivro', 'enterprise', 99999999)
ON CONFLICT (slug) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_tenants_slug          ON public.tenants(slug);
CREATE INDEX IF NOT EXISTS idx_tenants_custom_domain ON public.tenants(custom_domain)
  WHERE custom_domain IS NOT NULL;

ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

-- Anyone can read basic tenant info (needed for branding on login page)
CREATE POLICY "Public can read active tenant branding"
  ON public.tenants FOR SELECT
  USING (is_active = true);

-- Only service role can insert/update/delete tenants
-- (managed via admin backend, never from the frontend)

-- ── 2. Add tenant_id to profiles ─────────────────────────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS tenant_id UUID
    REFERENCES public.tenants(id) ON DELETE SET NULL
    DEFAULT '00000000-0000-0000-0000-000000000001';

UPDATE public.profiles SET tenant_id = '00000000-0000-0000-0000-000000000001'
  WHERE tenant_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_tenant_id ON public.profiles(tenant_id);

-- ── 3. Add tenant_id to kivro_addresses ──────────────────────────────────────
ALTER TABLE public.kivro_addresses
  ADD COLUMN IF NOT EXISTS tenant_id UUID
    REFERENCES public.tenants(id) ON DELETE CASCADE
    DEFAULT '00000000-0000-0000-0000-000000000001';

UPDATE public.kivro_addresses SET tenant_id = '00000000-0000-0000-0000-000000000001'
  WHERE tenant_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_kivro_addresses_tenant_id ON public.kivro_addresses(tenant_id);

-- ── 4. Add tenant_id to packages ─────────────────────────────────────────────
ALTER TABLE public.packages
  ADD COLUMN IF NOT EXISTS tenant_id UUID
    REFERENCES public.tenants(id) ON DELETE CASCADE
    DEFAULT '00000000-0000-0000-0000-000000000001';

UPDATE public.packages SET tenant_id = '00000000-0000-0000-0000-000000000001'
  WHERE tenant_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_packages_tenant_id ON public.packages(tenant_id);

-- ── 5. Add tenant_id to api_keys ─────────────────────────────────────────────
ALTER TABLE public.api_keys
  ADD COLUMN IF NOT EXISTS tenant_id UUID
    REFERENCES public.tenants(id) ON DELETE CASCADE
    DEFAULT '00000000-0000-0000-0000-000000000001';

UPDATE public.api_keys SET tenant_id = '00000000-0000-0000-0000-000000000001'
  WHERE tenant_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_api_keys_tenant_id ON public.api_keys(tenant_id);

-- ── 6. Add tenant_id to user_inbox ───────────────────────────────────────
ALTER TABLE public.user_inbox
  ADD COLUMN IF NOT EXISTS tenant_id UUID
    REFERENCES public.tenants(id) ON DELETE CASCADE
    DEFAULT '00000000-0000-0000-0000-000000000001';

UPDATE public.user_inbox SET tenant_id = '00000000-0000-0000-0000-000000000001'
  WHERE tenant_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_user_inbox_tenant_id ON public.user_inbox(tenant_id);

-- ── 7. Add tenant_id to webhooks ─────────────────────────────────────────────
ALTER TABLE public.webhooks
  ADD COLUMN IF NOT EXISTS tenant_id UUID
    REFERENCES public.tenants(id) ON DELETE CASCADE
    DEFAULT '00000000-0000-0000-0000-000000000001';

UPDATE public.webhooks SET tenant_id = '00000000-0000-0000-0000-000000000001'
  WHERE tenant_id IS NULL;

-- ── 8. Helper function: get current user's tenant_id ────────────────────────
CREATE OR REPLACE FUNCTION public.current_tenant_id()
RETURNS UUID
LANGUAGE sql STABLE
AS $$
  SELECT COALESCE(
    (SELECT tenant_id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1),
    '00000000-0000-0000-0000-000000000001'::UUID
  );
$$;

-- ── 9. Update RLS on kivro_addresses to add tenant isolation ─────────────────
-- Drop old policies and replace with tenant-aware ones
DROP POLICY IF EXISTS "Users can view own addresses" ON public.kivro_addresses;
DROP POLICY IF EXISTS "Users can insert own addresses" ON public.kivro_addresses;
DROP POLICY IF EXISTS "Users can update own addresses" ON public.kivro_addresses;
DROP POLICY IF EXISTS "Users can delete own addresses" ON public.kivro_addresses;

CREATE POLICY "Tenant-isolated address select"
  ON public.kivro_addresses FOR SELECT
  USING (tenant_id = public.current_tenant_id() AND user_id = auth.uid());

CREATE POLICY "Tenant-isolated address insert"
  ON public.kivro_addresses FOR INSERT
  WITH CHECK (tenant_id = public.current_tenant_id() AND user_id = auth.uid());

CREATE POLICY "Tenant-isolated address update"
  ON public.kivro_addresses FOR UPDATE
  USING (tenant_id = public.current_tenant_id() AND user_id = auth.uid());

CREATE POLICY "Tenant-isolated address delete"
  ON public.kivro_addresses FOR DELETE
  USING (tenant_id = public.current_tenant_id() AND user_id = auth.uid());

-- ── 10. Tenant-aware trigger: auto-assign tenant_id on new addresses ──────────
CREATE OR REPLACE FUNCTION public.set_address_tenant_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.tenant_id IS NULL THEN
    NEW.tenant_id := public.current_tenant_id();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_address_tenant ON public.kivro_addresses;
CREATE TRIGGER trg_set_address_tenant
  BEFORE INSERT ON public.kivro_addresses
  FOR EACH ROW EXECUTE FUNCTION public.set_address_tenant_id();

COMMENT ON TABLE public.tenants IS
  'Each row is a white-label reseller. Kivro itself is slug=kivro. All user data is isolated by tenant_id.';
