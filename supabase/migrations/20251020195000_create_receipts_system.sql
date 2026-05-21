-- ============================================================================
-- KIVRO RECEIPTS SYSTEM - MIGRATION
-- ============================================================================
-- This script creates a complete digital receipts management system
-- ============================================================================

-- Drop existing tables if they exist
DROP TABLE IF EXISTS public.receipt_items CASCADE;
DROP TABLE IF EXISTS public.receipts CASCADE;
DROP TABLE IF EXISTS public.receipt_categories CASCADE;

-- ============================================================================
-- TABLE: receipt_categories
-- ============================================================================
CREATE TABLE public.receipt_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    icon VARCHAR(10) DEFAULT '📄',
    color VARCHAR(50) DEFAULT 'bg-gray-100',
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default categories
INSERT INTO public.receipt_categories (name, icon, color, description) VALUES
    ('Grocery', '🛒', 'bg-green-100', 'Supermarkets and grocery stores'),
    ('Restaurant', '🍽️', 'bg-orange-100', 'Restaurants and food services'),
    ('Pharmacy', '💊', 'bg-red-100', 'Pharmacies and medical supplies'),
    ('Electronics', '💻', 'bg-blue-100', 'Electronics and technology'),
    ('Clothing', '👕', 'bg-purple-100', 'Clothing and fashion'),
    ('Gas Station', '⛽', 'bg-yellow-100', 'Fuel and gas stations'),
    ('Healthcare', '⚕️', 'bg-pink-100', 'Medical and healthcare services'),
    ('Entertainment', '🎬', 'bg-indigo-100', 'Movies, games, and entertainment'),
    ('Travel', '✈️', 'bg-cyan-100', 'Travel and transportation'),
    ('Home & Garden', '🏠', 'bg-lime-100', 'Home improvement and garden'),
    ('Beauty', '💄', 'bg-rose-100', 'Beauty and personal care'),
    ('Sports', '⚽', 'bg-teal-100', 'Sports and fitness'),
    ('Books', '📚', 'bg-amber-100', 'Books and stationery'),
    ('Other', '📄', 'bg-gray-100', 'Other purchases');

-- ============================================================================
-- TABLE: receipts
-- ============================================================================
CREATE TABLE public.receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    receipt_number VARCHAR(50) UNIQUE NOT NULL,
    
    -- Store/Merchant Information
    store_name VARCHAR(255) NOT NULL,
    store_address TEXT,
    store_phone VARCHAR(50),
    store_tax_id VARCHAR(50),
    store_logo_url VARCHAR(500),
    
    -- Category
    category_id UUID REFERENCES public.receipt_categories(id),
    category_name VARCHAR(100),
    
    -- Transaction Details
    transaction_date TIMESTAMP WITH TIME ZONE NOT NULL,
    transaction_time TIME,
    
    -- Amounts
    subtotal DECIMAL(12, 2) NOT NULL DEFAULT 0,
    tax_amount DECIMAL(12, 2) DEFAULT 0,
    discount_amount DECIMAL(12, 2) DEFAULT 0,
    tip_amount DECIMAL(12, 2) DEFAULT 0,
    total_amount DECIMAL(12, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    
    -- Payment Information
    payment_method VARCHAR(50), -- cash, card, mobile_money
    card_last_four VARCHAR(4),
    
    -- Receipt Source
    source_type VARCHAR(50) DEFAULT 'manual', -- manual, email, scan, api
    source_data JSONB,
    
    -- Files
    image_url VARCHAR(500),
    pdf_url VARCHAR(500),
    
    -- Status and Tags
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'archived', 'deleted')),
    is_favorite BOOLEAN DEFAULT FALSE,
    tags TEXT[],
    
    -- Notes
    notes TEXT,
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- TABLE: receipt_items
-- ============================================================================
CREATE TABLE public.receipt_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    receipt_id UUID NOT NULL REFERENCES public.receipts(id) ON DELETE CASCADE,
    
    item_name VARCHAR(255) NOT NULL,
    item_description TEXT,
    quantity DECIMAL(10, 2) DEFAULT 1,
    unit_price DECIMAL(12, 2) NOT NULL,
    total_price DECIMAL(12, 2) NOT NULL,
    
    -- Item details
    sku VARCHAR(100),
    barcode VARCHAR(100),
    category VARCHAR(100),
    
    -- Tax
    tax_rate DECIMAL(5, 2),
    tax_amount DECIMAL(12, 2),
    
    metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================
CREATE INDEX idx_receipts_user_id ON public.receipts(user_id);
CREATE INDEX idx_receipts_transaction_date ON public.receipts(transaction_date DESC);
CREATE INDEX idx_receipts_store_name ON public.receipts(store_name);
CREATE INDEX idx_receipts_category_id ON public.receipts(category_id);
CREATE INDEX idx_receipts_status ON public.receipts(status);
CREATE INDEX idx_receipts_is_favorite ON public.receipts(is_favorite) WHERE is_favorite = TRUE;
CREATE INDEX idx_receipt_items_receipt_id ON public.receipt_items(receipt_id);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================
ALTER TABLE public.receipt_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receipt_items ENABLE ROW LEVEL SECURITY;

-- Policies for receipt_categories (public read)
CREATE POLICY "Anyone can view receipt categories" ON public.receipt_categories FOR SELECT USING (true);

-- Policies for receipts
CREATE POLICY "Users can view own receipts" ON public.receipts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own receipts" ON public.receipts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own receipts" ON public.receipts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own receipts" ON public.receipts FOR DELETE USING (auth.uid() = user_id);

-- Policies for receipt_items
CREATE POLICY "Users can view own receipt items" ON public.receipt_items FOR SELECT 
    USING (EXISTS (SELECT 1 FROM public.receipts WHERE receipts.id = receipt_items.receipt_id AND receipts.user_id = auth.uid()));
CREATE POLICY "Users can create own receipt items" ON public.receipt_items FOR INSERT 
    WITH CHECK (EXISTS (SELECT 1 FROM public.receipts WHERE receipts.id = receipt_items.receipt_id AND receipts.user_id = auth.uid()));
CREATE POLICY "Users can update own receipt items" ON public.receipt_items FOR UPDATE 
    USING (EXISTS (SELECT 1 FROM public.receipts WHERE receipts.id = receipt_items.receipt_id AND receipts.user_id = auth.uid()));
CREATE POLICY "Users can delete own receipt items" ON public.receipt_items FOR DELETE 
    USING (EXISTS (SELECT 1 FROM public.receipts WHERE receipts.id = receipt_items.receipt_id AND receipts.user_id = auth.uid()));

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Generate receipt number
CREATE OR REPLACE FUNCTION generate_receipt_number()
RETURNS VARCHAR AS $$
DECLARE
    new_number VARCHAR;
    counter INTEGER;
BEGIN
    SELECT COUNT(*) INTO counter FROM public.receipts WHERE DATE(created_at) = CURRENT_DATE;
    new_number := 'REC-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD((counter + 1)::TEXT, 4, '0');
    RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Get receipt statistics
CREATE OR REPLACE FUNCTION get_receipt_statistics(p_user_id UUID DEFAULT NULL)
RETURNS TABLE (
    total_receipts BIGINT,
    total_spent NUMERIC,
    this_month_count BIGINT,
    this_month_spent NUMERIC,
    favorite_count BIGINT,
    top_category VARCHAR,
    top_store VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::BIGINT,
        COALESCE(SUM(total_amount), 0),
        COUNT(*) FILTER (WHERE DATE_TRUNC('month', transaction_date) = DATE_TRUNC('month', CURRENT_DATE))::BIGINT,
        COALESCE(SUM(total_amount) FILTER (WHERE DATE_TRUNC('month', transaction_date) = DATE_TRUNC('month', CURRENT_DATE)), 0),
        COUNT(*) FILTER (WHERE is_favorite = TRUE)::BIGINT,
        (SELECT category_name FROM public.receipts WHERE user_id = p_user_id GROUP BY category_name ORDER BY COUNT(*) DESC LIMIT 1),
        (SELECT store_name FROM public.receipts WHERE user_id = p_user_id GROUP BY store_name ORDER BY COUNT(*) DESC LIMIT 1)
    FROM public.receipts
    WHERE (p_user_id IS NULL OR user_id = p_user_id)
    AND status = 'active'
    AND (p_user_id IS NULL OR user_id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get spending by category
CREATE OR REPLACE FUNCTION get_spending_by_category(p_user_id UUID, p_start_date DATE DEFAULT NULL, p_end_date DATE DEFAULT NULL)
RETURNS TABLE (
    category_name VARCHAR,
    category_icon VARCHAR,
    total_spent NUMERIC,
    receipt_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(r.category_name, 'Other')::VARCHAR,
        COALESCE(c.icon, '📄')::VARCHAR,
        SUM(r.total_amount),
        COUNT(*)::BIGINT
    FROM public.receipts r
    LEFT JOIN public.receipt_categories c ON r.category_id = c.id
    WHERE r.user_id = p_user_id
    AND r.status = 'active'
    AND (p_start_date IS NULL OR r.transaction_date >= p_start_date)
    AND (p_end_date IS NULL OR r.transaction_date <= p_end_date)
    GROUP BY r.category_name, c.icon
    ORDER BY SUM(r.total_amount) DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get top stores
CREATE OR REPLACE FUNCTION get_top_stores(p_user_id UUID, p_limit INTEGER DEFAULT 10)
RETURNS TABLE (
    store_name VARCHAR,
    total_spent NUMERIC,
    receipt_count BIGINT,
    last_visit TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        r.store_name::VARCHAR,
        SUM(r.total_amount),
        COUNT(*)::BIGINT,
        MAX(r.transaction_date)
    FROM public.receipts r
    WHERE r.user_id = p_user_id
    AND r.status = 'active'
    GROUP BY r.store_name
    ORDER BY COUNT(*) DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

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
    BEFORE INSERT ON public.receipts
    FOR EACH ROW EXECUTE FUNCTION set_receipt_number();

-- Update timestamp on receipts
CREATE OR REPLACE FUNCTION update_receipt_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_receipt_timestamp
    BEFORE UPDATE ON public.receipts
    FOR EACH ROW EXECUTE FUNCTION update_receipt_timestamp();

-- ============================================================================
-- PERMISSIONS
-- ============================================================================
GRANT SELECT ON public.receipt_categories TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.receipts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.receipt_items TO authenticated;

-- ============================================================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================================================
-- Uncomment to insert sample receipts for testing
/*
INSERT INTO public.receipts (user_id, store_name, category_name, transaction_date, total_amount, payment_method)
VALUES 
    (auth.uid(), 'Walmart', 'Grocery', NOW() - INTERVAL '2 days', 125.50, 'card'),
    (auth.uid(), 'Starbucks', 'Restaurant', NOW() - INTERVAL '1 day', 8.75, 'card'),
    (auth.uid(), 'CVS Pharmacy', 'Pharmacy', NOW(), 45.20, 'cash');
*/

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Tables created: 3
-- Categories inserted: 14
-- Indexes created: 7
-- Functions created: 4
-- Triggers created: 2
-- RLS Policies: 10
-- ============================================================================
