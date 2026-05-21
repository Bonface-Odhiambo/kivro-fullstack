-- ============================================================================
-- INSERT SAMPLE RECEIPTS AND SHARED FILES
-- This migration inserts sample data for testing the Receipts and Shared pages
-- ============================================================================

-- Function to insert sample receipts for a user
CREATE OR REPLACE FUNCTION insert_sample_receipts_for_user(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
    -- Insert sample receipts
    INSERT INTO public.receipts (
        user_id,
        store_name,
        store_category,
        transaction_date,
        total_amount,
        currency,
        tax_amount,
        payment_method,
        card_last_four,
        items,
        tags
    ) VALUES
    (
        p_user_id,
        'Apotek Hjärtat',
        'Pharmacy',
        NOW() - INTERVAL '20 days',
        374.20,
        'USD',
        74.84,
        'credit_card',
        '4532',
        '[
            {"name": "Paracetamol 500mg", "quantity": 2, "price": 89.50, "category": "Medicine"},
            {"name": "Vitamin C 1000mg", "quantity": 1, "price": 149.00, "category": "Supplements"},
            {"name": "Hand Sanitizer", "quantity": 3, "price": 45.23, "category": "Health"}
        ]'::jsonb,
        ARRAY['health', 'medicine', 'pharmacy']
    ),
    (
        p_user_id,
        'Stadium',
        'Clothing',
        NOW() - INTERVAL '15 days',
        156.50,
        'USD',
        31.30,
        'credit_card',
        '4532',
        '[
            {"name": "Running Shoes", "quantity": 1, "price": 89.99, "category": "Footwear"},
            {"name": "Sports Socks", "quantity": 2, "price": 12.99, "category": "Accessories"},
            {"name": "Water Bottle", "quantity": 1, "price": 22.22, "category": "Equipment"}
        ]'::jsonb,
        ARRAY['sports', 'clothing', 'fitness']
    ),
    (
        p_user_id,
        'ICA Maxi',
        'Grocery',
        NOW() - INTERVAL '10 days',
        89.75,
        'USD',
        17.95,
        'debit_card',
        '5678',
        '[
            {"name": "Milk 1L", "quantity": 2, "price": 3.50, "category": "Dairy"},
            {"name": "Bread", "quantity": 1, "price": 4.25, "category": "Bakery"},
            {"name": "Eggs 12pk", "quantity": 1, "price": 5.99, "category": "Dairy"},
            {"name": "Chicken Breast 500g", "quantity": 2, "price": 12.50, "category": "Meat"},
            {"name": "Tomatoes 1kg", "quantity": 1, "price": 6.75, "category": "Vegetables"}
        ]'::jsonb,
        ARRAY['grocery', 'food', 'daily']
    ),
    (
        p_user_id,
        'Kjell & Company',
        'Electronics',
        NOW() - INTERVAL '7 days',
        245.99,
        'USD',
        49.20,
        'credit_card',
        '4532',
        '[
            {"name": "USB-C Cable 2m", "quantity": 2, "price": 19.99, "category": "Cables"},
            {"name": "Wireless Mouse", "quantity": 1, "price": 45.00, "category": "Accessories"},
            {"name": "Phone Case", "quantity": 1, "price": 29.99, "category": "Accessories"}
        ]'::jsonb,
        ARRAY['electronics', 'tech', 'accessories']
    ),
    (
        p_user_id,
        'Circle K',
        'Gas Station',
        NOW() - INTERVAL '3 days',
        65.00,
        'USD',
        13.00,
        'credit_card',
        '4532',
        '[
            {"name": "Gasoline 95", "quantity": 45, "price": 1.35, "category": "Fuel"},
            {"name": "Coffee", "quantity": 1, "price": 3.50, "category": "Beverage"}
        ]'::jsonb,
        ARRAY['fuel', 'gas', 'transport']
    ),
    (
        p_user_id,
        'McDonald''s',
        'Restaurant',
        NOW() - INTERVAL '2 days',
        18.50,
        'USD',
        3.70,
        'mobile_payment',
        NULL,
        '[
            {"name": "Big Mac Meal", "quantity": 1, "price": 12.99, "category": "Meal"},
            {"name": "McFlurry", "quantity": 1, "price": 5.51, "category": "Dessert"}
        ]'::jsonb,
        ARRAY['food', 'restaurant', 'fast-food']
    );
    
    RAISE NOTICE 'Inserted 6 sample receipts for user %', p_user_id;
END;
$$ LANGUAGE plpgsql;

-- Function to insert sample shared files for a user
CREATE OR REPLACE FUNCTION insert_sample_shared_files_for_user(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
    v_other_user_id UUID;
BEGIN
    -- Try to get another user ID for sharing (if exists)
    SELECT user_id INTO v_other_user_id
    FROM public.profiles
    WHERE user_id != p_user_id
    LIMIT 1;
    
    -- Insert sample shared files
    INSERT INTO public.shared_files (
        owner_id,
        item_type,
        item_name,
        file_type,
        file_size,
        shared_with_user_ids,
        share_type,
        can_view,
        can_download,
        can_edit,
        description,
        tags,
        download_count,
        view_count
    ) VALUES
    (
        p_user_id,
        'folder',
        'Tax Documents 2025',
        'folder',
        NULL,
        CASE WHEN v_other_user_id IS NOT NULL THEN ARRAY[v_other_user_id]::UUID[] ELSE ARRAY[]::UUID[] END,
        'private',
        true,
        true,
        false,
        'Important tax documents for 2025 fiscal year',
        ARRAY['tax', 'documents', 'finance', '2025'],
        0,
        5
    ),
    (
        p_user_id,
        'folder',
        'Family Photos',
        'folder',
        NULL,
        ARRAY[]::UUID[],
        'private',
        true,
        true,
        false,
        'Family vacation photos from summer 2025',
        ARRAY['photos', 'family', 'vacation', 'personal'],
        3,
        12
    ),
    (
        p_user_id,
        'file',
        'Invoice_2025_001.pdf',
        'application/pdf',
        524288,
        CASE WHEN v_other_user_id IS NOT NULL THEN ARRAY[v_other_user_id]::UUID[] ELSE ARRAY[]::UUID[] END,
        'private',
        true,
        true,
        false,
        'Invoice for services rendered in January 2025',
        ARRAY['invoice', 'business', 'finance'],
        2,
        8
    ),
    (
        p_user_id,
        'file',
        'Presentation.pptx',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        2097152,
        ARRAY[]::UUID[],
        'link',
        true,
        true,
        true,
        'Q1 2025 Business Presentation',
        ARRAY['presentation', 'business', 'work'],
        5,
        15
    ),
    (
        p_user_id,
        'file',
        'Project_Proposal.docx',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        1048576,
        ARRAY[]::UUID[],
        'private',
        true,
        true,
        true,
        'New project proposal document',
        ARRAY['proposal', 'project', 'work'],
        1,
        6
    ),
    (
        p_user_id,
        'file',
        'Budget_2025.xlsx',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        786432,
        ARRAY[]::UUID[],
        'private',
        true,
        true,
        false,
        'Annual budget spreadsheet for 2025',
        ARRAY['budget', 'finance', 'planning'],
        0,
        3
    );
    
    -- Insert some access logs
    INSERT INTO public.shared_file_access_log (
        shared_file_id,
        accessed_by_user_id,
        access_type
    )
    SELECT 
        id,
        p_user_id,
        'view'
    FROM public.shared_files
    WHERE owner_id = p_user_id
    LIMIT 3;
    
    RAISE NOTICE 'Inserted 6 sample shared files for user %', p_user_id;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION insert_sample_receipts_for_user(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION insert_sample_shared_files_for_user(UUID) TO authenticated;

-- Note: To insert sample data for your user, run these functions in the SQL editor:
-- SELECT insert_sample_receipts_for_user(auth.uid());
-- SELECT insert_sample_shared_files_for_user(auth.uid());

COMMENT ON FUNCTION insert_sample_receipts_for_user(UUID) IS 'Inserts sample receipts for testing';
COMMENT ON FUNCTION insert_sample_shared_files_for_user(UUID) IS 'Inserts sample shared files for testing';
