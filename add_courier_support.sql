-- Add support for courier user type and company information
-- Run this SQL in your Supabase SQL Editor

-- Add company_name column to profiles table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'company_name'
  ) THEN
    ALTER TABLE public.profiles 
    ADD COLUMN company_name VARCHAR(200);
  END IF;
END $$;

-- Update user_type column constraint to include courier
-- First, check if we need to add courier to the enum or constraint
-- Since user_type is a VARCHAR, we don't need to modify the type

-- Create an index on user_type for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_user_type ON public.profiles(user_type);

-- Add courier-specific metadata (optional, for future use)
CREATE TABLE IF NOT EXISTS public.courier_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    company_name VARCHAR(200),
    vehicle_type VARCHAR(50),
    service_areas TEXT[],
    is_verified BOOLEAN DEFAULT false,
    rating DECIMAL(3,2) DEFAULT 0.0,
    total_deliveries INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for courier_profiles
CREATE INDEX IF NOT EXISTS idx_courier_profiles_user_id ON public.courier_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_courier_profiles_verified ON public.courier_profiles(is_verified);

-- Enable RLS for courier_profiles
ALTER TABLE public.courier_profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for courier_profiles
CREATE POLICY "Couriers can view own profile" ON public.courier_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Couriers can update own profile" ON public.courier_profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Couriers can insert own profile" ON public.courier_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Admins can view all courier profiles
CREATE POLICY "Admins can view all courier profiles" ON public.courier_profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.user_type = 'admin'
        )
    );

-- Service role can do everything
CREATE POLICY "Service role can do everything on courier_profiles" ON public.courier_profiles
    FOR ALL USING (auth.role() = 'service_role');

-- Create trigger for updated_at on courier_profiles
CREATE TRIGGER handle_courier_profiles_updated_at
    BEFORE UPDATE ON public.courier_profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Create a view for courier statistics (optional)
CREATE OR REPLACE VIEW public.courier_stats AS
SELECT 
    cp.user_id,
    p.display_name,
    p.phone_number,
    cp.company_name,
    cp.is_verified,
    cp.rating,
    cp.total_deliveries,
    cp.created_at
FROM public.courier_profiles cp
JOIN public.profiles p ON p.user_id = cp.user_id
WHERE p.user_type = 'courier';

-- Grant access to the view
GRANT SELECT ON public.courier_stats TO authenticated;

COMMENT ON TABLE public.courier_profiles IS 'Extended profile information for courier users';
COMMENT ON COLUMN public.profiles.company_name IS 'Company name for courier or business users';
