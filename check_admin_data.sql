-- ============================================================================
-- Admin Dashboard Data Diagnostic Script
-- Run this in Supabase SQL Editor to check if data exists
-- ============================================================================

-- 1. Check total users
SELECT 
    'Total Users' as metric,
    COUNT(*) as count
FROM public.profiles;

-- 2. Check user types distribution
SELECT 
    'User Types' as metric,
    user_type,
    COUNT(*) as count
FROM public.profiles
GROUP BY user_type
ORDER BY count DESC;

-- 3. Check active subscriptions
SELECT 
    'Active Subscriptions' as metric,
    COUNT(*) as count
FROM public.user_subscriptions
WHERE status = 'active';

-- 4. Check all subscriptions by status
SELECT 
    'Subscriptions by Status' as metric,
    status,
    COUNT(*) as count
FROM public.user_subscriptions
GROUP BY status;

-- 5. Check total addresses
SELECT 
    'Total Addresses' as metric,
    COUNT(*) as count
FROM public.kivro_addresses;

-- 6. Check active addresses
SELECT 
    'Active Addresses' as metric,
    COUNT(*) as count
FROM public.kivro_addresses
WHERE is_active = true;

-- 7. Check total payments
SELECT 
    'Total Payments' as metric,
    COUNT(*) as count
FROM public.payment_requests;

-- 8. Check payments by status
SELECT 
    'Payments by Status' as metric,
    status,
    COUNT(*) as count,
    SUM(amount) as total_amount
FROM public.payment_requests
GROUP BY status
ORDER BY count DESC;

-- 9. Check total revenue (completed payments only)
SELECT 
    'Total Revenue' as metric,
    SUM(amount) as total_revenue,
    COUNT(*) as completed_payments
FROM public.payment_requests
WHERE status IN ('completed', 'success');

-- 10. Check inbox messages
SELECT 
    'Inbox Messages' as metric,
    COUNT(*) as total_messages,
    COUNT(*) FILTER (WHERE is_read = false) as unread_messages,
    COUNT(*) FILTER (WHERE priority = 'urgent') as urgent_messages
FROM public.user_inbox;

-- 11. Check if admin user exists
SELECT 
    'Admin Users' as metric,
    COUNT(*) as count,
    STRING_AGG(display_name, ', ') as admin_names
FROM public.profiles
WHERE user_type = 'admin';

-- 12. Sample of recent users (last 5)
SELECT 
    'Recent Users Sample' as info,
    display_name,
    user_type,
    phone_number,
    created_at
FROM public.profiles
ORDER BY created_at DESC
LIMIT 5;

-- 13. Sample of addresses (last 5)
SELECT 
    'Recent Addresses Sample' as info,
    kivro_code,
    display_address,
    district,
    is_active,
    created_at
FROM public.kivro_addresses
ORDER BY created_at DESC
LIMIT 5;

-- ============================================================================
-- If all counts are 0, the database is empty and needs to be populated
-- ============================================================================
