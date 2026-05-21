-- Fix admin profile for kivroafrica@gmail.com
-- Purpose: Ensure admin user has correct profile with user_type = 'admin'

DO $$
DECLARE
    admin_user_id UUID;
BEGIN
    -- Get the admin user ID
    SELECT id INTO admin_user_id 
    FROM auth.users 
    WHERE email = 'kivroafrica@gmail.com';
    
    IF admin_user_id IS NULL THEN
        RAISE EXCEPTION 'Admin user kivroafrica@gmail.com not found in auth.users';
    END IF;
    
    RAISE NOTICE '👤 Found admin user ID: %', admin_user_id;
    
    -- Check if profiles table exists
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'profiles') THEN
        RAISE EXCEPTION 'Profiles table does not exist';
    END IF;
    
    -- Check if profile already exists
    IF EXISTS (SELECT 1 FROM profiles WHERE user_id = admin_user_id) THEN
        -- Update existing profile
        UPDATE profiles 
        SET 
            user_type = 'admin',
            full_name = 'KIVRO Admin',
            display_name = 'KIVRO Admin',
            phone_number = '+254700000000',
            updated_at = NOW()
        WHERE user_id = admin_user_id;
        
        RAISE NOTICE '✅ Updated existing admin profile';
    ELSE
        -- Create new profile
        INSERT INTO profiles (
            user_id,
            full_name,
            display_name,
            user_type,
            phone_number,
            created_at,
            updated_at
        ) VALUES (
            admin_user_id,
            'KIVRO Admin',
            'KIVRO Admin',
            'admin',
            '+254700000000',
            NOW(),
            NOW()
        );
        
        RAISE NOTICE '✅ Created new admin profile';
    END IF;
    
    -- Verify the fix
    DECLARE
        profile_user_type TEXT;
    BEGIN
        SELECT user_type INTO profile_user_type 
        FROM profiles 
        WHERE user_id = admin_user_id;
        
        IF profile_user_type = 'admin' THEN
            RAISE NOTICE '🎉 SUCCESS: Admin profile verified with user_type = admin';
        ELSE
            RAISE EXCEPTION 'FAILED: Profile user_type is % instead of admin', profile_user_type;
        END IF;
    END;
    
END $$;

-- Final verification query
SELECT 
    '=== ADMIN USER VERIFICATION ===' as section,
    au.email,
    au.id as user_id,
    p.user_type,
    p.full_name,
    CASE 
        WHEN p.user_type = 'admin' THEN '✅ ADMIN ACCESS GRANTED'
        ELSE '❌ NOT ADMIN'
    END as status
FROM auth.users au
JOIN profiles p ON au.id = p.user_id
WHERE au.email = 'kivroafrica@gmail.com';
