-- ============================================================================
-- Government Services System
-- Creates tables for government service applications and tracking
-- ============================================================================

-- Create government departments table
CREATE TABLE IF NOT EXISTS public.government_departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    website_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create government services table
CREATE TABLE IF NOT EXISTS public.government_services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_id VARCHAR(50) UNIQUE NOT NULL, -- GS001
    service_name VARCHAR(255) NOT NULL,
    department_id UUID REFERENCES public.government_departments(id) ON DELETE SET NULL,
    description TEXT,
    requirements TEXT[],
    processing_time VARCHAR(100), -- e.g., "5-7 business days"
    fee_amount DECIMAL(10, 2),
    is_online BOOLEAN DEFAULT true,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create government service applications table
CREATE TABLE IF NOT EXISTS public.government_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id VARCHAR(50) UNIQUE NOT NULL, -- APP001234
    service_id UUID REFERENCES public.government_services(id) ON DELETE SET NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Applicant information
    applicant_name VARCHAR(255) NOT NULL,
    applicant_phone VARCHAR(50),
    applicant_email VARCHAR(255),
    applicant_address TEXT,
    kivro_address_id UUID REFERENCES public.kivro_addresses(id) ON DELETE SET NULL,
    
    -- Application details
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    -- Status: pending, under_review, approved, rejected, completed, cancelled
    priority VARCHAR(20) DEFAULT 'normal',
    -- Priority: low, normal, high, urgent
    
    -- Documents
    documents JSONB, -- Array of document URLs and metadata
    
    -- Processing
    assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    review_notes TEXT,
    
    -- Payment
    fee_amount DECIMAL(10, 2),
    payment_status VARCHAR(50) DEFAULT 'unpaid',
    payment_method VARCHAR(50),
    payment_reference VARCHAR(100),
    paid_at TIMESTAMPTZ,
    
    -- Timestamps
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Metadata
    metadata JSONB,
    
    CONSTRAINT valid_application_status CHECK (status IN ('pending', 'under_review', 'approved', 'rejected', 'completed', 'cancelled')),
    CONSTRAINT valid_priority CHECK (priority IN ('low', 'normal', 'high', 'urgent'))
);

-- Create application status history table
CREATE TABLE IF NOT EXISTS public.application_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID REFERENCES public.government_applications(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL,
    notes TEXT,
    changed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_gov_services_department ON public.government_services(department_id);
CREATE INDEX idx_gov_services_active ON public.government_services(is_active);
CREATE INDEX idx_gov_applications_service ON public.government_applications(service_id);
CREATE INDEX idx_gov_applications_user ON public.government_applications(user_id);
CREATE INDEX idx_gov_applications_status ON public.government_applications(status);
CREATE INDEX idx_gov_applications_submitted ON public.government_applications(submitted_at);
CREATE INDEX idx_application_history_app ON public.application_status_history(application_id);

-- Create sequences
CREATE SEQUENCE IF NOT EXISTS government_service_id_seq START 1;
CREATE SEQUENCE IF NOT EXISTS government_application_id_seq START 1;

-- Create function to auto-generate service ID
CREATE OR REPLACE FUNCTION generate_government_service_id()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.service_id IS NULL THEN
        NEW.service_id := 'GS' || LPAD(NEXTVAL('government_service_id_seq')::TEXT, 6, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create function to auto-generate application ID
CREATE OR REPLACE FUNCTION generate_application_id()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.application_id IS NULL THEN
        NEW.application_id := 'APP' || LPAD(NEXTVAL('government_application_id_seq')::TEXT, 6, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER trigger_generate_government_service_id
    BEFORE INSERT ON public.government_services
    FOR EACH ROW
    EXECUTE FUNCTION generate_government_service_id();

CREATE TRIGGER trigger_generate_application_id
    BEFORE INSERT ON public.government_applications
    FOR EACH ROW
    EXECUTE FUNCTION generate_application_id();

-- Create function to log application status changes
CREATE OR REPLACE FUNCTION log_application_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO public.application_status_history (application_id, status, notes, changed_by)
        VALUES (NEW.id, NEW.status, 'Status changed from ' || OLD.status || ' to ' || NEW.status, NEW.assigned_to);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for logging status changes
CREATE TRIGGER trigger_log_application_status
    AFTER UPDATE ON public.government_applications
    FOR EACH ROW
    EXECUTE FUNCTION log_application_status_change();

-- Enable Row Level Security
ALTER TABLE public.government_departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.government_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.government_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_status_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view active departments"
    ON public.government_departments FOR SELECT
    USING (is_active = true);

CREATE POLICY "Anyone can view active services"
    ON public.government_services FOR SELECT
    USING (is_active = true);

CREATE POLICY "Users can view their own applications"
    ON public.government_applications FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all applications"
    ON public.government_applications FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.user_type = 'admin'
        )
    );

CREATE POLICY "Users can create applications"
    ON public.government_applications FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update applications"
    ON public.government_applications FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.user_type = 'admin'
        )
    );

CREATE POLICY "Users can view their application history"
    ON public.application_status_history FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.government_applications
            WHERE government_applications.id = application_status_history.application_id
            AND government_applications.user_id = auth.uid()
        )
    );

-- Insert sample departments
INSERT INTO public.government_departments (name, code, description, contact_email, contact_phone) VALUES
('Civil Registration', 'CIVIL_REG', 'Birth certificates, death certificates, marriage registration', 'civil@gov.so', '+252612000001'),
('Commerce & Industry', 'COMMERCE', 'Business registration, trade licenses, import/export permits', 'commerce@gov.so', '+252612000002'),
('Immigration Services', 'IMMIGRATION', 'Passport applications, visa processing, residency permits', 'immigration@gov.so', '+252612000003'),
('Ministry of Health', 'HEALTH', 'Health certificates, medical licenses, vaccination records', 'health@gov.so', '+252612000004'),
('Ministry of Education', 'EDUCATION', 'Certificate verification, school registration', 'education@gov.so', '+252612000005');

-- Insert sample services
INSERT INTO public.government_services (
    service_id, service_name, department_id, description, processing_time, fee_amount, is_online
) VALUES
('GS000001', 'Birth Certificate Registration', 
 (SELECT id FROM public.government_departments WHERE code = 'CIVIL_REG'),
 'Register a new birth and obtain official birth certificate', '5-7 business days', 25.00, true),
 
('GS000002', 'Business License Application', 
 (SELECT id FROM public.government_departments WHERE code = 'COMMERCE'),
 'Apply for a business operating license', '10-14 business days', 150.00, true),
 
('GS000003', 'Passport Application', 
 (SELECT id FROM public.government_departments WHERE code = 'IMMIGRATION'),
 'Apply for a new passport or renewal', '15-20 business days', 80.00, true),
 
('GS000004', 'Health Certificate', 
 (SELECT id FROM public.government_departments WHERE code = 'HEALTH'),
 'Obtain health certificate for travel or employment', '3-5 business days', 30.00, true),
 
('GS000005', 'Certificate Verification', 
 (SELECT id FROM public.government_departments WHERE code = 'EDUCATION'),
 'Verify educational certificates and transcripts', '7-10 business days', 40.00, true);

-- Insert sample applications
INSERT INTO public.government_applications (
    application_id, service_id, applicant_name, applicant_phone, applicant_email,
    status, priority, fee_amount, payment_status, submitted_at
) VALUES
('APP000001', 
 (SELECT id FROM public.government_services WHERE service_id = 'GS000001'),
 'Ahmed Hassan', '+252612345001', 'ahmed@example.com',
 'under_review', 'normal', 25.00, 'paid', NOW() - INTERVAL '3 days'),
 
('APP000002', 
 (SELECT id FROM public.government_services WHERE service_id = 'GS000002'),
 'Fatima Omar', '+252612345002', 'fatima@example.com',
 'approved', 'high', 150.00, 'paid', NOW() - INTERVAL '10 days'),
 
('APP000003', 
 (SELECT id FROM public.government_services WHERE service_id = 'GS000003'),
 'Mohamed Ali', '+252612345003', 'mohamed@example.com',
 'pending', 'urgent', 80.00, 'unpaid', NOW() - INTERVAL '1 day'),
 
('APP000004', 
 (SELECT id FROM public.government_services WHERE service_id = 'GS000004'),
 'Khadija Yusuf', '+252612345004', 'khadija@example.com',
 'completed', 'normal', 30.00, 'paid', NOW() - INTERVAL '15 days'),
 
('APP000005', 
 (SELECT id FROM public.government_services WHERE service_id = 'GS000005'),
 'Abdi Ibrahim', '+252612345005', 'abdi@example.com',
 'rejected', 'normal', 40.00, 'refunded', NOW() - INTERVAL '7 days');

-- Grant permissions
GRANT SELECT ON public.government_departments TO authenticated;
GRANT SELECT ON public.government_services TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.government_applications TO authenticated;
GRANT SELECT ON public.application_status_history TO authenticated;
GRANT USAGE ON SEQUENCE government_service_id_seq TO authenticated;
GRANT USAGE ON SEQUENCE government_application_id_seq TO authenticated;

COMMENT ON TABLE public.government_departments IS 'Stores government department information';
COMMENT ON TABLE public.government_services IS 'Stores available government services';
COMMENT ON TABLE public.government_applications IS 'Stores government service applications';
COMMENT ON TABLE public.application_status_history IS 'Stores application status change history';
