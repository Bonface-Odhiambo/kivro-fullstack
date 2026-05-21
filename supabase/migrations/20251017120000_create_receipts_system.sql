-- ============================================================================
-- RECEIPTS SYSTEM - Digital Receipt Management
-- ============================================================================

-- Create receipts table
CREATE TABLE IF NOT EXISTS public.receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    receipt_id VARCHAR(50) UNIQUE NOT NULL, -- RCP001234
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    
    -- Receipt details
    store_name VARCHAR(255) NOT NULL,
    store_logo_url TEXT,
    store_category VARCHAR(100), -- grocery, pharmacy, electronics, etc.
    
    -- Transaction details
    transaction_id VARCHAR(100),
    transaction_date TIMESTAMP WITH TIME ZONE NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    tax_amount DECIMAL(10, 2),
    discount_amount DECIMAL(10, 2),
    
    -- Payment details
    payment_method VARCHAR(50), -- credit_card, debit_card, cash, mobile_payment
    card_last_four VARCHAR(4),
    
    -- Receipt items (stored as JSONB)
    items JSONB, -- [{name, quantity, price, category}]
    
    -- Digital receipt data
    receipt_image_url TEXT,
    receipt_pdf_url TEXT,
    ocr_data JSONB, -- Extracted text from OCR
    
    -- Metadata
    tags TEXT[], -- For categorization
    notes TEXT,
    is_favorite BOOLEAN DEFAULT false,
    is_archived BOOLEAN DEFAULT false,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create receipt categories table
CREATE TABLE IF NOT EXISTS public.receipt_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    icon VARCHAR(50),
    color VARCHAR(50),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create receipt senders table (stores/merchants)
CREATE TABLE IF NOT EXISTS public.receipt_senders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_name VARCHAR(255) UNIQUE NOT NULL,
    sender_logo_url TEXT,
    category VARCHAR(100),
    website_url TEXT,
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_receipts_user_id ON public.receipts(user_id);
CREATE INDEX idx_receipts_transaction_date ON public.receipts(transaction_date DESC);
CREATE INDEX idx_receipts_store_name ON public.receipts(store_name);
CREATE INDEX idx_receipts_tags ON public.receipts USING GIN(tags);
CREATE INDEX idx_receipts_items ON public.receipts USING GIN(items);

-- Create auto-increment sequence for receipt IDs
CREATE SEQUENCE IF NOT EXISTS receipt_id_seq START 1;

-- Create function to generate receipt ID
CREATE OR REPLACE FUNCTION generate_receipt_id()
RETURNS TRIGGER AS $$
BEGIN
    NEW.receipt_id := 'RCP' || LPAD(nextval('receipt_id_seq')::TEXT, 6, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-generating receipt ID
DROP TRIGGER IF EXISTS set_receipt_id ON public.receipts;
CREATE TRIGGER set_receipt_id
    BEFORE INSERT ON public.receipts
    FOR EACH ROW
    WHEN (NEW.receipt_id IS NULL OR NEW.receipt_id = '')
    EXECUTE FUNCTION generate_receipt_id();

-- Create updated_at trigger
CREATE TRIGGER update_receipts_updated_at
    BEFORE UPDATE ON public.receipts
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Enable RLS
ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receipt_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receipt_senders ENABLE ROW LEVEL SECURITY;

-- RLS Policies for receipts
CREATE POLICY "Users can view their own receipts"
    ON public.receipts FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own receipts"
    ON public.receipts FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own receipts"
    ON public.receipts FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own receipts"
    ON public.receipts FOR DELETE
    USING (auth.uid() = user_id);

-- RLS Policies for categories (read-only for all authenticated users)
CREATE POLICY "Anyone can view receipt categories"
    ON public.receipt_categories FOR SELECT
    TO authenticated
    USING (true);

-- RLS Policies for senders (read-only for all authenticated users)
CREATE POLICY "Anyone can view receipt senders"
    ON public.receipt_senders FOR SELECT
    TO authenticated
    USING (true);

-- ============================================================================
-- INSERT SAMPLE DATA
-- ============================================================================

-- Insert receipt categories
INSERT INTO public.receipt_categories (name, icon, color, description) VALUES
('Grocery', '🛒', 'bg-green-100', 'Supermarkets and grocery stores'),
('Pharmacy', '💊', 'bg-red-100', 'Pharmacies and health stores'),
('Electronics', '💻', 'bg-blue-100', 'Electronics and technology'),
('Clothing', '👕', 'bg-purple-100', 'Clothing and fashion'),
('Restaurant', '🍽️', 'bg-orange-100', 'Restaurants and dining'),
('Gas Station', '⛽', 'bg-yellow-100', 'Fuel and gas stations'),
('Healthcare', '⚕️', 'bg-pink-100', 'Medical and healthcare'),
('Entertainment', '🎬', 'bg-indigo-100', 'Movies, games, entertainment'),
('Home & Garden', '🏡', 'bg-teal-100', 'Home improvement and garden'),
('Other', '📄', 'bg-gray-100', 'Other purchases')
ON CONFLICT (name) DO NOTHING;

-- Insert receipt senders
INSERT INTO public.receipt_senders (sender_name, sender_logo_url, category, website_url, is_verified) VALUES
('Apotek Hjärtat', 'https://example.com/logos/apotek.png', 'Pharmacy', 'https://www.apotekhjartat.se', true),
('Stadium', 'https://example.com/logos/stadium.png', 'Clothing', 'https://www.stadium.se', true),
('Stadium Outlet', 'https://example.com/logos/stadium-outlet.png', 'Clothing', 'https://www.stadium.se/outlet', true),
('Kjell & Company', 'https://example.com/logos/kjell.png', 'Electronics', 'https://www.kjell.com', true),
('ICA Maxi', 'https://example.com/logos/ica.png', 'Grocery', 'https://www.ica.se', true),
('Coop', 'https://example.com/logos/coop.png', 'Grocery', 'https://www.coop.se', true),
('Hemköp', 'https://example.com/logos/hemkop.png', 'Grocery', 'https://www.hemkop.se', true),
('Circle K', 'https://example.com/logos/circlek.png', 'Gas Station', 'https://www.circlek.se', true),
('McDonald''s', 'https://example.com/logos/mcdonalds.png', 'Restaurant', 'https://www.mcdonalds.se', true),
('H&M', 'https://example.com/logos/hm.png', 'Clothing', 'https://www.hm.com', true)
ON CONFLICT (sender_name) DO NOTHING;

-- Note: Sample receipts will be inserted after user authentication
-- The following is a template for inserting sample receipts:
/*
INSERT INTO public.receipts (
    user_id, 
    store_name, 
    store_category,
    transaction_date,
    total_amount,
    currency,
    tax_amount,
    payment_method,
    items,
    tags
) VALUES (
    'USER_ID_HERE',
    'Apotek Hjärtat',
    'Pharmacy',
    NOW() - INTERVAL '5 days',
    374.20,
    'USD',
    74.84,
    'credit_card',
    '[
        {"name": "Paracetamol 500mg", "quantity": 2, "price": 89.50, "category": "Medicine"},
        {"name": "Vitamin C", "quantity": 1, "price": 149.00, "category": "Supplements"},
        {"name": "Hand Sanitizer", "quantity": 3, "price": 45.23, "category": "Health"}
    ]'::jsonb,
    ARRAY['health', 'medicine', 'pharmacy']
);
*/

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to get user's receipt statistics
CREATE OR REPLACE FUNCTION get_user_receipt_stats(p_user_id UUID)
RETURNS TABLE (
    total_receipts BIGINT,
    total_spent DECIMAL,
    this_month_spent DECIMAL,
    favorite_store TEXT,
    most_common_category TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::BIGINT as total_receipts,
        COALESCE(SUM(total_amount), 0) as total_spent,
        COALESCE(SUM(CASE 
            WHEN transaction_date >= DATE_TRUNC('month', CURRENT_DATE) 
            THEN total_amount 
            ELSE 0 
        END), 0) as this_month_spent,
        (SELECT store_name 
         FROM public.receipts 
         WHERE user_id = p_user_id 
         GROUP BY store_name 
         ORDER BY COUNT(*) DESC 
         LIMIT 1) as favorite_store,
        (SELECT store_category 
         FROM public.receipts 
         WHERE user_id = p_user_id 
         GROUP BY store_category 
         ORDER BY COUNT(*) DESC 
         LIMIT 1) as most_common_category
    FROM public.receipts
    WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_user_receipt_stats(UUID) TO authenticated;

COMMENT ON TABLE public.receipts IS 'Stores digital receipts for users';
COMMENT ON TABLE public.receipt_categories IS 'Categories for organizing receipts';
COMMENT ON TABLE public.receipt_senders IS 'Stores and merchants that issue receipts';
