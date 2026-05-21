-- ============================================================================
-- KIVRO PAYMENTS SYSTEM - FINAL MIGRATION
-- ============================================================================
-- This script creates a complete payment management system
-- Run this in Supabase SQL Editor or via CLI
-- ============================================================================

-- Drop existing tables if they exist (clean slate)
DROP TABLE IF EXISTS public.payment_refunds CASCADE;
DROP TABLE IF EXISTS public.payment_receipts CASCADE;
DROP TABLE IF EXISTS public.payment_methods CASCADE;
DROP TABLE IF EXISTS public.payment_transactions CASCADE;
DROP TABLE IF EXISTS public.payment_requests CASCADE;

-- ============================================================================
-- TABLE: payment_requests
-- ============================================================================
CREATE TABLE public.payment_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    request_number VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
    currency VARCHAR(3) DEFAULT 'USD' CHECK (currency IN ('USD', 'EUR', 'GBP', 'SOS', 'KES', 'ETB')),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded', 'expired')),
    payment_method VARCHAR(50),
    transaction_id VARCHAR(100),
    payer_name VARCHAR(255),
    payer_email VARCHAR(255),
    payer_phone VARCHAR(50),
    due_date TIMESTAMP WITH TIME ZONE,
    paid_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    source_type VARCHAR(50),
    source_id UUID,
    reference_number VARCHAR(100),
    gateway VARCHAR(50),
    gateway_payment_id VARCHAR(255),
    gateway_response JSONB,
    metadata JSONB DEFAULT '{}',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- TABLE: payment_transactions
-- ============================================================================
CREATE TABLE public.payment_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_request_id UUID NOT NULL REFERENCES public.payment_requests(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    amount DECIMAL(12, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded')),
    payment_method VARCHAR(50) NOT NULL,
    gateway VARCHAR(50),
    gateway_transaction_id VARCHAR(255),
    payment_details JSONB,
    initiated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    failed_at TIMESTAMP WITH TIME ZONE,
    gateway_response JSONB,
    error_message TEXT,
    error_code VARCHAR(50),
    processing_fee DECIMAL(10, 2) DEFAULT 0,
    platform_fee DECIMAL(10, 2) DEFAULT 0,
    total_amount DECIMAL(12, 2),
    metadata JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- TABLE: payment_methods
-- ============================================================================
CREATE TABLE public.payment_methods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('card', 'mobile_money', 'bank_account')),
    provider VARCHAR(50),
    token VARCHAR(255),
    last_four VARCHAR(4),
    card_brand VARCHAR(50),
    card_exp_month INTEGER,
    card_exp_year INTEGER,
    phone_number VARCHAR(50),
    account_number_last_four VARCHAR(4),
    bank_name VARCHAR(100),
    is_default BOOLEAN DEFAULT FALSE,
    is_verified BOOLEAN DEFAULT FALSE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- TABLE: payment_receipts
-- ============================================================================
CREATE TABLE public.payment_receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_request_id UUID NOT NULL REFERENCES public.payment_requests(id) ON DELETE CASCADE,
    transaction_id UUID REFERENCES public.payment_transactions(id) ON DELETE SET NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    receipt_number VARCHAR(50) UNIQUE NOT NULL,
    amount_paid DECIMAL(12, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    issued_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    pdf_url VARCHAR(500),
    payer_name VARCHAR(255),
    payer_email VARCHAR(255),
    merchant_name VARCHAR(255) DEFAULT 'KIVRO',
    merchant_address TEXT,
    merchant_tax_id VARCHAR(50),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- TABLE: payment_refunds
-- ============================================================================
CREATE TABLE public.payment_refunds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_request_id UUID NOT NULL REFERENCES public.payment_requests(id) ON DELETE CASCADE,
    transaction_id UUID NOT NULL REFERENCES public.payment_transactions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    refund_number VARCHAR(50) UNIQUE NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL,
    reason VARCHAR(255),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
    gateway_refund_id VARCHAR(255),
    gateway_response JSONB,
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================
CREATE INDEX idx_payment_requests_user_id ON public.payment_requests(user_id);
CREATE INDEX idx_payment_requests_status ON public.payment_requests(status);
CREATE INDEX idx_payment_requests_created_at ON public.payment_requests(created_at DESC);
CREATE INDEX idx_payment_transactions_payment_request_id ON public.payment_transactions(payment_request_id);
CREATE INDEX idx_payment_transactions_user_id ON public.payment_transactions(user_id);
CREATE INDEX idx_payment_methods_user_id ON public.payment_methods(user_id);
CREATE INDEX idx_payment_receipts_user_id ON public.payment_receipts(user_id);
CREATE INDEX idx_payment_refunds_user_id ON public.payment_refunds(user_id);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================
ALTER TABLE public.payment_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_refunds ENABLE ROW LEVEL SECURITY;

-- Policies for payment_requests
CREATE POLICY "Users can view own payment requests" ON public.payment_requests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own payment requests" ON public.payment_requests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own payment requests" ON public.payment_requests FOR UPDATE USING (auth.uid() = user_id);

-- Policies for payment_transactions
CREATE POLICY "Users can view own transactions" ON public.payment_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own transactions" ON public.payment_transactions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policies for payment_methods
CREATE POLICY "Users can manage own payment methods" ON public.payment_methods FOR ALL USING (auth.uid() = user_id);

-- Policies for payment_receipts
CREATE POLICY "Users can view own receipts" ON public.payment_receipts FOR SELECT USING (auth.uid() = user_id);

-- Policies for payment_refunds
CREATE POLICY "Users can view own refunds" ON public.payment_refunds FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can request refunds" ON public.payment_refunds FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Generate payment request number
CREATE OR REPLACE FUNCTION generate_payment_request_number()
RETURNS VARCHAR AS $$
DECLARE
    new_number VARCHAR;
    counter INTEGER;
BEGIN
    SELECT COUNT(*) INTO counter FROM public.payment_requests WHERE DATE(created_at) = CURRENT_DATE;
    new_number := 'PAY-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD((counter + 1)::TEXT, 4, '0');
    RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Generate receipt number
CREATE OR REPLACE FUNCTION generate_receipt_number()
RETURNS VARCHAR AS $$
DECLARE
    new_number VARCHAR;
    counter INTEGER;
BEGIN
    SELECT COUNT(*) INTO counter FROM public.payment_receipts WHERE DATE(created_at) = CURRENT_DATE;
    new_number := 'RCP-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD((counter + 1)::TEXT, 4, '0');
    RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Generate refund number
CREATE OR REPLACE FUNCTION generate_refund_number()
RETURNS VARCHAR AS $$
DECLARE
    new_number VARCHAR;
    counter INTEGER;
BEGIN
    SELECT COUNT(*) INTO counter FROM public.payment_refunds WHERE DATE(requested_at) = CURRENT_DATE;
    new_number := 'REF-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD((counter + 1)::TEXT, 4, '0');
    RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Get payment statistics
CREATE OR REPLACE FUNCTION get_payment_statistics(p_user_id UUID DEFAULT NULL)
RETURNS TABLE (
    total_payments BIGINT,
    total_amount NUMERIC,
    pending_count BIGINT,
    pending_amount NUMERIC,
    completed_count BIGINT,
    completed_amount NUMERIC,
    failed_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::BIGINT,
        COALESCE(SUM(amount), 0),
        COUNT(*) FILTER (WHERE status = 'pending')::BIGINT,
        COALESCE(SUM(amount) FILTER (WHERE status = 'pending'), 0),
        COUNT(*) FILTER (WHERE status = 'completed')::BIGINT,
        COALESCE(SUM(amount) FILTER (WHERE status = 'completed'), 0),
        COUNT(*) FILTER (WHERE status = 'failed')::BIGINT
    FROM public.payment_requests
    WHERE (p_user_id IS NULL OR user_id = p_user_id)
    AND (p_user_id IS NULL OR user_id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-generate payment request number
CREATE OR REPLACE FUNCTION set_payment_request_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.request_number IS NULL THEN
        NEW.request_number := generate_payment_request_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_set_payment_request_number
    BEFORE INSERT ON public.payment_requests
    FOR EACH ROW EXECUTE FUNCTION set_payment_request_number();

-- Auto-generate receipt number
CREATE OR REPLACE FUNCTION set_receipt_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.receipt_number IS NULL THEN
        NEW.receipt_number := generate_receipt_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_set_receipt_number
    BEFORE INSERT ON public.payment_receipts
    FOR EACH ROW EXECUTE FUNCTION set_receipt_number();

-- Auto-generate refund number
CREATE OR REPLACE FUNCTION set_refund_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.refund_number IS NULL THEN
        NEW.refund_number := generate_refund_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_set_refund_number
    BEFORE INSERT ON public.payment_refunds
    FOR EACH ROW EXECUTE FUNCTION set_refund_number();

-- Update timestamp on payment_requests
CREATE OR REPLACE FUNCTION update_payment_request_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_payment_request_timestamp
    BEFORE UPDATE ON public.payment_requests
    FOR EACH ROW EXECUTE FUNCTION update_payment_request_timestamp();

-- ============================================================================
-- PERMISSIONS
-- ============================================================================
GRANT SELECT, INSERT, UPDATE ON public.payment_requests TO authenticated;
GRANT SELECT, INSERT ON public.payment_transactions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payment_methods TO authenticated;
GRANT SELECT ON public.payment_receipts TO authenticated;
GRANT SELECT, INSERT ON public.payment_refunds TO authenticated;

-- ============================================================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================================================
-- Uncomment to insert sample payment requests for testing
/*
INSERT INTO public.payment_requests (user_id, title, description, amount, currency, status, source_type)
VALUES 
    (auth.uid(), 'Monthly Subscription', 'KIVRO Premium Subscription - January 2025', 29.99, 'USD', 'pending', 'subscription'),
    (auth.uid(), 'Service Fee', 'Address verification service', 5.00, 'USD', 'completed', 'service_fee'),
    (auth.uid(), 'Traffic Fine', 'Parking violation - Downtown', 50.00, 'USD', 'pending', 'fine');
*/

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Tables created: 5
-- Indexes created: 8
-- Functions created: 4
-- Triggers created: 4
-- RLS Policies: 9
-- ============================================================================
