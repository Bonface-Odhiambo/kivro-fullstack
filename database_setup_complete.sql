-- Kivro Database Setup (Complete Final Version)
-- Run this SQL in your Supabase SQL Editor

-- Create payment_requests table
CREATE TABLE IF NOT EXISTS public.payment_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    phone_number VARCHAR(15) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    account_reference VARCHAR(50) NOT NULL,
    transaction_desc VARCHAR(100),
    merchant_request_id VARCHAR(100),
    checkout_request_id VARCHAR(100) UNIQUE,
    status VARCHAR(20) DEFAULT 'pending',
    result_code INTEGER,
    result_desc TEXT,
    callback_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_subscriptions table
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    status VARCHAR(20) DEFAULT 'inactive',
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create kivro_addresses table
CREATE TABLE IF NOT EXISTS public.kivro_addresses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    kivro_code VARCHAR(20) UNIQUE NOT NULL,
    display_address TEXT NOT NULL,
    region VARCHAR(50) NOT NULL,
    district VARCHAR(100),
    landmark VARCHAR(200),
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create profiles table (if not exists)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    display_name VARCHAR(100),
    full_name VARCHAR(100),
    phone_number VARCHAR(15),
    user_type VARCHAR(20) DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create somali_postal_codes table
CREATE TABLE IF NOT EXISTS public.somali_postal_codes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    federal_member_state VARCHAR(50) NOT NULL,
    prefix VARCHAR(5) NOT NULL,
    region VARCHAR(100) NOT NULL,
    district VARCHAR(100) NOT NULL,
    postal_code VARCHAR(10) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_payment_requests_user_id ON public.payment_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_requests_checkout_id ON public.payment_requests(checkout_request_id);
CREATE INDEX IF NOT EXISTS idx_payment_requests_status ON public.payment_requests(status);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON public.user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_kivro_addresses_user_id ON public.kivro_addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_kivro_addresses_code ON public.kivro_addresses(kivro_code);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_somali_postal_codes_prefix ON public.somali_postal_codes(prefix);
CREATE INDEX IF NOT EXISTS idx_somali_postal_codes_district ON public.somali_postal_codes(district);

-- Enable Row Level Security (RLS)
ALTER TABLE public.payment_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kivro_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.somali_postal_codes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (now that tables exist)
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Users can view own payment requests" ON public.payment_requests;
    DROP POLICY IF EXISTS "Users can insert own payment requests" ON public.payment_requests;
    DROP POLICY IF EXISTS "Service role can do everything on payment_requests" ON public.payment_requests;
    DROP POLICY IF EXISTS "Users can view own subscriptions" ON public.user_subscriptions;
    DROP POLICY IF EXISTS "Users can update own subscriptions" ON public.user_subscriptions;
    DROP POLICY IF EXISTS "Service role can do everything on user_subscriptions" ON public.user_subscriptions;
    DROP POLICY IF EXISTS "Users can view own addresses" ON public.kivro_addresses;
    DROP POLICY IF EXISTS "Users can insert own addresses" ON public.kivro_addresses;
    DROP POLICY IF EXISTS "Users can update own addresses" ON public.kivro_addresses;
    DROP POLICY IF EXISTS "Service role can do everything on kivro_addresses" ON public.kivro_addresses;
    DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
    DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
    DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
    DROP POLICY IF EXISTS "Service role can do everything on profiles" ON public.profiles;
    DROP POLICY IF EXISTS "Anyone can read postal codes" ON public.somali_postal_codes;
    DROP POLICY IF EXISTS "Service role can do everything on postal codes" ON public.somali_postal_codes;
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

-- Create RLS policies for payment_requests
CREATE POLICY "Users can view own payment requests" ON public.payment_requests
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own payment requests" ON public.payment_requests
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can do everything on payment_requests" ON public.payment_requests
    FOR ALL USING (auth.role() = 'service_role');

-- Create RLS policies for user_subscriptions
CREATE POLICY "Users can view own subscriptions" ON public.user_subscriptions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own subscriptions" ON public.user_subscriptions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Service role can do everything on user_subscriptions" ON public.user_subscriptions
    FOR ALL USING (auth.role() = 'service_role');

-- Create RLS policies for kivro_addresses
CREATE POLICY "Users can view own addresses" ON public.kivro_addresses
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own addresses" ON public.kivro_addresses
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own addresses" ON public.kivro_addresses
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Service role can do everything on kivro_addresses" ON public.kivro_addresses
    FOR ALL USING (auth.role() = 'service_role');

-- Create RLS policies for profiles
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can do everything on profiles" ON public.profiles
    FOR ALL USING (auth.role() = 'service_role');

-- Allow everyone to read postal codes
CREATE POLICY "Anyone can read postal codes" ON public.somali_postal_codes
    FOR SELECT USING (true);

-- Service role can do everything on postal codes
CREATE POLICY "Service role can do everything on postal codes" ON public.somali_postal_codes
    FOR ALL USING (auth.role() = 'service_role');

-- Create functions for updated_at timestamps
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at (drop first if they exist)
DROP TRIGGER IF EXISTS handle_payment_requests_updated_at ON public.payment_requests;
CREATE TRIGGER handle_payment_requests_updated_at
    BEFORE UPDATE ON public.payment_requests
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_user_subscriptions_updated_at ON public.user_subscriptions;
CREATE TRIGGER handle_user_subscriptions_updated_at
    BEFORE UPDATE ON public.user_subscriptions
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_kivro_addresses_updated_at ON public.kivro_addresses;
CREATE TRIGGER handle_kivro_addresses_updated_at
    BEFORE UPDATE ON public.kivro_addresses
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_profiles_updated_at ON public.profiles;
CREATE TRIGGER handle_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Insert Complete Somali Postal Code Data
INSERT INTO public.somali_postal_codes (federal_member_state, prefix, region, district, postal_code) VALUES

-- COMPREHENSIVE FEDERAL MEMBER STATES DATA --

-- Somaliland
('Somaliland', 'SL', 'Maroodi Jeex', 'Hargeisa', 'SL-100'),
('Somaliland', 'SL', 'Maroodi Jeex', 'Baligubadle', 'SL-101'),
('Somaliland', 'SL', 'Maroodi Jeex', 'Salahley', 'SL-102'),
('Somaliland', 'SL', 'Awdal', 'Borama', 'SL-103'),
('Somaliland', 'SL', 'Awdal', 'Baki', 'SL-104'),
('Somaliland', 'SL', 'Awdal', 'Lughaya', 'SL-105'),
('Somaliland', 'SL', 'Awdal', 'Zeila', 'SL-106'),
('Somaliland', 'SL', 'Sahil', 'Berbera', 'SL-107'),
('Somaliland', 'SL', 'Sahil', 'Sheikh', 'SL-108'),
('Somaliland', 'SL', 'Togdheer', 'Burao', 'SL-109'),
('Somaliland', 'SL', 'Togdheer', 'Oodweyne', 'SL-110'),
('Somaliland', 'SL', 'Togdheer', 'Buuhoodle', 'SL-111'),
('Somaliland', 'SL', 'Sanaag (west)', 'Erigavo', 'SL-112'),
('Somaliland', 'SL', 'Sanaag (west)', 'Ceerigaabo Rural', 'SL-113'),
('Somaliland', 'SL', 'Sanaag (west)', 'Badhan', 'SL-114'),
('Somaliland', 'SL', 'Sool (west)', 'Laas Caanood', 'SL-115'),
('Somaliland', 'SL', 'Sool (west)', 'Taleh', 'SL-116'),
('Somaliland', 'SL', 'Sool (west)', 'Xudun', 'SL-117'),

-- Puntland
('Puntland', 'PL', 'Bari', 'Bosaso', 'PL-200'),
('Puntland', 'PL', 'Bari', 'Qandala', 'PL-201'),
('Puntland', 'PL', 'Bari', 'Iskushuban', 'PL-202'),
('Puntland', 'PL', 'Bari', 'Alula', 'PL-203'),
('Puntland', 'PL', 'Bari', 'Rako', 'PL-204'),
('Puntland', 'PL', 'Nugaal', 'Garowe', 'PL-205'),
('Puntland', 'PL', 'Nugaal', 'Eyl', 'PL-206'),
('Puntland', 'PL', 'Nugaal', 'Burtinle', 'PL-207'),
('Puntland', 'PL', 'Mudug (north)', 'Galkayo North', 'PL-208'),
('Puntland', 'PL', 'Mudug (north)', 'Galdogob', 'PL-209'),
('Puntland', 'PL', 'Mudug (north)', 'Jariban', 'PL-210'),
('Puntland', 'PL', 'Karkaar', 'Qardho', 'PL-211'),
('Puntland', 'PL', 'Karkaar', 'Waiye', 'PL-212'),
('Puntland', 'PL', 'Karkaar', 'Dangorayo', 'PL-213'),
('Puntland', 'PL', 'Sanaag (east)', 'Badhan East', 'PL-214'),
('Puntland', 'PL', 'Sanaag (east)', 'Lasqoray', 'PL-215'),
('Puntland', 'PL', 'Sool (east)', 'Taleh East', 'PL-216'),

-- Galmudug
('Galmudug', 'GM', 'Galguduud', 'Dusmareb', 'GM-300'),
('Galmudug', 'GM', 'Galguduud', 'Guriceel', 'GM-301'),
('Galmudug', 'GM', 'Galguduud', 'Abudwak', 'GM-302'),
('Galmudug', 'GM', 'Galguduud', 'Eel Buur', 'GM-303'),
('Galmudug', 'GM', 'Galguduud', 'Eeldheer', 'GM-304'),
('Galmudug', 'GM', 'Galguduud', 'Cadaado', 'GM-305'),
('Galmudug', 'GM', 'Mudug (south)', 'Galkayo South', 'GM-306'),
('Galmudug', 'GM', 'Mudug (south)', 'Hobyo', 'GM-307'),
('Galmudug', 'GM', 'Mudug (south)', 'Harardhere', 'GM-308'),
('Galmudug', 'GM', 'Mudug (south)', 'Jariiban South', 'GM-309'),

-- Hirshabelle
('Hirshabelle', 'HS', 'Hiiraan', 'Beledweyne', 'HS-400'),
('Hirshabelle', 'HS', 'Hiiraan', 'Bulo Burde', 'HS-401'),
('Hirshabelle', 'HS', 'Hiiraan', 'Jalalaqsi', 'HS-402'),
('Hirshabelle', 'HS', 'Middle Shabelle', 'Jowhar', 'HS-403'),
('Hirshabelle', 'HS', 'Middle Shabelle', 'Balcad', 'HS-404'),
('Hirshabelle', 'HS', 'Middle Shabelle', 'Adale', 'HS-405'),
('Hirshabelle', 'HS', 'Middle Shabelle', 'Mahaday', 'HS-406'),
('Hirshabelle', 'HS', 'Middle Shabelle', 'Warsheikh', 'HS-407'),

-- South West
('South West', 'SW', 'Bay', 'Baidoa', 'SW-500'),
('South West', 'SW', 'Bay', 'Burhakaba', 'SW-501'),
('South West', 'SW', 'Bay', 'Qansahdheere', 'SW-502'),
('South West', 'SW', 'Bakool', 'Hudur', 'SW-503'),
('South West', 'SW', 'Bakool', 'Wajid', 'SW-504'),
('South West', 'SW', 'Bakool', 'Tayeeglow', 'SW-505'),
('South West', 'SW', 'Bakool', 'Rabbo Weyne', 'SW-506'),
('South West', 'SW', 'Lower Shabelle', 'Marka', 'SW-507'),
('South West', 'SW', 'Lower Shabelle', 'Afgoye', 'SW-508'),
('South West', 'SW', 'Lower Shabelle', 'Qoryoley', 'SW-509'),
('South West', 'SW', 'Lower Shabelle', 'Kurtunwarey', 'SW-510'),
('South West', 'SW', 'Lower Shabelle', 'Sablaale', 'SW-511'),
('South West', 'SW', 'Lower Shabelle', 'Wanlaweyn', 'SW-512'),
('South West', 'SW', 'Lower Shabelle', 'Baraawe (Shabelle)', 'SW-513'),

-- Jubaland
('Jubaland', 'JL', 'Lower Juba', 'Kismayo', 'JL-600'),
('Jubaland', 'JL', 'Lower Juba', 'Afmadow', 'JL-601'),
('Jubaland', 'JL', 'Lower Juba', 'Badhaadhe', 'JL-602'),
('Jubaland', 'JL', 'Lower Juba', 'Jamaame', 'JL-603'),
('Jubaland', 'JL', 'Middle Juba', 'Bu''aale', 'JL-604'),
('Jubaland', 'JL', 'Middle Juba', 'Jilib', 'JL-605'),
('Jubaland', 'JL', 'Middle Juba', 'Saakow', 'JL-606'),
('Jubaland', 'JL', 'Gedo', 'Garbaharey', 'JL-607'),
('Jubaland', 'JL', 'Gedo', 'Luuq', 'JL-608'),
('Jubaland', 'JL', 'Gedo', 'Beled Hawo', 'JL-609'),
('Jubaland', 'JL', 'Gedo', 'Bardhere', 'JL-610'),
('Jubaland', 'JL', 'Gedo', 'Doolow', 'JL-611'),
('Jubaland', 'JL', 'Gedo', 'El Wak', 'JL-612'),

-- Benadir
('Benadir', 'BN', 'Mogadishu', 'Abdiaziz', 'BN-700'),
('Benadir', 'BN', 'Mogadishu', 'Bondhere', 'BN-701'),
('Benadir', 'BN', 'Mogadishu', 'Daynile', 'BN-702'),
('Benadir', 'BN', 'Mogadishu', 'Dharkenley', 'BN-703'),
('Benadir', 'BN', 'Mogadishu', 'Hamar Jajab', 'BN-704'),
('Benadir', 'BN', 'Mogadishu', 'Hamar Weyne', 'BN-705'),
('Benadir', 'BN', 'Mogadishu', 'Hawl Wadaag', 'BN-706'),
('Benadir', 'BN', 'Mogadishu', 'Heliwa', 'BN-707'),
('Benadir', 'BN', 'Mogadishu', 'Hodan', 'BN-708'),
('Benadir', 'BN', 'Mogadishu', 'Howlwadaag', 'BN-709'),
('Benadir', 'BN', 'Mogadishu', 'Karaan', 'BN-710'),
('Benadir', 'BN', 'Mogadishu', 'Kahda', 'BN-711'),
('Benadir', 'BN', 'Mogadishu', 'Shangani', 'BN-712'),
('Benadir', 'BN', 'Mogadishu', 'Shibis', 'BN-713'),
('Benadir', 'BN', 'Mogadishu', 'Waberi', 'BN-714'),
('Benadir', 'BN', 'Mogadishu', 'Wadajir', 'BN-715'),
('Benadir', 'BN', 'Mogadishu', 'Yaqshid', 'BN-716'),
('Benadir', 'BN', 'Mogadishu', 'Warta Nabadda', 'BN-717'),
('Benadir', 'BN', 'Mogadishu', 'Garasbaley', 'BN-718'),

-- ADDITIONAL REGIONAL CODES FROM YOUR IMAGE --

-- Updated Somaliland codes (matching your image)
('Somaliland', 'SL', 'Sahil', 'Berbera', 'SL-110'),
('Somaliland', 'SL', 'Togdheer', 'Burao', 'SL-120'),

-- Updated Puntland codes (matching your image)  
('Puntland', 'PL', 'Nugaal', 'Garowe', 'PL-200'),
('Puntland', 'PL', 'Bari', 'Bosaso', 'PL-210'),
('Puntland', 'PL', 'Mudug (north)', 'Galkayo', 'PL-220'),

-- South Central Somalia codes (matching your image)
('South Central', 'BN', 'Benadir', 'Mogadishu', 'BN-300'),
('South Central', 'BD', 'Bay', 'Baidoa', 'BD-310'),
('South Central', 'KS', 'Lower Juba', 'Kismayo', 'KS-320'),

-- Border Region codes (matching your image)
('Border Region', 'DL', 'Somali Region', 'Dhobley', 'DL-400'),
('Border Region', 'BW', 'Hiiraan', 'Beledweyne', 'BW-410')

ON CONFLICT (postal_code) DO NOTHING;
