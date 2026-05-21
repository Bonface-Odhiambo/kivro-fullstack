-- Migration: Reset all users and create admin user
-- Created: 2025-11-13
-- Purpose: Clean database and create kivroafrica@gmail.com admin user

BEGIN;

-- Step 1: Clean up all user-related data
DO $$
BEGIN
    RAISE NOTICE '🧹 Starting database cleanup...';
    
    -- Delete all user-related data in correct order (respecting foreign keys)
    -- Use IF EXISTS to handle tables that might not exist yet
    
    -- Delete receipts (references profiles) - if table exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'receipts') THEN
        DELETE FROM receipts;
        RAISE NOTICE '✅ Deleted all receipts';
    ELSE
        RAISE NOTICE '⚠️  Receipts table does not exist, skipping';
    END IF;
    
    -- Delete government messages (references profiles via user_id) - if table exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'government_messages') THEN
        DELETE FROM government_messages;
        RAISE NOTICE '✅ Deleted all government messages';
    ELSE
        RAISE NOTICE '⚠️  Government messages table does not exist, skipping';
    END IF;
    
    -- Delete kivro addresses (references profiles) - if table exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'kivro_addresses') THEN
        DELETE FROM kivro_addresses;
        RAISE NOTICE '✅ Deleted all KIVRO addresses';
    ELSE
        RAISE NOTICE '⚠️  KIVRO addresses table does not exist, skipping';
    END IF;
    
    -- Delete packages (references profiles via created_by, sender_id, recipient_id) - if table exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'packages') THEN
        DELETE FROM packages;
        RAISE NOTICE '✅ Deleted all packages';
    ELSE
        RAISE NOTICE '⚠️  Packages table does not exist, skipping';
    END IF;
    
    -- Delete any other user-related tables - if they exist
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_subscriptions') THEN
        DELETE FROM user_subscriptions WHERE TRUE;
        RAISE NOTICE '✅ Deleted all user subscriptions';
    ELSE
        RAISE NOTICE '⚠️  User subscriptions table does not exist, skipping';
    END IF;
    
    -- Delete profiles (references auth.users) - if table exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'profiles') THEN
        DELETE FROM profiles;
        RAISE NOTICE '✅ Deleted all user profiles';
    ELSE
        RAISE NOTICE '⚠️  Profiles table does not exist, skipping';
    END IF;
    
    RAISE NOTICE '🎯 All existing user data cleaned successfully';
END $$;

-- Step 2: Delete all auth users (this will cascade to any remaining references)
DO $$
DECLARE
    user_count INTEGER;
BEGIN
    -- Count existing users
    SELECT COUNT(*) INTO user_count FROM auth.users;
    RAISE NOTICE '👥 Found % existing auth users', user_count;
    
    -- Delete all auth users
    DELETE FROM auth.users;
    
    -- Verify deletion
    SELECT COUNT(*) INTO user_count FROM auth.users;
    RAISE NOTICE '✅ Deleted all auth users. Remaining: %', user_count;
END $$;

-- Step 3: Create admin user in auth.users
DO $$
DECLARE
    admin_user_id UUID;
    encrypted_password TEXT;
BEGIN
    RAISE NOTICE '👤 Creating admin user...';
    
    -- Generate UUID for admin user
    admin_user_id := gen_random_uuid();
    
    -- Create encrypted password (Supabase uses bcrypt)
    -- Note: In production, this should be done through Supabase Auth API
    -- For migration purposes, we'll create with a placeholder and update via API
    
    INSERT INTO auth.users (
        id,
        instance_id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        invited_at,
        confirmation_token,
        confirmation_sent_at,
        recovery_token,
        recovery_sent_at,
        email_change_token_new,
        email_change,
        email_change_sent_at,
        last_sign_in_at,
        raw_app_meta_data,
        raw_user_meta_data,
        is_super_admin,
        created_at,
        updated_at,
        phone,
        phone_confirmed_at,
        phone_change,
        phone_change_token,
        phone_change_sent_at,
        email_change_token_current,
        email_change_confirm_status,
        banned_until,
        reauthentication_token,
        reauthentication_sent_at,
        is_sso_user,
        deleted_at
    ) VALUES (
        admin_user_id,
        '00000000-0000-0000-0000-000000000000',
        'authenticated',
        'authenticated',
        'kivroafrica@gmail.com',
        crypt('BlueMountain47!Rocket', gen_salt('bf')), -- bcrypt hash
        NOW(),
        NULL,
        '',
        NULL,
        '',
        NULL,
        '',
        '',
        NULL,
        NULL,
        '{"provider": "email", "providers": ["email"]}',
        '{"full_name": "KIVRO Admin"}',
        false,
        NOW(),
        NOW(),
        NULL,
        NULL,
        '',
        '',
        NULL,
        '',
        0,
        NULL,
        '',
        NULL,
        false,
        NULL
    );
    
    RAISE NOTICE '✅ Created admin user with ID: %', admin_user_id;
    
    -- Step 4: Create admin profile
    -- Use a more flexible approach that works with different profile table structures
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'profiles') THEN
        -- Check if created_at and updated_at columns exist
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'created_at') THEN
            INSERT INTO profiles (
                user_id,
                full_name,
                display_name,
                user_type,
                created_at,
                updated_at
            ) VALUES (
                admin_user_id,
                'KIVRO Admin',
                'KIVRO Admin',
                'admin',
                NOW(),
                NOW()
            );
        ELSE
            -- Insert without timestamp columns if they don't exist
            INSERT INTO profiles (
                user_id,
                full_name,
                display_name,
                user_type
            ) VALUES (
                admin_user_id,
                'KIVRO Admin',
                'KIVRO Admin',
                'admin'
            );
        END IF;
        RAISE NOTICE '✅ Created admin profile';
    ELSE
        RAISE NOTICE '⚠️  Profiles table does not exist - admin user created in auth.users only';
    END IF;
    
    -- Step 5: Verify creation
    RAISE NOTICE '🔍 Verification:';
    RAISE NOTICE '  - Admin User ID: %', admin_user_id;
    RAISE NOTICE '  - Email: kivroafrica@gmail.com';
    RAISE NOTICE '  - User Type: admin';
    RAISE NOTICE '  - Password: BlueMountain47!Rocket';
    
END $$;

-- Step 6: Final verification and summary
DO $$
DECLARE
    total_users INTEGER;
    admin_count INTEGER;
    profile_count INTEGER;
BEGIN
    -- Count final state
    SELECT COUNT(*) INTO total_users FROM auth.users;
    SELECT COUNT(*) INTO admin_count FROM auth.users WHERE email = 'kivroafrica@gmail.com';
    SELECT COUNT(*) INTO profile_count FROM profiles WHERE user_type = 'admin';
    
    RAISE NOTICE '📊 FINAL STATE:';
    RAISE NOTICE '  - Total auth users: %', total_users;
    RAISE NOTICE '  - Admin users: %', admin_count;
    RAISE NOTICE '  - Admin profiles: %', profile_count;
    
    IF admin_count = 1 AND profile_count = 1 THEN
        RAISE NOTICE '🎉 SUCCESS: Admin user created successfully!';
        RAISE NOTICE '🔑 Login credentials:';
        RAISE NOTICE '    Email: kivroafrica@gmail.com';
        RAISE NOTICE '    Password: BlueMountain47!Rocket';
        RAISE NOTICE '🌐 Access admin panel at: /admin';
    ELSE
        RAISE EXCEPTION 'FAILED: Admin user creation unsuccessful';
    END IF;
END $$;

COMMIT;

-- Post-migration notes:
-- 1. Admin user created with email: kivroafrica@gmail.com
-- 2. Password: BlueMountain47!Rocket
-- 3. User type: admin
-- 4. Access admin panel at: https://kivro.africa/admin
-- 5. All previous user data has been completely removed
-- 6. Database is now clean with only the admin user
