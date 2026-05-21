-- Add support for courier user type
-- This migration adds courier-specific features to the KIVRO platform

-- 1. Ensure user_type column exists in profiles table and add index
CREATE INDEX IF NOT EXISTS idx_profiles_user_type ON public.profiles(user_type);

-- 2. Add company_name to profiles for courier users
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
    
    COMMENT ON COLUMN public.profiles.company_name IS 'Company name for courier or business users';
  END IF;
END $$;

-- 3. Create courier_profiles table for extended courier information
CREATE TABLE IF NOT EXISTS public.courier_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    company_name VARCHAR(200),
    vehicle_type VARCHAR(50) CHECK (vehicle_type IN ('motorcycle', 'car', 'van', 'truck', 'bicycle', 'other')),
    vehicle_registration VARCHAR(50),
    service_areas TEXT[], -- Array of regions they serve (e.g., ['mogadishu', 'hargeisa'])
    is_verified BOOLEAN DEFAULT false,
    verification_date TIMESTAMP WITH TIME ZONE,
    rating DECIMAL(3,2) DEFAULT 0.0 CHECK (rating >= 0 AND rating <= 5),
    total_deliveries INTEGER DEFAULT 0,
    successful_deliveries INTEGER DEFAULT 0,
    phone_number VARCHAR(20),
    emergency_contact VARCHAR(20),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add successful_deliveries column if it doesn't exist (for existing tables)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'courier_profiles' 
    AND column_name = 'successful_deliveries'
  ) THEN
    ALTER TABLE public.courier_profiles 
    ADD COLUMN successful_deliveries INTEGER DEFAULT 0;
  END IF;
END $$;

-- 4. Create indexes for courier_profiles
CREATE INDEX IF NOT EXISTS idx_courier_profiles_user_id ON public.courier_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_courier_profiles_verified ON public.courier_profiles(is_verified);
CREATE INDEX IF NOT EXISTS idx_courier_profiles_rating ON public.courier_profiles(rating);
CREATE INDEX IF NOT EXISTS idx_courier_profiles_service_areas ON public.courier_profiles USING GIN(service_areas);

-- 5. Enable RLS for courier_profiles
ALTER TABLE public.courier_profiles ENABLE ROW LEVEL SECURITY;

-- 6. Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Couriers can view own profile" ON public.courier_profiles;
DROP POLICY IF EXISTS "Couriers can update own profile" ON public.courier_profiles;
DROP POLICY IF EXISTS "Couriers can insert own profile" ON public.courier_profiles;
DROP POLICY IF EXISTS "Admins can view all courier profiles" ON public.courier_profiles;
DROP POLICY IF EXISTS "Service role can do everything on courier_profiles" ON public.courier_profiles;
DROP POLICY IF EXISTS "Public can view verified couriers" ON public.courier_profiles;

-- 7. Create RLS policies for courier_profiles
CREATE POLICY "Couriers can view own profile" 
ON public.courier_profiles
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Couriers can update own profile" 
ON public.courier_profiles
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Couriers can insert own profile" 
ON public.courier_profiles
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Allow admins to view all courier profiles
CREATE POLICY "Admins can view all courier profiles" 
ON public.courier_profiles
FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.user_id = auth.uid()
        AND profiles.user_type = 'admin'
    )
);

-- Allow public to view verified couriers (for courier search feature)
CREATE POLICY "Public can view verified couriers" 
ON public.courier_profiles
FOR SELECT 
USING (is_verified = true);

-- Service role can do everything
CREATE POLICY "Service role can do everything on courier_profiles" 
ON public.courier_profiles
FOR ALL 
USING (auth.role() = 'service_role');

-- 8. Create trigger for updated_at on courier_profiles
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS handle_courier_profiles_updated_at ON public.courier_profiles;

CREATE TRIGGER handle_courier_profiles_updated_at
    BEFORE UPDATE ON public.courier_profiles
    FOR EACH ROW 
    EXECUTE FUNCTION public.handle_updated_at();

-- 9. Create delivery_logs table to track courier deliveries
CREATE TABLE IF NOT EXISTS public.delivery_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    courier_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    address_id UUID REFERENCES public.kivro_addresses(id) ON DELETE SET NULL,
    kivro_code VARCHAR(50),
    delivery_type VARCHAR(50) CHECK (delivery_type IN ('pickup', 'delivery', 'taxi_pickup', 'taxi_dropoff')),
    status VARCHAR(50) CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled', 'failed')),
    pickup_time TIMESTAMP WITH TIME ZONE,
    delivery_time TIMESTAMP WITH TIME ZONE,
    customer_name VARCHAR(200),
    customer_phone VARCHAR(20),
    notes TEXT,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    feedback TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. Create indexes for delivery_logs
CREATE INDEX IF NOT EXISTS idx_delivery_logs_courier_id ON public.delivery_logs(courier_id);
CREATE INDEX IF NOT EXISTS idx_delivery_logs_address_id ON public.delivery_logs(address_id);
CREATE INDEX IF NOT EXISTS idx_delivery_logs_status ON public.delivery_logs(status);
CREATE INDEX IF NOT EXISTS idx_delivery_logs_created_at ON public.delivery_logs(created_at DESC);

-- 11. Enable RLS for delivery_logs
ALTER TABLE public.delivery_logs ENABLE ROW LEVEL SECURITY;

-- 12. Create RLS policies for delivery_logs
DROP POLICY IF EXISTS "Couriers can view own deliveries" ON public.delivery_logs;
DROP POLICY IF EXISTS "Couriers can insert own deliveries" ON public.delivery_logs;
DROP POLICY IF EXISTS "Couriers can update own deliveries" ON public.delivery_logs;
DROP POLICY IF EXISTS "Admins can view all deliveries" ON public.delivery_logs;

CREATE POLICY "Couriers can view own deliveries" 
ON public.delivery_logs
FOR SELECT 
USING (auth.uid() = courier_id);

CREATE POLICY "Couriers can insert own deliveries" 
ON public.delivery_logs
FOR INSERT 
WITH CHECK (auth.uid() = courier_id);

CREATE POLICY "Couriers can update own deliveries" 
ON public.delivery_logs
FOR UPDATE 
USING (auth.uid() = courier_id);

CREATE POLICY "Admins can view all deliveries" 
ON public.delivery_logs
FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.user_id = auth.uid()
        AND profiles.user_type = 'admin'
    )
);

-- 13. Create trigger for updated_at on delivery_logs
DROP TRIGGER IF EXISTS handle_delivery_logs_updated_at ON public.delivery_logs;

CREATE TRIGGER handle_delivery_logs_updated_at
    BEFORE UPDATE ON public.delivery_logs
    FOR EACH ROW 
    EXECUTE FUNCTION public.handle_updated_at();

-- 14. Create a view for courier statistics
-- Drop the view first if it exists to avoid column mismatch errors
DROP VIEW IF EXISTS public.courier_stats;

CREATE VIEW public.courier_stats AS
SELECT 
    cp.user_id,
    p.display_name,
    p.phone_number,
    cp.company_name,
    cp.vehicle_type,
    cp.is_verified,
    cp.rating,
    cp.total_deliveries,
    cp.successful_deliveries,
    CASE 
        WHEN cp.total_deliveries > 0 
        THEN ROUND((cp.successful_deliveries::DECIMAL / cp.total_deliveries * 100), 2)
        ELSE 0 
    END as success_rate,
    cp.service_areas,
    cp.created_at
FROM public.courier_profiles cp
JOIN public.profiles p ON p.user_id = cp.user_id
WHERE p.user_type = 'courier';

-- 15. Grant access to the view
GRANT SELECT ON public.courier_stats TO authenticated;

-- 16. Add helpful comments
COMMENT ON TABLE public.courier_profiles IS 'Extended profile information for courier users including verification status and ratings';
COMMENT ON TABLE public.delivery_logs IS 'Tracks all deliveries and pickups performed by couriers';
COMMENT ON COLUMN public.courier_profiles.service_areas IS 'Array of regions the courier serves (e.g., [''mogadishu'', ''hargeisa''])';
COMMENT ON COLUMN public.courier_profiles.rating IS 'Average rating from 0 to 5 stars';
COMMENT ON COLUMN public.delivery_logs.delivery_type IS 'Type of delivery: pickup, delivery, taxi_pickup, or taxi_dropoff';
