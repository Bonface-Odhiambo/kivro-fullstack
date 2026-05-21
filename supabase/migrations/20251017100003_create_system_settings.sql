-- ============================================================================
-- System Settings Management
-- Creates tables for system configuration and settings
-- ============================================================================

-- Create system settings table
CREATE TABLE IF NOT EXISTS public.system_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key VARCHAR(255) UNIQUE NOT NULL,
    setting_value TEXT,
    setting_type VARCHAR(50) NOT NULL, -- string, number, boolean, json
    category VARCHAR(100) NOT NULL, -- general, email, notifications, security, api
    description TEXT,
    is_public BOOLEAN DEFAULT false, -- Can non-admins see this setting?
    is_editable BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create system health metrics table
CREATE TABLE IF NOT EXISTS public.system_health_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    component_name VARCHAR(100) NOT NULL,
    metric_name VARCHAR(100) NOT NULL,
    metric_value VARCHAR(255),
    status VARCHAR(20) DEFAULT 'healthy',
    -- Status: healthy, warning, critical, unknown
    uptime_percentage DECIMAL(5, 2),
    last_check_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT valid_health_status CHECK (status IN ('healthy', 'warning', 'critical', 'unknown'))
);

-- Create system logs table
CREATE TABLE IF NOT EXISTS public.system_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    log_level VARCHAR(20) NOT NULL, -- info, warning, error, critical
    component VARCHAR(100),
    message TEXT NOT NULL,
    details JSONB,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    ip_address INET,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT valid_log_level CHECK (log_level IN ('info', 'warning', 'error', 'critical'))
);

-- Create API keys table (for external integrations)
CREATE TABLE IF NOT EXISTS public.api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key_name VARCHAR(255) NOT NULL,
    api_key VARCHAR(255) UNIQUE NOT NULL,
    service_name VARCHAR(100), -- what3words, mpesa, twilio, etc.
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMPTZ,
    last_used_at TIMESTAMPTZ,
    usage_count INTEGER DEFAULT 0,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create notification templates table
CREATE TABLE IF NOT EXISTS public.notification_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_name VARCHAR(255) UNIQUE NOT NULL,
    template_type VARCHAR(50) NOT NULL, -- email, sms, push
    subject VARCHAR(255),
    body_template TEXT NOT NULL,
    variables JSONB, -- Available template variables
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_system_settings_category ON public.system_settings(category);
CREATE INDEX idx_system_settings_key ON public.system_settings(setting_key);
CREATE INDEX idx_system_health_component ON public.system_health_metrics(component_name);
CREATE INDEX idx_system_health_status ON public.system_health_metrics(status);
CREATE INDEX idx_system_logs_level ON public.system_logs(log_level);
CREATE INDEX idx_system_logs_created ON public.system_logs(created_at);
CREATE INDEX idx_api_keys_service ON public.api_keys(service_name);
CREATE INDEX idx_api_keys_active ON public.api_keys(is_active);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION update_system_settings_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER trigger_update_system_settings_timestamp
    BEFORE UPDATE ON public.system_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_system_settings_timestamp();

CREATE TRIGGER trigger_update_api_keys_timestamp
    BEFORE UPDATE ON public.api_keys
    FOR EACH ROW
    EXECUTE FUNCTION update_system_settings_timestamp();

-- Enable Row Level Security
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_health_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Only admins can access system settings
CREATE POLICY "Admins can view all settings"
    ON public.system_settings FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.user_type = 'admin'
        )
    );

CREATE POLICY "Admins can manage settings"
    ON public.system_settings FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.user_type = 'admin'
        )
    );

CREATE POLICY "Admins can view health metrics"
    ON public.system_health_metrics FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.user_type = 'admin'
        )
    );

CREATE POLICY "System can insert health metrics"
    ON public.system_health_metrics FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Admins can view system logs"
    ON public.system_logs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.user_type = 'admin'
        )
    );

CREATE POLICY "System can insert logs"
    ON public.system_logs FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Admins can view API keys"
    ON public.api_keys FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.user_type = 'admin'
        )
    );

CREATE POLICY "Admins can manage API keys"
    ON public.api_keys FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.user_type = 'admin'
        )
    );

-- Insert default system settings
INSERT INTO public.system_settings (setting_key, setting_value, setting_type, category, description, is_public) VALUES
-- General Settings
('site_name', 'KIVRO', 'string', 'general', 'Application name', true),
('site_url', 'https://kivro.africa', 'string', 'general', 'Main site URL', true),
('support_email', 'support@kivro.africa', 'string', 'general', 'Support contact email', true),
('support_phone', '+252612345678', 'string', 'general', 'Support contact phone', true),
('maintenance_mode', 'false', 'boolean', 'general', 'Enable maintenance mode', false),

-- Email Settings
('email_host', 'send.one.com', 'string', 'email', 'SMTP host', false),
('email_port', '587', 'number', 'email', 'SMTP port', false),
('email_from', 'noreply@kivro.africa', 'string', 'email', 'From email address', false),
('email_enabled', 'true', 'boolean', 'email', 'Enable email notifications', false),

-- Notification Settings
('notifications_enabled', 'true', 'boolean', 'notifications', 'Enable notifications', false),
('sms_enabled', 'true', 'boolean', 'notifications', 'Enable SMS notifications', false),
('push_enabled', 'false', 'boolean', 'notifications', 'Enable push notifications', false),

-- Security Settings
('max_login_attempts', '5', 'number', 'security', 'Maximum login attempts before lockout', false),
('session_timeout', '3600', 'number', 'security', 'Session timeout in seconds', false),
('password_min_length', '6', 'number', 'security', 'Minimum password length', false),
('two_factor_enabled', 'false', 'boolean', 'security', 'Enable two-factor authentication', false),

-- API Settings
('api_rate_limit', '100', 'number', 'api', 'API rate limit per 15 minutes', false),
('api_timeout', '30', 'number', 'api', 'API timeout in seconds', false);

-- Insert system health metrics
INSERT INTO public.system_health_metrics (component_name, metric_name, metric_value, status, uptime_percentage) VALUES
('Database', 'Connection Status', 'Connected', 'healthy', 99.8),
('API Gateway', 'Response Time', '245ms', 'healthy', 99.9),
('Email Service', 'Delivery Rate', '98.5%', 'healthy', 98.5),
('SMS Service', 'Delivery Rate', '97.2%', 'healthy', 97.2),
('Storage', 'Available Space', '85%', 'healthy', 100.0),
('Backup System', 'Last Backup', '2 hours ago', 'healthy', 99.5);

-- Insert notification templates
INSERT INTO public.notification_templates (template_name, template_type, subject, body_template, variables) VALUES
('welcome_email', 'email', 'Welcome to KIVRO!', 
 'Hello {{name}},\n\nWelcome to KIVRO! Your account has been created successfully.\n\nBest regards,\nKIVRO Team',
 '{"name": "User full name"}'::jsonb),
 
('password_reset', 'email', 'Reset Your Password',
 'Hello {{name}},\n\nClick the link below to reset your password:\n{{reset_link}}\n\nThis link expires in 1 hour.',
 '{"name": "User full name", "reset_link": "Password reset URL"}'::jsonb),
 
('package_delivered', 'sms', NULL,
 'Your package {{package_id}} has been delivered. Track at: {{tracking_url}}',
 '{"package_id": "Package ID", "tracking_url": "Tracking URL"}'::jsonb);

-- Grant permissions
GRANT SELECT, UPDATE ON public.system_settings TO authenticated;
GRANT SELECT ON public.system_health_metrics TO authenticated;
GRANT SELECT ON public.system_logs TO authenticated;
GRANT SELECT ON public.api_keys TO authenticated;
GRANT SELECT ON public.notification_templates TO authenticated;

COMMENT ON TABLE public.system_settings IS 'Stores system configuration settings';
COMMENT ON TABLE public.system_health_metrics IS 'Stores system health and performance metrics';
COMMENT ON TABLE public.system_logs IS 'Stores system activity logs';
COMMENT ON TABLE public.api_keys IS 'Stores API keys for external services';
COMMENT ON TABLE public.notification_templates IS 'Stores notification message templates';
