-- Create a view for admin metrics dashboard
CREATE OR REPLACE VIEW admin_metrics_summary AS
SELECT 
    'stripe_revenue' as metric_name,
    get_total_stripe_revenue() as metric_value,
    'USD' as unit,
    NOW() as last_updated
UNION ALL
SELECT 
    'android_installs' as metric_name,
    COALESCE(get_latest_metric('android_installs'), 0) as metric_value,
    'installs' as unit,
    (SELECT MAX(created_at) FROM app_metrics WHERE metric_type = 'android_installs') as last_updated
UNION ALL
SELECT 
    'ios_installs' as metric_name,
    COALESCE(get_latest_metric('ios_installs'), 0) as metric_value,
    'installs' as unit,
    (SELECT MAX(created_at) FROM app_metrics WHERE metric_type = 'ios_installs') as last_updated
UNION ALL
SELECT 
    'play_store_reviews' as metric_name,
    COALESCE(get_latest_metric('play_store_reviews'), 0) as metric_value,
    'reviews' as unit,
    (SELECT MAX(created_at) FROM app_metrics WHERE metric_type = 'play_store_reviews') as last_updated
UNION ALL
SELECT 
    'total_users' as metric_name,
    (SELECT COUNT(*) FROM profiles) as metric_value,
    'users' as unit,
    NOW() as last_updated;

-- Grant access to admin users only
GRANT SELECT ON admin_metrics_summary TO authenticated;

-- Note: RLS policies cannot be applied to views, only tables
-- Access control is handled at the table level (app_metrics, stripe_transactions, profiles)
-- and through backend API authentication

-- Create function to refresh metrics (for scheduled updates)
CREATE OR REPLACE FUNCTION refresh_app_metrics()
RETURNS VOID AS $$
BEGIN
    -- This function can be called by webhooks or scheduled jobs
    -- to update app metrics from external APIs
    
    -- Example: Update Android installs (would be called by Google Play Console webhook)
    -- INSERT INTO app_metrics (metric_type, metric_value, additional_data)
    -- VALUES ('android_installs', new_value, '{"source": "google_play_console"}');
    
    -- Example: Update iOS installs (would be called by App Store Connect API)
    -- INSERT INTO app_metrics (metric_type, metric_value, additional_data)
    -- VALUES ('ios_installs', new_value, '{"source": "app_store_connect"}');
    
    RAISE NOTICE 'App metrics refresh function called at %', NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON VIEW admin_metrics_summary IS 'Consolidated view of all admin dashboard metrics';
COMMENT ON FUNCTION refresh_app_metrics() IS 'Function to refresh app metrics from external sources';
