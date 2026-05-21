-- KIVRO Digital Inbox System (Similar to Swedish Mina Meddelanden)
-- Run this SQL in your Supabase SQL Editor

-- Create message_categories table for organizing different types of official communications
CREATE TABLE IF NOT EXISTS public.message_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    icon VARCHAR(50), -- Icon name for UI
    color VARCHAR(20), -- Color code for UI
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create government_senders table to track authorized government agencies
CREATE TABLE IF NOT EXISTS public.government_senders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_name VARCHAR(200) NOT NULL,
    organization_code VARCHAR(50) UNIQUE NOT NULL, -- e.g., 'POLICE', 'TAX_AUTHORITY', 'HEALTH_DEPT'
    contact_email VARCHAR(100),
    contact_phone VARCHAR(20),
    is_verified BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    logo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_inbox table for storing messages
CREATE TABLE IF NOT EXISTS public.user_inbox (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    sender_id UUID REFERENCES public.government_senders(id) ON DELETE SET NULL,
    category_id UUID REFERENCES public.message_categories(id) ON DELETE SET NULL,
    
    -- Message details
    subject VARCHAR(200) NOT NULL,
    message_body TEXT NOT NULL,
    message_type VARCHAR(50) DEFAULT 'notification', -- notification, invoice, fine, certificate, etc.
    priority VARCHAR(20) DEFAULT 'normal', -- low, normal, high, urgent
    
    -- Status tracking
    is_read BOOLEAN DEFAULT false,
    is_archived BOOLEAN DEFAULT false,
    is_starred BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    
    -- Attachments and metadata
    attachments JSONB, -- Array of attachment objects {filename, url, size, type}
    metadata JSONB, -- Additional data like fine amount, due date, reference numbers
    
    -- Reference tracking
    reference_number VARCHAR(100), -- Official reference number from sender
    related_address_id UUID REFERENCES public.kivro_addresses(id) ON DELETE SET NULL,
    
    -- Timestamps
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE, -- For time-sensitive messages
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create message_actions table for tracking user actions (payment, appeal, etc.)
CREATE TABLE IF NOT EXISTS public.message_actions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    message_id UUID REFERENCES public.user_inbox(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    action_type VARCHAR(50) NOT NULL, -- 'paid', 'appealed', 'acknowledged', 'downloaded'
    action_data JSONB, -- Additional action details
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_inbox_user_id ON public.user_inbox(user_id);
CREATE INDEX IF NOT EXISTS idx_user_inbox_sender_id ON public.user_inbox(sender_id);
CREATE INDEX IF NOT EXISTS idx_user_inbox_category_id ON public.user_inbox(category_id);
CREATE INDEX IF NOT EXISTS idx_user_inbox_is_read ON public.user_inbox(is_read);
CREATE INDEX IF NOT EXISTS idx_user_inbox_is_archived ON public.user_inbox(is_archived);
CREATE INDEX IF NOT EXISTS idx_user_inbox_sent_at ON public.user_inbox(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_inbox_reference ON public.user_inbox(reference_number);
CREATE INDEX IF NOT EXISTS idx_message_actions_message_id ON public.message_actions(message_id);
CREATE INDEX IF NOT EXISTS idx_message_actions_user_id ON public.message_actions(user_id);
CREATE INDEX IF NOT EXISTS idx_government_senders_code ON public.government_senders(organization_code);

-- Enable Row Level Security (RLS)
ALTER TABLE public.message_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.government_senders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_inbox ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_actions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for message_categories (everyone can read)
CREATE POLICY "Anyone can read message categories" ON public.message_categories
    FOR SELECT USING (true);

CREATE POLICY "Service role can manage message categories" ON public.message_categories
    FOR ALL USING (auth.role() = 'service_role');

-- RLS Policies for government_senders (everyone can read active verified senders)
CREATE POLICY "Anyone can read verified senders" ON public.government_senders
    FOR SELECT USING (is_active = true AND is_verified = true);

CREATE POLICY "Service role can manage government senders" ON public.government_senders
    FOR ALL USING (auth.role() = 'service_role');

-- RLS Policies for user_inbox (users can only see their own messages)
CREATE POLICY "Users can view own inbox messages" ON public.user_inbox
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own inbox messages" ON public.user_inbox
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all inbox messages" ON public.user_inbox
    FOR ALL USING (auth.role() = 'service_role');

-- RLS Policies for message_actions
CREATE POLICY "Users can view own message actions" ON public.message_actions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own message actions" ON public.message_actions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can manage all message actions" ON public.message_actions
    FOR ALL USING (auth.role() = 'service_role');

-- Create triggers for updated_at timestamps
DROP TRIGGER IF EXISTS handle_government_senders_updated_at ON public.government_senders;
CREATE TRIGGER handle_government_senders_updated_at
    BEFORE UPDATE ON public.government_senders
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_user_inbox_updated_at ON public.user_inbox;
CREATE TRIGGER handle_user_inbox_updated_at
    BEFORE UPDATE ON public.user_inbox
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Insert default message categories
INSERT INTO public.message_categories (name, description, icon, color) VALUES
('Traffic Violations', 'Speeding tickets, parking fines, and other traffic-related notices', 'Car', 'red'),
('Tax & Revenue', 'Tax notices, bills, and revenue-related communications', 'DollarSign', 'blue'),
('Health Services', 'Medical records, vaccination certificates, health appointments', 'Heart', 'green'),
('Legal Notices', 'Court summons, legal documents, official notices', 'Scale', 'purple'),
('Government Services', 'General government communications and service updates', 'Building', 'gray'),
('Utilities', 'Water, electricity, and other utility bills and notices', 'Zap', 'yellow'),
('Education', 'School records, certificates, educational documents', 'GraduationCap', 'indigo'),
('Social Services', 'Benefits, welfare, and social service communications', 'Users', 'pink'),
('Immigration', 'Visa, passport, and immigration-related documents', 'Plane', 'teal'),
('Property & Land', 'Property documents, land registry, building permits', 'Home', 'orange')
ON CONFLICT (name) DO NOTHING;

-- Insert sample government senders
INSERT INTO public.government_senders (organization_name, organization_code, contact_email, contact_phone, is_verified, is_active, logo_url) VALUES
('Somalia Police Force', 'POLICE', 'info@police.gov.so', '+252-1-234567', true, true, null),
('Somalia Revenue Authority', 'TAX_AUTHORITY', 'info@sra.gov.so', '+252-1-234568', true, true, null),
('Ministry of Health', 'HEALTH_MINISTRY', 'info@health.gov.so', '+252-1-234569', true, true, null),
('Mogadishu Municipality', 'MOGADISHU_CITY', 'info@mogadishu.gov.so', '+252-1-234570', true, true, null),
('Somalia Immigration Department', 'IMMIGRATION', 'info@immigration.gov.so', '+252-1-234571', true, true, null),
('Ministry of Education', 'EDUCATION_MINISTRY', 'info@education.gov.so', '+252-1-234572', true, true, null),
('National Electricity Company', 'ELECTRICITY', 'info@nec.gov.so', '+252-1-234573', true, true, null),
('Water & Sewerage Authority', 'WATER_AUTHORITY', 'info@water.gov.so', '+252-1-234574', true, true, null)
ON CONFLICT (organization_code) DO NOTHING;

-- Sample message insertion has been commented out to avoid migration errors
-- To insert a sample message for a specific user, run this SQL after migration:
/*
INSERT INTO public.user_inbox (
    user_id, 
    sender_id, 
    category_id,
    subject,
    message_body,
    message_type,
    priority,
    reference_number,
    metadata
)
VALUES (
    'YOUR_USER_ID_HERE', -- Replace with actual user UUID
    (SELECT id FROM public.government_senders WHERE organization_code = 'POLICE' LIMIT 1),
    (SELECT id FROM public.message_categories WHERE name = 'Traffic Violations' LIMIT 1),
    'Traffic Violation Notice - Speeding',
    'Dear Citizen,

This is an official notice regarding a traffic violation detected on your vehicle.

Violation Details:
- Date: January 10, 2025
- Time: 14:35
- Location: Maka Al Mukarama Road, Mogadishu
- Violation: Exceeding speed limit (85 km/h in 50 km/h zone)
- Vehicle: Registered to your KIVRO address

Fine Amount: $50 USD
Payment Due: February 10, 2025

You have the right to appeal this fine within 14 days. To pay or appeal, please use the action buttons below.

Somalia Police Force
Traffic Department',
    'fine',
    'high',
    'SPF-2025-001234',
    jsonb_build_object(
        'fine_amount', 50,
        'currency', 'USD',
        'due_date', '2025-02-10',
        'violation_type', 'speeding',
        'speed_recorded', 85,
        'speed_limit', 50,
        'location', 'Maka Al Mukarama Road, Mogadishu',
        'can_appeal', true,
        'appeal_deadline', '2025-01-24'
    )
);
*/

-- Create a function to get unread message count
CREATE OR REPLACE FUNCTION public.get_unread_message_count(p_user_id UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)::INTEGER
        FROM public.user_inbox
        WHERE user_id = p_user_id 
        AND is_read = false 
        AND is_archived = false
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to mark message as read
CREATE OR REPLACE FUNCTION public.mark_message_as_read(p_message_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE public.user_inbox
    SET is_read = true, read_at = NOW()
    WHERE id = p_message_id AND user_id = p_user_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE public.user_inbox IS 'Digital inbox for receiving official government communications, similar to Swedish Mina Meddelanden system';
COMMENT ON TABLE public.government_senders IS 'Authorized government agencies and organizations that can send official messages';
COMMENT ON TABLE public.message_categories IS 'Categories for organizing different types of official communications';
COMMENT ON TABLE public.message_actions IS 'Tracks user actions on messages (payments, appeals, acknowledgments)';
