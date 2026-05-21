-- Migration: Auto-create user profiles on signup
-- Created: 2025-11-13
-- Purpose: Automatically create user profiles when users sign up via any method (email, OAuth, etc.)

-- Function to create user profile automatically
CREATE OR REPLACE FUNCTION public.create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
    -- Create profile for new user
    INSERT INTO public.profiles (
        user_id,
        full_name,
        display_name,
        user_type,
        created_at,
        updated_at
    ) VALUES (
        NEW.id,
        COALESCE(
            NEW.raw_user_meta_data->>'full_name',
            NEW.raw_user_meta_data->>'name',
            SPLIT_PART(NEW.email, '@', 1),
            'New User'
        ),
        COALESCE(
            NEW.raw_user_meta_data->>'full_name',
            NEW.raw_user_meta_data->>'name',
            SPLIT_PART(NEW.email, '@', 1),
            'New User'
        ),
        'user',
        NOW(),
        NOW()
    );
    
    -- Log the profile creation
    RAISE NOTICE 'Auto-created profile for user: % (email: %)', NEW.id, NEW.email;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log error but don't fail the user creation
        RAISE WARNING 'Failed to auto-create profile for user %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-create profiles on user signup
DROP TRIGGER IF EXISTS create_user_profile_on_signup ON auth.users;
CREATE TRIGGER create_user_profile_on_signup
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION create_user_profile();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.profiles TO postgres, anon, authenticated, service_role;

-- Verification: Check if trigger was created successfully
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'create_user_profile_on_signup';

-- Test the function (optional - can be commented out)
-- This will show what the function would do without actually creating a user
DO $$
BEGIN
    RAISE NOTICE '✅ Auto-profile creation trigger installed successfully';
    RAISE NOTICE '📋 This trigger will:';
    RAISE NOTICE '   - Automatically create profiles for new users';
    RAISE NOTICE '   - Extract name from Google OAuth metadata';
    RAISE NOTICE '   - Use email username as fallback for display name';
    RAISE NOTICE '   - Set user_type to "user" by default';
    RAISE NOTICE '   - Handle errors gracefully without blocking signup';
END $$;
