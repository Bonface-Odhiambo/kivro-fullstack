-- ============================================================================
-- Enhanced Message Logging System for KIVRO Inbox
-- Migration: 20251017000000_enhanced_message_logging.sql
-- ============================================================================
-- This migration adds enhanced logging capabilities and helper functions
-- for bulk message insertion and better message management

-- ============================================================================
-- 1. Create message_logs table for tracking message delivery and status
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.message_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    message_id UUID REFERENCES public.user_inbox(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    
    -- Log details
    log_type VARCHAR(50) NOT NULL, -- 'created', 'delivered', 'read', 'archived', 'deleted', 'failed'
    log_message TEXT,
    log_data JSONB, -- Additional log metadata
    
    -- System tracking
    ip_address VARCHAR(45), -- IPv4 or IPv6
    user_agent TEXT,
    device_info JSONB,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for message_logs
CREATE INDEX IF NOT EXISTS idx_message_logs_message_id ON public.message_logs(message_id);
CREATE INDEX IF NOT EXISTS idx_message_logs_user_id ON public.message_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_message_logs_log_type ON public.message_logs(log_type);
CREATE INDEX IF NOT EXISTS idx_message_logs_created_at ON public.message_logs(created_at DESC);

-- Enable RLS for message_logs
ALTER TABLE public.message_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for message_logs
CREATE POLICY "Users can view own message logs" ON public.message_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all message logs" ON public.message_logs
    FOR ALL USING (auth.role() = 'service_role');

-- ============================================================================
-- 2. Create message_templates table for reusable message templates
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.message_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    template_name VARCHAR(100) NOT NULL UNIQUE,
    template_code VARCHAR(50) NOT NULL UNIQUE,
    
    -- Template content
    subject_template TEXT NOT NULL,
    body_template TEXT NOT NULL,
    
    -- Template metadata
    category_id UUID REFERENCES public.message_categories(id) ON DELETE SET NULL,
    message_type VARCHAR(50) DEFAULT 'notification',
    priority VARCHAR(20) DEFAULT 'normal',
    
    -- Template variables (for dynamic content)
    required_variables JSONB, -- Array of required variable names
    default_metadata JSONB, -- Default metadata structure
    
    -- Sender association
    sender_type VARCHAR(20) CHECK (sender_type IN ('government', 'company', 'system')),
    government_sender_id UUID REFERENCES public.government_senders(id) ON DELETE SET NULL,
    company_sender_id UUID REFERENCES public.company_senders(id) ON DELETE SET NULL,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for message_templates
CREATE INDEX IF NOT EXISTS idx_message_templates_code ON public.message_templates(template_code);
CREATE INDEX IF NOT EXISTS idx_message_templates_category ON public.message_templates(category_id);
CREATE INDEX IF NOT EXISTS idx_message_templates_sender_type ON public.message_templates(sender_type);

-- Enable RLS for message_templates
ALTER TABLE public.message_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for message_templates
CREATE POLICY "Anyone can read active templates" ON public.message_templates
    FOR SELECT USING (is_active = true);

CREATE POLICY "Service role can manage templates" ON public.message_templates
    FOR ALL USING (auth.role() = 'service_role');

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS handle_message_templates_updated_at ON public.message_templates;
CREATE TRIGGER handle_message_templates_updated_at
    BEFORE UPDATE ON public.message_templates
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- 3. Create function to log message events
-- ============================================================================
CREATE OR REPLACE FUNCTION public.log_message_event(
    p_message_id UUID,
    p_user_id UUID,
    p_log_type VARCHAR(50),
    p_log_message TEXT DEFAULT NULL,
    p_log_data JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_log_id UUID;
BEGIN
    INSERT INTO public.message_logs (
        message_id,
        user_id,
        log_type,
        log_message,
        log_data
    )
    VALUES (
        p_message_id,
        p_user_id,
        p_log_type,
        p_log_message,
        p_log_data
    )
    RETURNING id INTO v_log_id;
    
    RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 4. Create function to send bulk messages
-- ============================================================================
CREATE OR REPLACE FUNCTION public.send_bulk_messages(
    p_user_ids UUID[],
    p_sender_id UUID DEFAULT NULL,
    p_company_sender_id UUID DEFAULT NULL,
    p_sender_type VARCHAR(20) DEFAULT 'government',
    p_category_id UUID DEFAULT NULL,
    p_subject TEXT DEFAULT NULL,
    p_message_body TEXT DEFAULT NULL,
    p_message_type VARCHAR(50) DEFAULT 'notification',
    p_priority VARCHAR(20) DEFAULT 'normal',
    p_reference_prefix VARCHAR(50) DEFAULT 'BULK',
    p_metadata JSONB DEFAULT NULL
)
RETURNS TABLE(message_id UUID, user_id UUID, success BOOLEAN, error_message TEXT) AS $$
DECLARE
    v_user_id UUID;
    v_message_id UUID;
    v_reference_number VARCHAR(100);
    v_counter INTEGER := 0;
BEGIN
    -- Loop through each user and create a message
    FOREACH v_user_id IN ARRAY p_user_ids
    LOOP
        BEGIN
            v_counter := v_counter + 1;
            v_reference_number := p_reference_prefix || '-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(v_counter::TEXT, 6, '0');
            
            INSERT INTO public.user_inbox (
                user_id,
                sender_id,
                company_sender_id,
                sender_type,
                category_id,
                subject,
                message_body,
                message_type,
                priority,
                reference_number,
                metadata
            )
            VALUES (
                v_user_id,
                p_sender_id,
                p_company_sender_id,
                p_sender_type,
                p_category_id,
                p_subject,
                p_message_body,
                p_message_type,
                p_priority,
                v_reference_number,
                p_metadata
            )
            RETURNING id INTO v_message_id;
            
            -- Log the message creation
            PERFORM public.log_message_event(
                v_message_id,
                v_user_id,
                'created',
                'Message created via bulk send',
                jsonb_build_object('bulk_send', true, 'reference', v_reference_number)
            );
            
            -- Return success
            message_id := v_message_id;
            user_id := v_user_id;
            success := true;
            error_message := NULL;
            RETURN NEXT;
            
        EXCEPTION WHEN OTHERS THEN
            -- Return failure
            message_id := NULL;
            user_id := v_user_id;
            success := false;
            error_message := SQLERRM;
            RETURN NEXT;
        END;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 5. Create function to send message from template
-- ============================================================================
CREATE OR REPLACE FUNCTION public.send_message_from_template(
    p_user_id UUID,
    p_template_code VARCHAR(50),
    p_variables JSONB DEFAULT '{}'::JSONB,
    p_metadata JSONB DEFAULT NULL,
    p_reference_number VARCHAR(100) DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_template RECORD;
    v_message_id UUID;
    v_subject TEXT;
    v_body TEXT;
    v_key TEXT;
    v_value TEXT;
BEGIN
    -- Get template
    SELECT * INTO v_template
    FROM public.message_templates
    WHERE template_code = p_template_code AND is_active = true
    LIMIT 1;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Template not found or inactive: %', p_template_code;
    END IF;
    
    -- Replace variables in subject and body
    v_subject := v_template.subject_template;
    v_body := v_template.body_template;
    
    FOR v_key, v_value IN SELECT * FROM jsonb_each_text(p_variables)
    LOOP
        v_subject := REPLACE(v_subject, '{{' || v_key || '}}', v_value);
        v_body := REPLACE(v_body, '{{' || v_key || '}}', v_value);
    END LOOP;
    
    -- Merge metadata
    v_metadata := COALESCE(v_template.default_metadata, '{}'::JSONB) || COALESCE(p_metadata, '{}'::JSONB);
    
    -- Insert message
    INSERT INTO public.user_inbox (
        user_id,
        sender_id,
        company_sender_id,
        sender_type,
        category_id,
        subject,
        message_body,
        message_type,
        priority,
        reference_number,
        metadata
    )
    VALUES (
        p_user_id,
        v_template.government_sender_id,
        v_template.company_sender_id,
        v_template.sender_type,
        v_template.category_id,
        v_subject,
        v_body,
        v_template.message_type,
        v_template.priority,
        COALESCE(p_reference_number, 'TPL-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(FLOOR(RANDOM() * 999999)::TEXT, 6, '0')),
        v_metadata
    )
    RETURNING id INTO v_message_id;
    
    -- Log the message creation
    PERFORM public.log_message_event(
        v_message_id,
        p_user_id,
        'created',
        'Message created from template: ' || p_template_code,
        jsonb_build_object('template_code', p_template_code, 'variables', p_variables)
    );
    
    RETURN v_message_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 6. Create function to get message statistics
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_message_statistics(p_user_id UUID)
RETURNS TABLE(
    total_messages BIGINT,
    unread_messages BIGINT,
    read_messages BIGINT,
    archived_messages BIGINT,
    starred_messages BIGINT,
    government_messages BIGINT,
    company_messages BIGINT,
    urgent_messages BIGINT,
    messages_this_week BIGINT,
    messages_this_month BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*)::BIGINT as total_messages,
        COUNT(*) FILTER (WHERE is_read = false)::BIGINT as unread_messages,
        COUNT(*) FILTER (WHERE is_read = true)::BIGINT as read_messages,
        COUNT(*) FILTER (WHERE is_archived = true)::BIGINT as archived_messages,
        COUNT(*) FILTER (WHERE is_starred = true)::BIGINT as starred_messages,
        COUNT(*) FILTER (WHERE sender_type = 'government')::BIGINT as government_messages,
        COUNT(*) FILTER (WHERE sender_type = 'company')::BIGINT as company_messages,
        COUNT(*) FILTER (WHERE priority = 'urgent')::BIGINT as urgent_messages,
        COUNT(*) FILTER (WHERE sent_at >= NOW() - INTERVAL '7 days')::BIGINT as messages_this_week,
        COUNT(*) FILTER (WHERE sent_at >= NOW() - INTERVAL '30 days')::BIGINT as messages_this_month
    FROM public.user_inbox
    WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 7. Create trigger to automatically log message reads
-- ============================================================================
CREATE OR REPLACE FUNCTION public.auto_log_message_read()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_read = true AND OLD.is_read = false THEN
        PERFORM public.log_message_event(
            NEW.id,
            NEW.user_id,
            'read',
            'Message marked as read',
            jsonb_build_object('read_at', NEW.read_at)
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_auto_log_message_read ON public.user_inbox;
CREATE TRIGGER trigger_auto_log_message_read
    AFTER UPDATE ON public.user_inbox
    FOR EACH ROW
    WHEN (NEW.is_read IS DISTINCT FROM OLD.is_read)
    EXECUTE FUNCTION public.auto_log_message_read();

-- ============================================================================
-- 8. Add comments for documentation
-- ============================================================================
COMMENT ON TABLE public.message_logs IS 'Logs all message-related events for auditing and analytics';
COMMENT ON TABLE public.message_templates IS 'Reusable message templates for consistent communication';
COMMENT ON FUNCTION public.log_message_event IS 'Logs a message event for auditing purposes';
COMMENT ON FUNCTION public.send_bulk_messages IS 'Sends the same message to multiple users efficiently';
COMMENT ON FUNCTION public.send_message_from_template IS 'Creates and sends a message using a predefined template';
COMMENT ON FUNCTION public.get_message_statistics IS 'Returns comprehensive message statistics for a user';

-- ============================================================================
-- Migration Complete!
-- ============================================================================
