-- ============================================================================
-- Phase 2: Billing Engine
-- subscriptions, usage_meters, revenue_ledger, invoices, dunning_log
-- Supports multi-currency including XOF (CFA Franc) for West Africa
-- ============================================================================

-- ── 1. Expand currency support ───────────────────────────────────────────────
ALTER TABLE public.payment_requests
  DROP CONSTRAINT IF EXISTS valid_currency;
ALTER TABLE public.payment_requests
  ADD CONSTRAINT valid_currency CHECK (currency IN (
    'USD','EUR','GBP','KES','TZS','UGX','RWF','ETB','SOS',
    'XOF','XAF','NGN','GHS','ZAR','EGP','MAD','MZN','AOA'
  ));

ALTER TABLE public.payment_transactions
  DROP CONSTRAINT IF EXISTS valid_currency;

-- ── 2. Currency conversion rates (refreshed daily by edge function) ──────────
CREATE TABLE IF NOT EXISTS public.currency_rates (
    base        VARCHAR(3) PRIMARY KEY,  -- 'USD'
    rates       JSONB NOT NULL,          -- { "XOF": 600.5, "KES": 132.4, ... }
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO public.currency_rates (base, rates) VALUES (
  'USD',
  '{"XOF":600,"XAF":600,"KES":132,"NGN":1580,"GHS":15,"ZAR":19,"EGP":49,"MAD":10,"TZS":2700,"UGX":3800,"RWF":1350,"ETB":57,"SOS":571}'
) ON CONFLICT (base) DO NOTHING;

-- ── 3. Subscriptions ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    plan            VARCHAR(30) NOT NULL CHECK (plan IN ('free','pro','business','enterprise','government')),
    status          VARCHAR(20) NOT NULL DEFAULT 'active'
                      CHECK (status IN ('active','cancelled','past_due','suspended','trialing')),

    -- Pricing
    amount          DECIMAL(10,2) NOT NULL,
    currency        VARCHAR(3) NOT NULL DEFAULT 'USD',
    interval        VARCHAR(10) NOT NULL DEFAULT 'month' CHECK (interval IN ('month','year')),

    -- Period
    current_period_start  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    current_period_end    TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '1 month'),
    trial_end             TIMESTAMPTZ,
    cancelled_at          TIMESTAMPTZ,

    -- Payment
    payment_method_id     UUID REFERENCES public.payment_methods(id) ON DELETE SET NULL,
    last_payment_at       TIMESTAMPTZ,
    next_billing_at       TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '1 month'),

    -- Dunning
    payment_failure_count  INTEGER NOT NULL DEFAULT 0,
    last_failure_at        TIMESTAMPTZ,

    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_tenant   ON public.subscriptions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user     ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status   ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_next_billing ON public.subscriptions(next_billing_at)
  WHERE status IN ('active','past_due');

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own subscriptions"
  ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);

-- ── 4. Usage meters (per tenant per month) ───────────────────────────────────
CREATE TABLE IF NOT EXISTS public.usage_meters (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id    UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    period       VARCHAR(7) NOT NULL,  -- '2026-05'
    addresses    INTEGER NOT NULL DEFAULT 0,
    api_calls    INTEGER NOT NULL DEFAULT 0,
    sms_sent     INTEGER NOT NULL DEFAULT 0,
    active_users INTEGER NOT NULL DEFAULT 0,
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (tenant_id, period)
);

CREATE INDEX IF NOT EXISTS idx_usage_meters_tenant ON public.usage_meters(tenant_id);

-- ── 5. Revenue ledger ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.revenue_ledger (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    user_id         UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    period          VARCHAR(7) NOT NULL,  -- '2026-05'

    description     TEXT NOT NULL,
    type            VARCHAR(30) NOT NULL
                      CHECK (type IN ('subscription','platform_fee','overage','refund','adjustment')),

    -- Amounts
    gross_amount    DECIMAL(10,2) NOT NULL,
    platform_cut    DECIMAL(10,2) NOT NULL DEFAULT 0,  -- Kivro's share
    reseller_share  DECIMAL(10,2) NOT NULL DEFAULT 0,  -- reseller's share
    currency        VARCHAR(3) NOT NULL DEFAULT 'USD',
    amount_usd      DECIMAL(10,2),  -- normalised for reporting

    payment_id      UUID REFERENCES public.payment_transactions(id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_revenue_ledger_tenant ON public.revenue_ledger(tenant_id);
CREATE INDEX IF NOT EXISTS idx_revenue_ledger_period ON public.revenue_ledger(period);

-- ── 6. Invoices ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.invoices (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    invoice_number  VARCHAR(30) NOT NULL UNIQUE,  -- INV-CI-2026-05-001
    period          VARCHAR(7) NOT NULL,

    status          VARCHAR(20) NOT NULL DEFAULT 'draft'
                      CHECK (status IN ('draft','sent','paid','overdue','void')),

    -- Line items stored as JSONB
    line_items      JSONB NOT NULL DEFAULT '[]',

    subtotal        DECIMAL(10,2) NOT NULL DEFAULT 0,
    tax             DECIMAL(10,2) NOT NULL DEFAULT 0,
    total           DECIMAL(10,2) NOT NULL DEFAULT 0,
    currency        VARCHAR(3) NOT NULL DEFAULT 'USD',

    due_date        TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '14 days'),
    paid_at         TIMESTAMPTZ,
    pdf_url         TEXT,

    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invoices_tenant  ON public.invoices(tenant_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status  ON public.invoices(status);

-- ── 7. Dunning log ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.dunning_log (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE CASCADE,
    attempt         INTEGER NOT NULL DEFAULT 1,
    status          VARCHAR(20) NOT NULL CHECK (status IN ('pending','attempted','succeeded','failed','suspended')),
    error_message   TEXT,
    next_retry_at   TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 8. Helper: record usage atomically ───────────────────────────────────────
CREATE OR REPLACE FUNCTION public.increment_usage(
  p_tenant_id UUID,
  p_period    VARCHAR,
  p_field     VARCHAR,
  p_amount    INTEGER DEFAULT 1
)
RETURNS VOID LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO public.usage_meters (tenant_id, period)
  VALUES (p_tenant_id, p_period)
  ON CONFLICT (tenant_id, period) DO NOTHING;

  EXECUTE format(
    'UPDATE public.usage_meters SET %I = %I + $1, updated_at = NOW()
     WHERE tenant_id = $2 AND period = $3',
    p_field, p_field
  ) USING p_amount, p_tenant_id, p_period;
END;
$$;

-- ── 9. Monthly invoice generation function ────────────────────────────────────
CREATE OR REPLACE FUNCTION public.generate_monthly_invoices(p_period VARCHAR)
RETURNS INTEGER LANGUAGE plpgsql AS $$
DECLARE
  rec RECORD;
  inv_number VARCHAR;
  line_items JSONB;
  total DECIMAL;
  counter INTEGER := 0;
BEGIN
  FOR rec IN
    SELECT t.id, t.slug, t.name, t.plan,
           COALESCE(um.addresses, 0) AS addresses,
           COALESCE(um.active_users, 0) AS active_users,
           COALESCE(um.api_calls, 0) AS api_calls
    FROM public.tenants t
    LEFT JOIN public.usage_meters um ON um.tenant_id = t.id AND um.period = p_period
    WHERE t.is_active = true AND t.slug != 'kivro'
  LOOP
    -- Platform fee by plan
    total := CASE rec.plan
      WHEN 'starter'    THEN 150.00
      WHEN 'growth'     THEN 400.00
      WHEN 'scale'      THEN 800.00
      WHEN 'enterprise' THEN 1500.00
      ELSE 150.00
    END;

    line_items := jsonb_build_array(
      jsonb_build_object('description', 'Platform fee (' || rec.plan || ' plan)', 'amount', total),
      jsonb_build_object('description', 'Active users: ' || rec.active_users, 'amount', 0),
      jsonb_build_object('description', 'Addresses created: ' || rec.addresses, 'amount', 0),
      jsonb_build_object('description', 'API calls: ' || rec.api_calls, 'amount', 0)
    );

    inv_number := 'INV-' || UPPER(rec.slug) || '-' || REPLACE(p_period,'-','') || '-' ||
                  LPAD(counter::TEXT, 3, '0');

    INSERT INTO public.invoices (tenant_id, invoice_number, period, line_items, subtotal, total, status)
    VALUES (rec.id, inv_number, p_period, line_items, total, total, 'sent')
    ON CONFLICT (invoice_number) DO NOTHING;

    counter := counter + 1;
  END LOOP;

  RETURN counter;
END;
$$;

COMMENT ON TABLE public.subscriptions IS 'Per-user subscription records with plan, status, and billing dates.';
COMMENT ON TABLE public.revenue_ledger IS 'Immutable ledger of every revenue event — platform fee, subscription, refund.';
COMMENT ON TABLE public.invoices IS 'Monthly invoices generated for each white-label tenant.';
