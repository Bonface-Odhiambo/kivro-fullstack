-- Create payment_requests table
CREATE TABLE IF NOT EXISTS public.payment_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    request_number VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    amount DECIMAL(12, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    payment_method VARCHAR(50),
    transaction_id VARCHAR(100),
    
    -- Payer information
    payer_name VARCHAR(255),
    payer_email VARCHAR(255),
    payer_phone VARCHAR(50),
    
    -- Request details
    due_date TIMESTAMP WITH TIME ZONE,
    paid_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    
    -- Source information
    source_type VARCHAR(50), -- invoice, fine, subscription, service_fee, custom
    source_id UUID,
    reference_number VARCHAR(100),
    
    -- Payment gateway info
    gateway VARCHAR(50), -- stripe, paypal, mpesa, waafi, edahab
    gateway_payment_id VARCHAR(255),
    gateway_response JSONB,
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_status CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded', 'expired')),
    CONSTRAINT valid_currency CHECK (currency IN ('USD', 'EUR', 'GBP', 'SOS', 'KES', 'ETB')),
    CONSTRAINT positive_amount CHECK (amount > 0)
);

-- Create payment_transactions table for tracking all payment attempts
CREATE TABLE IF NOT EXISTS public.payment_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_request_id UUID NOT NULL REFERENCES public.payment_requests(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    amount DECIMAL(12, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    
    -- Payment details
    payment_method VARCHAR(50) NOT NULL, -- card, mobile_money, bank_transfer, cash
    gateway VARCHAR(50), -- stripe, paypal, mpesa, waafi, edahab
    gateway_transaction_id VARCHAR(255),
    
    -- Card/Account details (encrypted/tokenized)
    payment_details JSONB,
    
    -- Transaction info
    initiated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    failed_at TIMESTAMP WITH TIME ZONE,
    
    -- Response from gateway
    gateway_response JSONB,
    error_message TEXT,
    error_code VARCHAR(50),
    
    -- Fees
    processing_fee DECIMAL(10, 2) DEFAULT 0,
    platform_fee DECIMAL(10, 2) DEFAULT 0,
    total_amount DECIMAL(12, 2),
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_transaction_status CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded'))
);

-- Create payment_methods table for saved payment methods
CREATE TABLE IF NOT EXISTS public.payment_methods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    type VARCHAR(50) NOT NULL, -- card, mobile_money, bank_account
    provider VARCHAR(50), -- visa, mastercard, mpesa, waafi, etc.
    
    -- Tokenized/encrypted details
    token VARCHAR(255),
    last_four VARCHAR(4),
    
    -- Card specific
    card_brand VARCHAR(50),
    card_exp_month INTEGER,
    card_exp_year INTEGER,
    
    -- Mobile money specific
    phone_number VARCHAR(50),
    
    -- Bank account specific
    account_number_last_four VARCHAR(4),
    bank_name VARCHAR(100),
    
    is_default BOOLEAN DEFAULT FALSE,
    is_verified BOOLEAN DEFAULT FALSE,
    
    metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_payment_method_type CHECK (type IN ('card', 'mobile_money', 'bank_account'))
);

-- Create payment_receipts table
CREATE TABLE IF NOT EXISTS public.payment_receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_request_id UUID NOT NULL REFERENCES public.payment_requests(id) ON DELETE CASCADE,
    transaction_id UUID REFERENCES public.payment_transactions(id) ON DELETE SET NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    receipt_number VARCHAR(50) UNIQUE NOT NULL,
    
    amount_paid DECIMAL(12, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    
    -- Receipt details
    issued_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    pdf_url VARCHAR(500),
    
    -- Payer info
    payer_name VARCHAR(255),
    payer_email VARCHAR(255),
    
    -- Merchant info
    merchant_name VARCHAR(255) DEFAULT 'KIVRO',
    merchant_address TEXT,
    merchant_tax_id VARCHAR(50),
    
    metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create payment_refunds table
CREATE TABLE IF NOT EXISTS public.payment_refunds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_request_id UUID NOT NULL REFERENCES public.payment_requests(id) ON DELETE CASCADE,
    transaction_id UUID NOT NULL REFERENCES public.payment_transactions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    refund_number VARCHAR(50) UNIQUE NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL,
    
    reason VARCHAR(255),
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    
    gateway_refund_id VARCHAR(255),
    gateway_response JSONB,
    
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE,
    
    metadata JSONB DEFAULT '{}',
    
    CONSTRAINT valid_refund_status CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled'))
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_payment_requests_user_id ON public.payment_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_requests_status ON public.payment_requests(status);
CREATE INDEX IF NOT EXISTS idx_payment_requests_due_date ON public.payment_requests(due_date);
CREATE INDEX IF NOT EXISTS idx_payment_requests_request_number ON public.payment_requests(request_number);
CREATE INDEX IF NOT EXISTS idx_payment_requests_created_at ON public.payment_requests(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_payment_transactions_payment_request_id ON public.payment_transactions(payment_request_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_user_id ON public.payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON public.payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_gateway_transaction_id ON public.payment_transactions(gateway_transaction_id);

CREATE INDEX IF NOT EXISTS idx_payment_methods_user_id ON public.payment_methods(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_is_default ON public.payment_methods(is_default) WHERE is_default = TRUE;

CREATE INDEX IF NOT EXISTS idx_payment_receipts_user_id ON public.payment_receipts(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_receipts_receipt_number ON public.payment_receipts(receipt_number);

CREATE INDEX IF NOT EXISTS idx_payment_refunds_payment_request_id ON public.payment_refunds(payment_request_id);
CREATE INDEX IF NOT EXISTS idx_payment_refunds_user_id ON public.payment_refunds(user_id);

-- Enable Row Level Security
ALTER TABLE public.payment_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_refunds ENABLE ROW LEVEL SECURITY;

-- RLS Policies for payment_requests
DROP POLICY IF EXISTS "Users can view their own payment requests" ON public.payment_requests;
CREATE POLICY "Users can view their own payment requests"
    ON public.payment_requests FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own payment requests" ON public.payment_requests;
CREATE POLICY "Users can create their own payment requests"
    ON public.payment_requests FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own payment requests" ON public.payment_requests;
CREATE POLICY "Users can update their own payment requests"
    ON public.payment_requests FOR UPDATE
    USING (auth.uid() = user_id);

-- RLS Policies for payment_transactions
DROP POLICY IF EXISTS "Users can view their own transactions" ON public.payment_transactions;
CREATE POLICY "Users can view their own transactions"
    ON public.payment_transactions FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own transactions" ON public.payment_transactions;
CREATE POLICY "Users can create their own transactions"
    ON public.payment_transactions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- RLS Policies for payment_methods
DROP POLICY IF EXISTS "Users can view their own payment methods" ON public.payment_methods;
CREATE POLICY "Users can view their own payment methods"
    ON public.payment_methods FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own payment methods" ON public.payment_methods;
CREATE POLICY "Users can manage their own payment methods"
    ON public.payment_methods FOR ALL
    USING (auth.uid() = user_id);

-- RLS Policies for payment_receipts
DROP POLICY IF EXISTS "Users can view their own receipts" ON public.payment_receipts;
CREATE POLICY "Users can view their own receipts"
    ON public.payment_receipts FOR SELECT
    USING (auth.uid() = user_id);

-- RLS Policies for payment_refunds
DROP POLICY IF EXISTS "Users can view their own refunds" ON public.payment_refunds;
CREATE POLICY "Users can view their own refunds"
    ON public.payment_refunds FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can request refunds" ON public.payment_refunds;
CREATE POLICY "Users can request refunds"
    ON public.payment_refunds FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Function to generate payment request number
CREATE OR REPLACE FUNCTION generate_payment_request_number()
RETURNS VARCHAR AS $$
DECLARE
    new_number VARCHAR;
    counter INTEGER;
BEGIN
    -- Get the count of payment requests today
    SELECT COUNT(*) INTO counter
    FROM public.payment_requests
    WHERE DATE(created_at) = CURRENT_DATE;
    
    -- Generate number: PAY-YYYYMMDD-XXXX
    new_number := 'PAY-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD((counter + 1)::TEXT, 4, '0');
    
    RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Function to generate receipt number
CREATE OR REPLACE FUNCTION generate_receipt_number()
RETURNS VARCHAR AS $$
DECLARE
    new_number VARCHAR;
    counter INTEGER;
BEGIN
    SELECT COUNT(*) INTO counter
    FROM public.payment_receipts
    WHERE DATE(created_at) = CURRENT_DATE;
    
    new_number := 'RCP-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD((counter + 1)::TEXT, 4, '0');
    
    RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Function to generate refund number
CREATE OR REPLACE FUNCTION generate_refund_number()
RETURNS VARCHAR AS $$
DECLARE
    new_number VARCHAR;
    counter INTEGER;
BEGIN
    SELECT COUNT(*) INTO counter
    FROM public.payment_refunds
    WHERE DATE(requested_at) = CURRENT_DATE;
    
    new_number := 'REF-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD((counter + 1)::TEXT, 4, '0');
    
    RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate payment request number
CREATE OR REPLACE FUNCTION set_payment_request_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.request_number IS NULL THEN
        NEW.request_number := generate_payment_request_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_payment_request_number_trigger ON public.payment_requests;
CREATE TRIGGER set_payment_request_number_trigger
    BEFORE INSERT ON public.payment_requests
    FOR EACH ROW
    EXECUTE FUNCTION set_payment_request_number();

-- Trigger to auto-generate receipt number
CREATE OR REPLACE FUNCTION set_receipt_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.receipt_number IS NULL THEN
        NEW.receipt_number := generate_receipt_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_receipt_number_trigger ON public.payment_receipts;
CREATE TRIGGER set_receipt_number_trigger
    BEFORE INSERT ON public.payment_receipts
    FOR EACH ROW
    EXECUTE FUNCTION set_receipt_number();

-- Trigger to auto-generate refund number
CREATE OR REPLACE FUNCTION set_refund_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.refund_number IS NULL THEN
        NEW.refund_number := generate_refund_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_refund_number_trigger ON public.payment_refunds;
CREATE TRIGGER set_refund_number_trigger
    BEFORE INSERT ON public.payment_refunds
    FOR EACH ROW
    EXECUTE FUNCTION set_refund_number();

-- Trigger to update payment_requests.updated_at
CREATE OR REPLACE FUNCTION update_payment_request_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_payment_request_timestamp ON public.payment_requests;
CREATE TRIGGER update_payment_request_timestamp
    BEFORE UPDATE ON public.payment_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_payment_request_timestamp();

-- Function to mark payment as completed
CREATE OR REPLACE FUNCTION complete_payment(
    p_payment_request_id UUID,
    p_transaction_id UUID,
    p_gateway_transaction_id VARCHAR DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    -- Update payment request
    UPDATE public.payment_requests
    SET status = 'completed',
        paid_at = NOW(),
        transaction_id = p_gateway_transaction_id
    WHERE id = p_payment_request_id
    AND user_id = auth.uid();
    
    -- Update transaction
    UPDATE public.payment_transactions
    SET status = 'completed',
        completed_at = NOW()
    WHERE id = p_transaction_id
    AND user_id = auth.uid();
    
    -- Create receipt
    INSERT INTO public.payment_receipts (
        payment_request_id,
        transaction_id,
        user_id,
        amount_paid,
        currency,
        payment_method,
        payer_name,
        payer_email
    )
    SELECT 
        pr.id,
        p_transaction_id,
        pr.user_id,
        pr.amount,
        pr.currency,
        pt.payment_method,
        pr.payer_name,
        pr.payer_email
    FROM public.payment_requests pr
    JOIN public.payment_transactions pt ON pt.id = p_transaction_id
    WHERE pr.id = p_payment_request_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get payment statistics
CREATE OR REPLACE FUNCTION get_payment_statistics(p_user_id UUID DEFAULT NULL)
RETURNS TABLE (
    total_payments BIGINT,
    total_amount DECIMAL,
    pending_count BIGINT,
    pending_amount DECIMAL,
    completed_count BIGINT,
    completed_amount DECIMAL,
    failed_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::BIGINT as total_payments,
        COALESCE(SUM(amount), 0) as total_amount,
        COUNT(*) FILTER (WHERE status = 'pending')::BIGINT as pending_count,
        COALESCE(SUM(amount) FILTER (WHERE status = 'pending'), 0) as pending_amount,
        COUNT(*) FILTER (WHERE status = 'completed')::BIGINT as completed_count,
        COALESCE(SUM(amount) FILTER (WHERE status = 'completed'), 0) as completed_amount,
        COUNT(*) FILTER (WHERE status = 'failed')::BIGINT as failed_count
    FROM public.payment_requests
    WHERE (p_user_id IS NULL OR user_id = p_user_id)
    AND (p_user_id IS NULL OR user_id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON public.payment_requests TO authenticated;
GRANT SELECT, INSERT ON public.payment_transactions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payment_methods TO authenticated;
GRANT SELECT ON public.payment_receipts TO authenticated;
GRANT SELECT, INSERT ON public.payment_refunds TO authenticated;

-- Comments
COMMENT ON TABLE public.payment_requests IS 'Stores payment requests from users';
COMMENT ON TABLE public.payment_transactions IS 'Tracks all payment transaction attempts';
COMMENT ON TABLE public.payment_methods IS 'Stores saved payment methods for users';
COMMENT ON TABLE public.payment_receipts IS 'Stores payment receipts';
COMMENT ON TABLE public.payment_refunds IS 'Tracks payment refunds';
