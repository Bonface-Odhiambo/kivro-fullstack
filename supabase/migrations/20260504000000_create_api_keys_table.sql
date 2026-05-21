-- ============================================================================
-- API Keys Table
-- Stores API keys for B2B/government integrations.
-- The full key is NEVER stored — only a SHA-256 hash and a display prefix.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.api_keys (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Key identification
    name             VARCHAR(255) NOT NULL,
    key_hash         VARCHAR(64)  NOT NULL UNIQUE,  -- SHA-256 hex of the full key
    key_prefix       VARCHAR(20)  NOT NULL,          -- First 16 chars for display only

    -- Plan & limits
    plan             VARCHAR(20) NOT NULL DEFAULT 'business'
                       CHECK (plan IN ('pro', 'business', 'enterprise', 'government')),
    rate_limit_per_min INTEGER NOT NULL DEFAULT 300,

    -- Status
    status           VARCHAR(20) NOT NULL DEFAULT 'active'
                       CHECK (status IN ('active', 'revoked')),
    revoked_at       TIMESTAMPTZ,

    -- Usage tracking (approximate — updated asynchronously)
    requests_today   INTEGER NOT NULL DEFAULT 0,
    requests_month   INTEGER NOT NULL DEFAULT 0,
    last_used_at     TIMESTAMPTZ,

    -- Optional expiry
    expires_at       TIMESTAMPTZ,

    -- Timestamps
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id   ON public.api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash  ON public.api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_api_keys_status    ON public.api_keys(status);

-- RLS: users can only see their own keys; backend uses service role to bypass
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own keys"
  ON public.api_keys FOR SELECT
  USING (auth.uid() = user_id);

-- No INSERT/UPDATE/DELETE policies for end users — all mutations go through the backend
-- with the service role key, which bypasses RLS.

COMMENT ON TABLE  public.api_keys IS 'API keys for B2B and government integrations. Full key is never stored.';
COMMENT ON COLUMN public.api_keys.key_hash   IS 'SHA-256 hash of the full API key. Used for validation.';
COMMENT ON COLUMN public.api_keys.key_prefix IS 'First 16 characters of the key for display only.';
