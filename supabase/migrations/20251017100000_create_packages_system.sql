-- ============================================================================
-- Package Management System
-- Creates tables for package tracking and delivery management
-- ============================================================================

-- Create packages table
CREATE TABLE IF NOT EXISTS public.packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    package_id VARCHAR(50) UNIQUE NOT NULL, -- PKG001234
    qr_code VARCHAR(100) UNIQUE NOT NULL, -- KV-SO-001234
    
    -- Sender information
    sender_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    sender_name VARCHAR(255) NOT NULL,
    sender_phone VARCHAR(50),
    sender_address TEXT,
    sender_kivro_address_id UUID REFERENCES public.kivro_addresses(id) ON DELETE SET NULL,
    
    -- Recipient information
    recipient_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    recipient_name VARCHAR(255) NOT NULL,
    recipient_phone VARCHAR(50),
    recipient_address TEXT NOT NULL,
    recipient_kivro_address VARCHAR(100), -- KV-SO-48F2-9XQ1
    recipient_kivro_address_id UUID REFERENCES public.kivro_addresses(id) ON DELETE SET NULL,
    
    -- Package details
    weight DECIMAL(10, 2), -- in kg
    dimensions VARCHAR(100), -- e.g., "30x20x15 cm"
    description TEXT,
    value DECIMAL(10, 2), -- declared value
    
    -- Status tracking
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    -- Status options: pending, processing, in_transit, out_for_delivery, delivered, cancelled, returned
    
    -- Courier assignment
    courier_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    picked_up_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    
    -- Additional metadata
    notes TEXT,
    delivery_instructions TEXT,
    signature_url TEXT, -- URL to delivery signature image
    photo_url TEXT, -- URL to delivery photo
    
    -- Pricing
    shipping_cost DECIMAL(10, 2),
    payment_status VARCHAR(50) DEFAULT 'unpaid', -- unpaid, paid, refunded
    payment_method VARCHAR(50),
    
    CONSTRAINT valid_status CHECK (status IN ('pending', 'processing', 'in_transit', 'out_for_delivery', 'delivered', 'cancelled', 'returned'))
);

-- Create package tracking history table
CREATE TABLE IF NOT EXISTS public.package_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    package_id UUID REFERENCES public.packages(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL,
    location TEXT,
    notes TEXT,
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_packages_sender ON public.packages(sender_user_id);
CREATE INDEX idx_packages_recipient ON public.packages(recipient_user_id);
CREATE INDEX idx_packages_courier ON public.packages(courier_id);
CREATE INDEX idx_packages_status ON public.packages(status);
CREATE INDEX idx_packages_created_at ON public.packages(created_at);
CREATE INDEX idx_packages_qr_code ON public.packages(qr_code);
CREATE INDEX idx_package_tracking_package_id ON public.package_tracking(package_id);

-- Create function to auto-generate package ID
CREATE OR REPLACE FUNCTION generate_package_id()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.package_id IS NULL THEN
        NEW.package_id := 'PKG' || LPAD(NEXTVAL('package_id_seq')::TEXT, 6, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create sequence for package IDs
CREATE SEQUENCE IF NOT EXISTS package_id_seq START 1;

-- Create trigger for auto-generating package IDs
CREATE TRIGGER trigger_generate_package_id
    BEFORE INSERT ON public.packages
    FOR EACH ROW
    EXECUTE FUNCTION generate_package_id();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_package_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updating timestamp
CREATE TRIGGER trigger_update_package_timestamp
    BEFORE UPDATE ON public.packages
    FOR EACH ROW
    EXECUTE FUNCTION update_package_timestamp();

-- Create function to log package status changes
CREATE OR REPLACE FUNCTION log_package_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO public.package_tracking (package_id, status, notes, updated_by)
        VALUES (NEW.id, NEW.status, 'Status changed from ' || OLD.status || ' to ' || NEW.status, NEW.courier_id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for logging status changes
CREATE TRIGGER trigger_log_package_status
    AFTER UPDATE ON public.packages
    FOR EACH ROW
    EXECUTE FUNCTION log_package_status_change();

-- Enable Row Level Security
ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.package_tracking ENABLE ROW LEVEL SECURITY;

-- RLS Policies for packages
CREATE POLICY "Users can view their own packages as sender"
    ON public.packages FOR SELECT
    USING (auth.uid() = sender_user_id);

CREATE POLICY "Users can view their own packages as recipient"
    ON public.packages FOR SELECT
    USING (auth.uid() = recipient_user_id);

CREATE POLICY "Couriers can view assigned packages"
    ON public.packages FOR SELECT
    USING (auth.uid() = courier_id);

CREATE POLICY "Admins can view all packages"
    ON public.packages FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.user_type = 'admin'
        )
    );

CREATE POLICY "Admins can insert packages"
    ON public.packages FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.user_type IN ('admin', 'courier')
        )
    );

CREATE POLICY "Admins and couriers can update packages"
    ON public.packages FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.user_type IN ('admin', 'courier')
        )
    );

-- RLS Policies for package tracking
CREATE POLICY "Users can view tracking for their packages"
    ON public.package_tracking FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.packages
            WHERE packages.id = package_tracking.package_id
            AND (packages.sender_user_id = auth.uid() OR packages.recipient_user_id = auth.uid() OR packages.courier_id = auth.uid())
        )
    );

CREATE POLICY "Admins can view all tracking"
    ON public.package_tracking FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.user_type = 'admin'
        )
    );

-- Insert sample packages for testing
INSERT INTO public.packages (
    package_id, qr_code, sender_name, sender_phone, sender_address,
    recipient_name, recipient_phone, recipient_address, recipient_kivro_address,
    weight, dimensions, description, status, shipping_cost, payment_status
) VALUES
('PKG000001', 'KV-SO-001234', 'Ahmed Mohamed', '+252612345678', 'Hodan District, Mogadishu',
 'Fatima Hassan', '+252613456789', 'Hodan District, Mogadishu', 'KV-SO-48F2-9XQ1',
 2.5, '30x20x15 cm', 'Electronics', 'in_transit', 15.00, 'paid'),
 
('PKG000002', 'KV-SO-001235', 'Omar Ali', '+252614567890', 'Ahmed Gurey District, Hargeisa',
 'Khadija Ahmed', '+252615678901', 'Ahmed Gurey District, Hargeisa', 'KV-SO-72G8-5MN2',
 1.2, '25x15x10 cm', 'Documents', 'delivered', 10.00, 'paid'),
 
('PKG000003', 'KV-SO-001236', 'Sahra Ibrahim', '+252616789012', 'Shirkole District, Kismayo',
 'Hassan Omar', '+252617890123', 'Shirkole District, Kismayo', 'KV-SO-91B4-3PQ7',
 5.0, '40x30x25 cm', 'Clothing', 'pending', 20.00, 'unpaid'),
 
('PKG000004', 'KV-SO-001237', 'Amina Yusuf', '+252618901234', 'Isha District, Baidoa',
 'Mohamed Said', '+252619012345', 'Isha District, Baidoa', 'KV-SO-56H9-8RT4',
 0.8, '20x15x8 cm', 'Books', 'out_for_delivery', 8.00, 'paid'),
 
('PKG000005', 'KV-SO-001238', 'Abdullahi Hersi', '+252610123456', 'Horseed District, Bosaso',
 'Maryan Ali', '+252611234567', 'Horseed District, Bosaso', 'KV-SO-23D7-6YU1',
 3.2, '35x25x20 cm', 'Household items', 'processing', 18.00, 'paid');

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON public.packages TO authenticated;
GRANT SELECT, INSERT ON public.package_tracking TO authenticated;
GRANT USAGE ON SEQUENCE package_id_seq TO authenticated;

COMMENT ON TABLE public.packages IS 'Stores package/delivery information for tracking';
COMMENT ON TABLE public.package_tracking IS 'Stores package status change history';
