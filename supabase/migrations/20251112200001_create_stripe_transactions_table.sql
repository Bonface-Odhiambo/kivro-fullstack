-- Create stripe_transactions table to store Stripe payment data
CREATE TABLE IF NOT EXISTS stripe_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    stripe_payment_intent_id VARCHAR(255) UNIQUE NOT NULL,
    stripe_charge_id VARCHAR(255),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    amount_cents BIGINT NOT NULL, -- Amount in cents (e.g., 1000 = $10.00)
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    status VARCHAR(50) NOT NULL, -- 'succeeded', 'pending', 'failed', 'canceled', 'refunded'
    description TEXT,
    metadata JSONB, -- Store additional Stripe metadata
    stripe_created_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_stripe_transactions_user_id ON stripe_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_stripe_transactions_status ON stripe_transactions(status);
CREATE INDEX IF NOT EXISTS idx_stripe_transactions_created_at ON stripe_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stripe_transactions_stripe_created_at ON stripe_transactions(stripe_created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stripe_transactions_amount ON stripe_transactions(amount_cents);

-- Enable RLS (Row Level Security)
ALTER TABLE stripe_transactions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist, then create new ones
DROP POLICY IF EXISTS "Admin can view all stripe transactions" ON stripe_transactions;
DROP POLICY IF EXISTS "Admin can insert stripe transactions" ON stripe_transactions;
DROP POLICY IF EXISTS "Users can view their own transactions" ON stripe_transactions;

-- Create policy for admin access only
CREATE POLICY "Admin can view all stripe transactions" ON stripe_transactions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.user_id = auth.uid() 
            AND profiles.user_type = 'admin'
        )
    );

CREATE POLICY "Admin can insert stripe transactions" ON stripe_transactions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.user_id = auth.uid() 
            AND profiles.user_type = 'admin'
        )
    );

CREATE POLICY "Users can view their own transactions" ON stripe_transactions
    FOR SELECT USING (user_id = auth.uid());

-- Note: No sample transaction data inserted
-- Real Stripe transactions will be added via webhook endpoints
-- This ensures revenue shows $0 until real payments are processed

-- Create function to get total revenue
CREATE OR REPLACE FUNCTION get_total_stripe_revenue()
RETURNS NUMERIC AS $$
BEGIN
    RETURN (
        SELECT COALESCE(SUM(amount_cents), 0)::NUMERIC / 100 -- Convert cents to dollars
        FROM stripe_transactions 
        WHERE status = 'succeeded'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get revenue for a specific period
CREATE OR REPLACE FUNCTION get_stripe_revenue_period(
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE
)
RETURNS NUMERIC AS $$
BEGIN
    RETURN (
        SELECT COALESCE(SUM(amount_cents), 0)::NUMERIC / 100 -- Convert cents to dollars
        FROM stripe_transactions 
        WHERE status = 'succeeded'
        AND stripe_created_at >= start_date
        AND stripe_created_at <= end_date
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to insert new Stripe transaction
CREATE OR REPLACE FUNCTION insert_stripe_transaction(
    p_stripe_payment_intent_id TEXT,
    p_stripe_charge_id TEXT,
    p_user_id UUID,
    p_amount_cents BIGINT,
    p_currency TEXT,
    p_status TEXT,
    p_description TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT NULL,
    p_stripe_created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
RETURNS UUID AS $$
DECLARE
    result_id UUID;
BEGIN
    INSERT INTO stripe_transactions (
        stripe_payment_intent_id,
        stripe_charge_id,
        user_id,
        amount_cents,
        currency,
        status,
        description,
        metadata,
        stripe_created_at
    ) VALUES (
        p_stripe_payment_intent_id,
        p_stripe_charge_id,
        p_user_id,
        p_amount_cents,
        p_currency,
        p_status,
        p_description,
        p_metadata,
        p_stripe_created_at
    )
    ON CONFLICT (stripe_payment_intent_id) 
    DO UPDATE SET
        stripe_charge_id = EXCLUDED.stripe_charge_id,
        status = EXCLUDED.status,
        updated_at = NOW()
    RETURNING id INTO result_id;
    
    RETURN result_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE stripe_transactions IS 'Stores Stripe payment transaction data for revenue tracking';
COMMENT ON FUNCTION get_total_stripe_revenue() IS 'Gets total revenue from all successful Stripe transactions';
COMMENT ON FUNCTION get_stripe_revenue_period(TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE) IS 'Gets revenue for a specific time period';
COMMENT ON FUNCTION insert_stripe_transaction(TEXT, TEXT, UUID, BIGINT, TEXT, TEXT, TEXT, JSONB, TIMESTAMP WITH TIME ZONE) IS 'Inserts or updates a Stripe transaction record';
