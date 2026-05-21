-- Get user ID for principalresearcher138@gmail.com
-- Run this in Supabase SQL Editor to get the user_id

SELECT 
  id as user_id,
  email,
  created_at,
  email_confirmed_at,
  last_sign_in_at
FROM auth.users
WHERE email = 'principalresearcher138@gmail.com';

-- This will return the user_id that you need for the next migration
