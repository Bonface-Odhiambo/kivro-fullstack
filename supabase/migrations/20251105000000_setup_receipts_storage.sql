-- ============================================
-- RECEIPTS FEATURE SETUP
-- ============================================
-- This migration creates the receipts table, storage bucket,
-- and necessary functions for receipt management
-- ============================================

-- Step 1: Create receipts table if it doesn't exist
CREATE TABLE IF NOT EXISTS receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receipt_number VARCHAR(100) UNIQUE NOT NULL,
  store_name VARCHAR(255) NOT NULL,
  store_address TEXT,
  category_name VARCHAR(100),
  transaction_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  subtotal DECIMAL(12, 2) NOT NULL DEFAULT 0,
  tax_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
  discount_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
  tip_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
  total_amount DECIMAL(12, 2) NOT NULL,
  currency VARCHAR(10) NOT NULL DEFAULT 'USD',
  payment_method VARCHAR(50),
  card_last_four VARCHAR(4),
  image_url TEXT,
  pdf_url TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  is_favorite BOOLEAN NOT NULL DEFAULT FALSE,
  tags TEXT[],
  notes TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_receipts_user_id ON receipts(user_id);
CREATE INDEX IF NOT EXISTS idx_receipts_status ON receipts(status);
CREATE INDEX IF NOT EXISTS idx_receipts_transaction_date ON receipts(transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_receipts_category ON receipts(category_name);
CREATE INDEX IF NOT EXISTS idx_receipts_is_favorite ON receipts(is_favorite);

-- Step 2: Create storage bucket for receipt images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'receipt-images',
  'receipt-images',
  true,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- Step 3: Set up storage policies for receipt images
DROP POLICY IF EXISTS "Users can upload their own receipt images" ON storage.objects;
CREATE POLICY "Users can upload their own receipt images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'receipt-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Users can view their own receipt images" ON storage.objects;
CREATE POLICY "Users can view their own receipt images"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'receipt-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Users can update their own receipt images" ON storage.objects;
CREATE POLICY "Users can update their own receipt images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'receipt-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Users can delete their own receipt images" ON storage.objects;
CREATE POLICY "Users can delete their own receipt images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'receipt-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Step 4: Enable RLS on receipts table
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;

-- Step 5: Create RLS policies for receipts
DROP POLICY IF EXISTS "Users can view their own receipts" ON receipts;
CREATE POLICY "Users can view their own receipts"
ON receipts FOR SELECT
TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert their own receipts" ON receipts;
CREATE POLICY "Users can insert their own receipts"
ON receipts FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own receipts" ON receipts;
CREATE POLICY "Users can update their own receipts"
ON receipts FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete their own receipts" ON receipts;
CREATE POLICY "Users can delete their own receipts"
ON receipts FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- Step 6: Create function to get receipt statistics
DROP FUNCTION IF EXISTS get_receipt_statistics(UUID);
CREATE OR REPLACE FUNCTION get_receipt_statistics(p_user_id UUID)
RETURNS TABLE (
  total_receipts BIGINT,
  total_spent DECIMAL,
  this_month_count BIGINT,
  this_month_spent DECIMAL,
  favorite_count BIGINT,
  top_category TEXT,
  top_store TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT as total_receipts,
    COALESCE(SUM(total_amount), 0)::DECIMAL as total_spent,
    COUNT(*) FILTER (
      WHERE transaction_date >= date_trunc('month', CURRENT_DATE)
    )::BIGINT as this_month_count,
    COALESCE(SUM(total_amount) FILTER (
      WHERE transaction_date >= date_trunc('month', CURRENT_DATE)
    ), 0)::DECIMAL as this_month_spent,
    COUNT(*) FILTER (WHERE is_favorite = true)::BIGINT as favorite_count,
    (
      SELECT category_name
      FROM receipts
      WHERE user_id = p_user_id AND status = 'active' AND category_name IS NOT NULL
      GROUP BY category_name
      ORDER BY COUNT(*) DESC
      LIMIT 1
    ) as top_category,
    (
      SELECT store_name
      FROM receipts
      WHERE user_id = p_user_id AND status = 'active'
      GROUP BY store_name
      ORDER BY COUNT(*) DESC
      LIMIT 1
    ) as top_store
  FROM receipts
  WHERE user_id = p_user_id AND status = 'active';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 7: Create function to get spending by category
DROP FUNCTION IF EXISTS get_spending_by_category(UUID);
CREATE OR REPLACE FUNCTION get_spending_by_category(p_user_id UUID)
RETURNS TABLE (
  category_name TEXT,
  category_icon TEXT,
  total_spent DECIMAL,
  receipt_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    r.category_name::TEXT,
    CASE r.category_name
      WHEN 'Grocery' THEN '🛒'
      WHEN 'Restaurant' THEN '🍽️'
      WHEN 'Pharmacy' THEN '💊'
      WHEN 'Electronics' THEN '💻'
      WHEN 'Clothing' THEN '👕'
      WHEN 'Gas Station' THEN '⛽'
      WHEN 'Healthcare' THEN '⚕️'
      WHEN 'Entertainment' THEN '🎬'
      WHEN 'Travel' THEN '✈️'
      WHEN 'Home & Garden' THEN '🏠'
      WHEN 'Beauty' THEN '💄'
      WHEN 'Sports' THEN '⚽'
      WHEN 'Books' THEN '📚'
      ELSE '📄'
    END::TEXT as category_icon,
    COALESCE(SUM(r.total_amount), 0)::DECIMAL as total_spent,
    COUNT(*)::BIGINT as receipt_count
  FROM receipts r
  WHERE r.user_id = p_user_id 
    AND r.status = 'active'
    AND r.category_name IS NOT NULL
  GROUP BY r.category_name
  ORDER BY total_spent DESC
  LIMIT 10;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 8: Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_receipts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_receipts_updated_at ON receipts;
CREATE TRIGGER trigger_receipts_updated_at
BEFORE UPDATE ON receipts
FOR EACH ROW
EXECUTE FUNCTION update_receipts_updated_at();

-- ============================================
-- RESULT: 
-- ✅ Receipts table created/verified
-- ✅ Storage bucket created for receipt images
-- ✅ RLS policies configured
-- ✅ Statistics functions created
-- ✅ Auto-update triggers configured
-- ============================================

-- Display success message
DO $$
BEGIN
  RAISE NOTICE '✅ Receipts feature setup completed successfully!';
  RAISE NOTICE '📦 Storage bucket: receipt-images (10MB limit)';
  RAISE NOTICE '🔒 RLS policies: enabled and configured';
  RAISE NOTICE '📊 Statistics functions: get_receipt_statistics(), get_spending_by_category()';
END $$;
