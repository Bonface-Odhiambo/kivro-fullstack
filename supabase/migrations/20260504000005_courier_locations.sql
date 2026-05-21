-- Courier real-time location table
CREATE TABLE IF NOT EXISTS public.courier_locations (
    courier_user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    latitude        DOUBLE PRECISION NOT NULL,
    longitude       DOUBLE PRECISION NOT NULL,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.courier_locations ENABLE ROW LEVEL SECURITY;

-- Couriers write their own location; dispatchers/admins read via service role
CREATE POLICY "Couriers update own location"
  ON public.courier_locations FOR ALL
  USING (auth.uid() = courier_user_id);
