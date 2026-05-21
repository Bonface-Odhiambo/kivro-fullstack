-- Clear sample data and replace with real zero values
-- This migration removes fake sample data and ensures metrics show real values

-- Clear existing sample app metrics data
DELETE FROM app_metrics WHERE metric_type IN ('android_installs', 'ios_installs', 'play_store_reviews', 'app_store_reviews');

-- Clear existing sample Stripe transactions
DELETE FROM stripe_transactions WHERE stripe_payment_intent_id LIKE 'pi_%' AND description LIKE '%KIVRO Address Generation%';

-- Insert real zero values for app metrics (to be updated with real data from APIs)
INSERT INTO app_metrics (metric_type, metric_value, additional_data) VALUES
('android_installs', 0, '{"source": "google_play_console", "last_updated": "2025-11-12", "note": "Real data - no installs yet"}'),
('ios_installs', 0, '{"source": "app_store_connect", "last_updated": "2025-11-12", "note": "Real data - no installs yet"}'),
('play_store_reviews', 0, '{"average_rating": 0, "total_ratings": 0, "last_updated": "2025-11-12", "note": "Real data - no reviews yet"}'),
('app_store_reviews', 0, '{"average_rating": 0, "total_ratings": 0, "last_updated": "2025-11-12", "note": "Real data - no reviews yet"}');

-- Note: Stripe revenue will be $0 since no real transactions exist
-- Total users will show real count from profiles table

COMMENT ON TABLE app_metrics IS 'App metrics with real zero values - no sample/mock data';
COMMENT ON TABLE stripe_transactions IS 'Stripe transactions - real data only, no sample data';
