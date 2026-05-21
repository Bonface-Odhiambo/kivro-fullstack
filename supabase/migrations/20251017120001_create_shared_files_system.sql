-- ============================================================================
-- SHARED FILES SYSTEM - File and Folder Sharing
-- ============================================================================

-- Create shared_files table
CREATE TABLE IF NOT EXISTS public.shared_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    share_id VARCHAR(50) UNIQUE NOT NULL, -- SHR001234
    
    -- Owner information
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    
    -- File/Folder details
    item_type VARCHAR(20) NOT NULL CHECK (item_type IN ('file', 'folder')),
    item_name VARCHAR(255) NOT NULL,
    file_path TEXT, -- Path in storage bucket
    file_size BIGINT, -- Size in bytes
    file_type VARCHAR(100), -- MIME type or folder
    thumbnail_url TEXT,
    
    -- Sharing details
    shared_with_user_ids UUID[], -- Array of user IDs
    shared_with_emails TEXT[], -- Array of email addresses
    share_type VARCHAR(20) DEFAULT 'private' CHECK (share_type IN ('private', 'link', 'public')),
    share_link VARCHAR(255) UNIQUE, -- Public share link
    share_password VARCHAR(255), -- Optional password protection
    
    -- Permissions
    can_view BOOLEAN DEFAULT true,
    can_download BOOLEAN DEFAULT true,
    can_edit BOOLEAN DEFAULT false,
    can_delete BOOLEAN DEFAULT false,
    
    -- Expiration
    expires_at TIMESTAMP WITH TIME ZONE,
    is_expired BOOLEAN DEFAULT false,
    
    -- Metadata
    description TEXT,
    tags TEXT[],
    download_count INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    is_archived BOOLEAN DEFAULT false,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_accessed_at TIMESTAMP WITH TIME ZONE
);

-- Create shared_file_access_log table
CREATE TABLE IF NOT EXISTS public.shared_file_access_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shared_file_id UUID REFERENCES public.shared_files(id) ON DELETE CASCADE NOT NULL,
    accessed_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    accessed_by_email VARCHAR(255),
    access_type VARCHAR(20) NOT NULL CHECK (access_type IN ('view', 'download', 'edit', 'delete')),
    ip_address INET,
    user_agent TEXT,
    accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create shared_folders table (for organizing shared items)
CREATE TABLE IF NOT EXISTS public.shared_folders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    folder_id VARCHAR(50) UNIQUE NOT NULL, -- FLD001234
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    folder_name VARCHAR(255) NOT NULL,
    parent_folder_id UUID REFERENCES public.shared_folders(id) ON DELETE CASCADE,
    description TEXT,
    color VARCHAR(50),
    icon VARCHAR(50),
    is_archived BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create share_invitations table
CREATE TABLE IF NOT EXISTS public.share_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shared_file_id UUID REFERENCES public.shared_files(id) ON DELETE CASCADE NOT NULL,
    invited_by_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    invited_email VARCHAR(255) NOT NULL,
    invitation_token VARCHAR(255) UNIQUE NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
    message TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    accepted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_shared_files_owner_id ON public.shared_files(owner_id);
CREATE INDEX IF NOT EXISTS idx_shared_files_share_type ON public.shared_files(share_type);
CREATE INDEX IF NOT EXISTS idx_shared_files_shared_with_user_ids ON public.shared_files USING GIN(shared_with_user_ids);
CREATE INDEX IF NOT EXISTS idx_shared_files_tags ON public.shared_files USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_shared_files_created_at ON public.shared_files(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_shared_file_access_log_file_id ON public.shared_file_access_log(shared_file_id);
CREATE INDEX IF NOT EXISTS idx_shared_folders_owner_id ON public.shared_folders(owner_id);
CREATE INDEX IF NOT EXISTS idx_share_invitations_email ON public.share_invitations(invited_email);

-- Create auto-increment sequences
CREATE SEQUENCE IF NOT EXISTS share_id_seq START 1;
CREATE SEQUENCE IF NOT EXISTS folder_id_seq START 1;

-- Create function to generate share ID
CREATE OR REPLACE FUNCTION generate_share_id()
RETURNS TRIGGER AS $$
BEGIN
    NEW.share_id := 'SHR' || LPAD(nextval('share_id_seq')::TEXT, 6, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create function to generate folder ID
CREATE OR REPLACE FUNCTION generate_folder_id()
RETURNS TRIGGER AS $$
BEGIN
    NEW.folder_id := 'FLD' || LPAD(nextval('folder_id_seq')::TEXT, 6, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for auto-generating IDs
DROP TRIGGER IF EXISTS set_share_id ON public.shared_files;
CREATE TRIGGER set_share_id
    BEFORE INSERT ON public.shared_files
    FOR EACH ROW
    WHEN (NEW.share_id IS NULL OR NEW.share_id = '')
    EXECUTE FUNCTION generate_share_id();

DROP TRIGGER IF EXISTS set_folder_id ON public.shared_folders;
CREATE TRIGGER set_folder_id
    BEFORE INSERT ON public.shared_folders
    FOR EACH ROW
    WHEN (NEW.folder_id IS NULL OR NEW.folder_id = '')
    EXECUTE FUNCTION generate_folder_id();

-- Create function to check and update expiration status
CREATE OR REPLACE FUNCTION check_file_expiration()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.expires_at IS NOT NULL AND NEW.expires_at < NOW() THEN
        NEW.is_expired := true;
    ELSE
        NEW.is_expired := false;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to check expiration on insert/update
DROP TRIGGER IF EXISTS check_shared_file_expiration ON public.shared_files;
CREATE TRIGGER check_shared_file_expiration
    BEFORE INSERT OR UPDATE ON public.shared_files
    FOR EACH ROW
    EXECUTE FUNCTION check_file_expiration();

-- Create updated_at triggers
CREATE TRIGGER update_shared_files_updated_at
    BEFORE UPDATE ON public.shared_files
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_shared_folders_updated_at
    BEFORE UPDATE ON public.shared_folders
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Enable RLS
ALTER TABLE public.shared_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_file_access_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.share_invitations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for shared_files
DROP POLICY IF EXISTS "Users can view their own shared files" ON public.shared_files;
CREATE POLICY "Users can view their own shared files"
    ON public.shared_files FOR SELECT
    USING (auth.uid() = owner_id OR auth.uid() = ANY(shared_with_user_ids));

DROP POLICY IF EXISTS "Users can insert their own shared files" ON public.shared_files;
CREATE POLICY "Users can insert their own shared files"
    ON public.shared_files FOR INSERT
    WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can update their own shared files" ON public.shared_files;
CREATE POLICY "Users can update their own shared files"
    ON public.shared_files FOR UPDATE
    USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can delete their own shared files" ON public.shared_files;
CREATE POLICY "Users can delete their own shared files"
    ON public.shared_files FOR DELETE
    USING (auth.uid() = owner_id);

-- RLS Policies for access logs
DROP POLICY IF EXISTS "Users can view access logs for their files" ON public.shared_file_access_log;
CREATE POLICY "Users can view access logs for their files"
    ON public.shared_file_access_log FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.shared_files 
            WHERE id = shared_file_id AND owner_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Anyone can insert access logs" ON public.shared_file_access_log;
CREATE POLICY "Anyone can insert access logs"
    ON public.shared_file_access_log FOR INSERT
    WITH CHECK (true);

-- RLS Policies for folders
DROP POLICY IF EXISTS "Users can view their own folders" ON public.shared_folders;
CREATE POLICY "Users can view their own folders"
    ON public.shared_folders FOR SELECT
    USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can manage their own folders" ON public.shared_folders;
CREATE POLICY "Users can manage their own folders"
    ON public.shared_folders FOR ALL
    USING (auth.uid() = owner_id);

-- RLS Policies for invitations
DROP POLICY IF EXISTS "Users can view invitations they sent or received" ON public.share_invitations;
CREATE POLICY "Users can view invitations they sent or received"
    ON public.share_invitations FOR SELECT
    USING (auth.uid() = invited_by_user_id OR auth.jwt()->>'email' = invited_email);

DROP POLICY IF EXISTS "Users can create invitations for their files" ON public.share_invitations;
CREATE POLICY "Users can create invitations for their files"
    ON public.share_invitations FOR INSERT
    WITH CHECK (auth.uid() = invited_by_user_id);

-- ============================================================================
-- INSERT SAMPLE DATA
-- ============================================================================

-- Note: Sample shared files will be inserted after user authentication
-- The following is a template for inserting sample shared files:
/*
INSERT INTO public.shared_files (
    owner_id,
    item_type,
    item_name,
    file_type,
    file_size,
    shared_with_user_ids,
    share_type,
    can_view,
    can_download,
    tags
) VALUES (
    'USER_ID_HERE',
    'file',
    'Tax Documents 2025.pdf',
    'application/pdf',
    2048576,
    ARRAY['OTHER_USER_ID']::UUID[],
    'private',
    true,
    true,
    ARRAY['tax', 'documents', '2025']
);
*/

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to get user's sharing statistics
CREATE OR REPLACE FUNCTION get_user_sharing_stats(p_user_id UUID)
RETURNS TABLE (
    total_shared BIGINT,
    shared_by_me BIGINT,
    shared_with_me BIGINT,
    total_downloads BIGINT,
    total_views BIGINT,
    active_shares BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::BIGINT as total_shared,
        COUNT(*) FILTER (WHERE owner_id = p_user_id)::BIGINT as shared_by_me,
        COUNT(*) FILTER (WHERE p_user_id = ANY(shared_with_user_ids))::BIGINT as shared_with_me,
        COALESCE(SUM(download_count), 0)::BIGINT as total_downloads,
        COALESCE(SUM(view_count), 0)::BIGINT as total_views,
        COUNT(*) FILTER (WHERE is_active = true AND (expires_at IS NULL OR expires_at > NOW()))::BIGINT as active_shares
    FROM public.shared_files
    WHERE owner_id = p_user_id OR p_user_id = ANY(shared_with_user_ids);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;               

-- Function to log file access
CREATE OR REPLACE FUNCTION log_file_access(
    p_shared_file_id UUID,
    p_access_type VARCHAR,
    p_user_id UUID DEFAULT NULL,
    p_email VARCHAR DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO public.shared_file_access_log (
        shared_file_id,
        accessed_by_user_id,
        accessed_by_email,
        access_type,
        ip_address
    ) VALUES (
        p_shared_file_id,
        p_user_id,
        p_email,
        p_access_type,
        inet_client_addr()
    );
    
    -- Update counters
    IF p_access_type = 'view' THEN
        UPDATE public.shared_files 
        SET view_count = view_count + 1, last_accessed_at = NOW()
        WHERE id = p_shared_file_id;
    ELSIF p_access_type = 'download' THEN
        UPDATE public.shared_files 
        SET download_count = download_count + 1, last_accessed_at = NOW()
        WHERE id = p_shared_file_id;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to generate share link
CREATE OR REPLACE FUNCTION generate_share_link(p_shared_file_id UUID)
RETURNS TEXT AS $$
DECLARE
    v_token TEXT;
BEGIN
    v_token := encode(gen_random_bytes(32), 'base64');
    v_token := replace(replace(replace(v_token, '+', '-'), '/', '_'), '=', '');
    
    UPDATE public.shared_files
    SET share_link = v_token
    WHERE id = p_shared_file_id AND owner_id = auth.uid();
    
    RETURN v_token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_user_sharing_stats(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION log_file_access(UUID, VARCHAR, UUID, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION generate_share_link(UUID) TO authenticated;

COMMENT ON TABLE public.shared_files IS 'Stores shared files and folders';
COMMENT ON TABLE public.shared_file_access_log IS 'Logs all access to shared files';
COMMENT ON TABLE public.shared_folders IS 'Organizes shared items into folders';
COMMENT ON TABLE public.share_invitations IS 'Manages file sharing invitations';
