-- ============================================================================
-- Business & Government Onboarding Requests
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.business_onboarding_requests (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id          UUID REFERENCES auth.users(id) ON DELETE SET NULL,

    org_type         VARCHAR(30),
    org_name         VARCHAR(255) NOT NULL,
    reg_number       VARCHAR(100),
    country          VARCHAR(100) NOT NULL,
    city             VARCHAR(100),
    website          TEXT,

    contact_name     VARCHAR(255) NOT NULL,
    contact_email    VARCHAR(255) NOT NULL,
    contact_phone    VARCHAR(50),
    contact_role     VARCHAR(100),

    use_case         TEXT NOT NULL,
    estimated_users  VARCHAR(50),
    plan             VARCHAR(30) NOT NULL
                       CHECK (plan IN ('business', 'enterprise', 'government')),

    status           VARCHAR(30) NOT NULL DEFAULT 'pending'
                       CHECK (status IN ('pending', 'approved', 'rejected', 'in_review')),
    review_notes     TEXT,
    reviewed_by      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    reviewed_at      TIMESTAMPTZ,

    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_onboarding_status     ON public.business_onboarding_requests(status);
CREATE INDEX IF NOT EXISTS idx_onboarding_country    ON public.business_onboarding_requests(country);
CREATE INDEX IF NOT EXISTS idx_onboarding_created_at ON public.business_onboarding_requests(created_at);

-- RLS: public cannot read; admins via service role only
ALTER TABLE public.business_onboarding_requests ENABLE ROW LEVEL SECURITY;

-- Applicant can see their own submission if authenticated
CREATE POLICY "Applicants view own requests"
  ON public.business_onboarding_requests FOR SELECT
  USING (auth.uid() = user_id);

COMMENT ON TABLE public.business_onboarding_requests IS
  'Tracks B2B and government onboarding applications. Reviewed by Kivro admin team.';
