-- ============================================================================
-- government_senders — verified government/institutional message senders
-- Referenced by inbox.js for the government inbox tab
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.government_senders (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   UUID REFERENCES public.tenants(id) ON DELETE CASCADE
                  DEFAULT '00000000-0000-0000-0000-000000000001',
    name        VARCHAR(255) NOT NULL,
    department  VARCHAR(255),
    country     VARCHAR(100),
    logo_url    TEXT,
    is_verified BOOLEAN NOT NULL DEFAULT false,
    is_active   BOOLEAN NOT NULL DEFAULT true,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_government_senders_tenant ON public.government_senders(tenant_id);
CREATE INDEX IF NOT EXISTS idx_government_senders_active ON public.government_senders(is_active);

ALTER TABLE public.government_senders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active verified senders"
  ON public.government_senders FOR SELECT
  USING (is_active = true AND is_verified = true);

-- ── message_categories ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.message_categories (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(100) NOT NULL,
    slug        VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    icon        VARCHAR(50),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed default categories
INSERT INTO public.message_categories (name, slug, icon) VALUES
  ('General',      'general',      'mail'),
  ('Delivery',     'delivery',     'package'),
  ('Government',   'government',   'shield'),
  ('Finance',      'finance',      'credit-card'),
  ('Health',       'health',       'heart'),
  ('Promotions',   'promotions',   'tag')
ON CONFLICT (slug) DO NOTHING;

COMMENT ON TABLE public.government_senders IS
  'Verified government and institutional senders for the Kivro inbox.';
COMMENT ON TABLE public.message_categories IS
  'Message category taxonomy for inbox filtering.';
