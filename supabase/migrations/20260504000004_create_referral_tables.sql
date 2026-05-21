-- Referral codes (one per user, deterministic)
CREATE TABLE IF NOT EXISTS public.referral_codes (
    user_id    UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    code       VARCHAR(8) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_referral_codes_code ON public.referral_codes(code);

-- Referral uses
CREATE TABLE IF NOT EXISTS public.referral_uses (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_code     VARCHAR(8) NOT NULL,
    referrer_user_id  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    referred_user_id  UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    converted         BOOLEAN NOT NULL DEFAULT false,
    reward_granted    BOOLEAN NOT NULL DEFAULT false,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_referral_uses_referrer ON public.referral_uses(referrer_code);

ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_uses  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own referral code"
  ON public.referral_codes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users view own referral uses"
  ON public.referral_uses FOR SELECT USING (auth.uid() = referrer_user_id);
