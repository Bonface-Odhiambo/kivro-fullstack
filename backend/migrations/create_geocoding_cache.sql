-- Create geocoding_cache table to store API results
-- This reduces API calls and improves performance

CREATE TABLE IF NOT EXISTS geocoding_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('forward', 'reverse')),
  input TEXT NOT NULL,
  result JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_geocoding_cache_key ON geocoding_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_geocoding_cache_type ON geocoding_cache(type);
CREATE INDEX IF NOT EXISTS idx_geocoding_cache_created ON geocoding_cache(created_at);

-- Add RLS policies
ALTER TABLE geocoding_cache ENABLE ROW LEVEL SECURITY;

-- Allow service role to manage cache
CREATE POLICY "Service role can manage geocoding cache"
  ON geocoding_cache
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create function to clean old cache entries (older than 90 days)
CREATE OR REPLACE FUNCTION clean_old_geocoding_cache()
RETURNS void AS $$
BEGIN
  DELETE FROM geocoding_cache
  WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job to clean cache weekly (requires pg_cron extension)
-- Run manually: SELECT clean_old_geocoding_cache();

COMMENT ON TABLE geocoding_cache IS 'Caches geocoding API results to reduce external API calls and improve performance';
COMMENT ON COLUMN geocoding_cache.cache_key IS 'Unique key for caching (e.g., "lat,lng" for reverse or "address" for forward)';
COMMENT ON COLUMN geocoding_cache.type IS 'Type of geocoding: forward (address to coords) or reverse (coords to address)';
COMMENT ON COLUMN geocoding_cache.input IS 'Original input (coordinates or address)';
COMMENT ON COLUMN geocoding_cache.result IS 'Geocoding result as JSON';
