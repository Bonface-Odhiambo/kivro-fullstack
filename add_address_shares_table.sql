-- Create address_shares table to track sharing activities
CREATE TABLE IF NOT EXISTS address_shares (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  address_id UUID NOT NULL REFERENCES kivro_addresses(id) ON DELETE CASCADE,
  shared_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_email TEXT,
  recipient_phone TEXT,
  share_method TEXT NOT NULL CHECK (share_method IN ('email', 'sms', 'whatsapp', 'link', 'social')),
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure at least one recipient is specified
  CONSTRAINT check_recipient CHECK (
    recipient_email IS NOT NULL OR recipient_phone IS NOT NULL
  )
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_address_shares_address_id ON address_shares(address_id);
CREATE INDEX IF NOT EXISTS idx_address_shares_shared_by ON address_shares(shared_by);
CREATE INDEX IF NOT EXISTS idx_address_shares_created_at ON address_shares(created_at);
CREATE INDEX IF NOT EXISTS idx_address_shares_method ON address_shares(share_method);

-- Enable RLS (Row Level Security)
ALTER TABLE address_shares ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own address shares" ON address_shares
  FOR SELECT USING (shared_by = auth.uid());

CREATE POLICY "Users can create address shares for their own addresses" ON address_shares
  FOR INSERT WITH CHECK (
    shared_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM kivro_addresses 
      WHERE id = address_shares.address_id 
      AND user_id = auth.uid()
    )
  );

-- Grant permissions
GRANT SELECT, INSERT ON address_shares TO authenticated;

-- Add comments
COMMENT ON TABLE address_shares IS 'Tracks when and how KIVRO addresses are shared';
COMMENT ON COLUMN address_shares.share_method IS 'Method used to share: email, sms, whatsapp, link, social';
COMMENT ON COLUMN address_shares.message IS 'Optional personal message included with the share';
