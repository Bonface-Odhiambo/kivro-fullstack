-- Create app_metrics table to store app store and platform metrics
CREATE TABLE IF NOT EXISTS app_metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    metric_type VARCHAR(50) NOT NULL, -- 'android_installs', 'ios_installs', 'play_store_reviews', etc.
    metric_value BIGINT NOT NULL DEFAULT 0,
    metric_date DATE NOT NULL DEFAULT CURRENT_DATE,
    additional_data JSONB, -- For storing extra metadata like ratings, etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_app_metrics_type_date ON app_metrics(metric_type, metric_date DESC);
CREATE INDEX IF NOT EXISTS idx_app_metrics_created_at ON app_metrics(created_at DESC);

-- Enable RLS (Row Level Security)
ALTER TABLE app_metrics ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist, then create new ones
DROP POLICY IF EXISTS "Admin can view all app metrics" ON app_metrics;
DROP POLICY IF EXISTS "Admin can insert app metrics" ON app_metrics;
DROP POLICY IF EXISTS "Admin can update app metrics" ON app_metrics;

-- Create policy for admin access only
CREATE POLICY "Admin can view all app metrics" ON app_metrics
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.user_id = auth.uid() 
            AND profiles.user_type = 'admin'
        )
    );

CREATE POLICY "Admin can insert app metrics" ON app_metrics
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.user_id = auth.uid() 
            AND profiles.user_type = 'admin'
        )
    );

CREATE POLICY "Admin can update app metrics" ON app_metrics
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.user_id = auth.uid() 
            AND profiles.user_type = 'admin'
        )
    );

-- Insert initial zero data (only if not already exists)
INSERT INTO app_metrics (metric_type, metric_value, additional_data) 
SELECT 'android_installs', 0, '{"source": "google_play_console", "last_updated": "2025-01-12", "note": "Awaiting real data"}'
WHERE NOT EXISTS (SELECT 1 FROM app_metrics WHERE metric_type = 'android_installs');

INSERT INTO app_metrics (metric_type, metric_value, additional_data) 
SELECT 'ios_installs', 0, '{"source": "app_store_connect", "last_updated": "2025-01-12", "note": "Awaiting real data"}'
WHERE NOT EXISTS (SELECT 1 FROM app_metrics WHERE metric_type = 'ios_installs');

INSERT INTO app_metrics (metric_type, metric_value, additional_data) 
SELECT 'play_store_reviews', 0, '{"average_rating": 0, "total_ratings": 0, "last_updated": "2025-01-12", "note": "Awaiting real data"}'
WHERE NOT EXISTS (SELECT 1 FROM app_metrics WHERE metric_type = 'play_store_reviews');

INSERT INTO app_metrics (metric_type, metric_value, additional_data) 
SELECT 'app_store_reviews', 0, '{"average_rating": 0, "total_ratings": 0, "last_updated": "2025-01-12", "note": "Awaiting real data"}'
WHERE NOT EXISTS (SELECT 1 FROM app_metrics WHERE metric_type = 'app_store_reviews');

-- Create function to get latest metric value
CREATE OR REPLACE FUNCTION get_latest_metric(metric_name TEXT)
RETURNS BIGINT AS $$
BEGIN
    RETURN (
        SELECT metric_value 
        FROM app_metrics 
        WHERE metric_type = metric_name 
        ORDER BY created_at DESC 
        LIMIT 1
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to update or insert metric
CREATE OR REPLACE FUNCTION upsert_app_metric(
    p_metric_type TEXT,
    p_metric_value BIGINT,
    p_additional_data JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    result_id UUID;
BEGIN
    INSERT INTO app_metrics (metric_type, metric_value, additional_data)
    VALUES (p_metric_type, p_metric_value, p_additional_data)
    RETURNING id INTO result_id;
    
    RETURN result_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE app_metrics IS 'Stores app store and platform metrics for admin dashboard';
COMMENT ON FUNCTION get_latest_metric(TEXT) IS 'Gets the latest value for a specific metric type';
COMMENT ON FUNCTION upsert_app_metric(TEXT, BIGINT, JSONB) IS 'Inserts or updates an app metric value';
