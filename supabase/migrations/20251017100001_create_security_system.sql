-- ============================================================================
-- Security Center System
-- Creates tables for security logging, alerts, and monitoring
-- ============================================================================

-- Create security alerts table
CREATE TABLE IF NOT EXISTS public.security_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alert_id VARCHAR(50) UNIQUE NOT NULL, -- SEC001
    type VARCHAR(100) NOT NULL,
    -- Types: failed_login, suspicious_activity, unauthorized_access, data_breach, sql_injection, xss_attempt, brute_force, ddos_attempt
    severity VARCHAR(20) NOT NULL DEFAULT 'medium',
    -- Severity: low, medium, high, critical
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    -- Status: active, investigating, resolved, false_positive
    
    -- Alert details
    title VARCHAR(255) NOT NULL,
    description TEXT,
    ip_address INET,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    user_agent TEXT,
    endpoint VARCHAR(255),
    request_method VARCHAR(10),
    
    -- Location data
    country VARCHAR(100),
    city VARCHAR(100),
    
    -- Response
    action_taken VARCHAR(100), -- blocked, logged, alerted, quarantined
    resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    resolved_at TIMESTAMPTZ,
    resolution_notes TEXT,
    
    -- Timestamps
    detected_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Metadata
    metadata JSONB,
    
    CONSTRAINT valid_severity CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    CONSTRAINT valid_status CHECK (status IN ('active', 'investigating', 'resolved', 'false_positive'))
);

-- Create blocked IPs table
CREATE TABLE IF NOT EXISTS public.blocked_ips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ip_address INET NOT NULL UNIQUE,
    reason TEXT NOT NULL,
    blocked_at TIMESTAMPTZ DEFAULT NOW(),
    blocked_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    expires_at TIMESTAMPTZ,
    is_permanent BOOLEAN DEFAULT false,
    attempts_count INTEGER DEFAULT 1,
    last_attempt_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Metadata
    country VARCHAR(100),
    city VARCHAR(100),
    notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create audit logs table
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100),
    resource_id UUID,
    ip_address INET,
    user_agent TEXT,
    status VARCHAR(20), -- success, failure
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create system security status table
CREATE TABLE IF NOT EXISTS public.system_security_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    component_name VARCHAR(100) UNIQUE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    -- Status: active, inactive, warning, error
    uptime_percentage DECIMAL(5, 2),
    last_check_at TIMESTAMPTZ DEFAULT NOW(),
    last_updated_at TIMESTAMPTZ DEFAULT NOW(),
    details JSONB,
    
    CONSTRAINT valid_security_status CHECK (status IN ('active', 'inactive', 'warning', 'error', 'valid'))
);

-- Create indexes
CREATE INDEX idx_security_alerts_type ON public.security_alerts(type);
CREATE INDEX idx_security_alerts_severity ON public.security_alerts(severity);
CREATE INDEX idx_security_alerts_status ON public.security_alerts(status);
CREATE INDEX idx_security_alerts_detected_at ON public.security_alerts(detected_at);
CREATE INDEX idx_security_alerts_ip ON public.security_alerts(ip_address);
CREATE INDEX idx_blocked_ips_ip ON public.blocked_ips(ip_address);
CREATE INDEX idx_blocked_ips_expires ON public.blocked_ips(expires_at);
CREATE INDEX idx_audit_logs_user ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX idx_audit_logs_created ON public.audit_logs(created_at);

-- Create sequence for alert IDs
CREATE SEQUENCE IF NOT EXISTS security_alert_id_seq START 1;

-- Create function to auto-generate alert ID
CREATE OR REPLACE FUNCTION generate_security_alert_id()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.alert_id IS NULL THEN
        NEW.alert_id := 'SEC' || LPAD(NEXTVAL('security_alert_id_seq')::TEXT, 6, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-generating alert IDs
CREATE TRIGGER trigger_generate_security_alert_id
    BEFORE INSERT ON public.security_alerts
    FOR EACH ROW
    EXECUTE FUNCTION generate_security_alert_id();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION update_security_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updating timestamps
CREATE TRIGGER trigger_update_security_alert_timestamp
    BEFORE UPDATE ON public.security_alerts
    FOR EACH ROW
    EXECUTE FUNCTION update_security_timestamp();

CREATE TRIGGER trigger_update_blocked_ip_timestamp
    BEFORE UPDATE ON public.blocked_ips
    FOR EACH ROW
    EXECUTE FUNCTION update_security_timestamp();

-- Enable Row Level Security
ALTER TABLE public.security_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_ips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_security_status ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Only admins can access security data
CREATE POLICY "Only admins can view security alerts"
    ON public.security_alerts FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.user_type = 'admin'
        )
    );

CREATE POLICY "Only admins can manage security alerts"
    ON public.security_alerts FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.user_type = 'admin'
        )
    );

CREATE POLICY "Only admins can view blocked IPs"
    ON public.blocked_ips FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.user_type = 'admin'
        )
    );

CREATE POLICY "Only admins can manage blocked IPs"
    ON public.blocked_ips FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.user_type = 'admin'
        )
    );

CREATE POLICY "Only admins can view audit logs"
    ON public.audit_logs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.user_type = 'admin'
        )
    );

CREATE POLICY "System can insert audit logs"
    ON public.audit_logs FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Only admins can view system security status"
    ON public.system_security_status FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.user_type = 'admin'
        )
    );

-- Insert sample security alerts
INSERT INTO public.security_alerts (
    alert_id, type, severity, status, title, description, ip_address, action_taken, detected_at
) VALUES
('SEC000001', 'failed_login', 'high', 'active', 'Multiple Failed Login Attempts', 
 'User attempted to login 15 times with incorrect password', '198.51.100.23', 'blocked', NOW() - INTERVAL '2 hours'),
 
('SEC000002', 'suspicious_activity', 'critical', 'investigating', 'Unusual API Access Pattern', 
 'Detected abnormal API request pattern from IP address', '203.0.113.42', 'logged', NOW() - INTERVAL '1 hour'),
 
('SEC000003', 'unauthorized_access', 'high', 'resolved', 'Unauthorized Admin Panel Access Attempt', 
 'Non-admin user attempted to access admin panel', '192.0.2.100', 'blocked', NOW() - INTERVAL '3 hours'),
 
('SEC000004', 'sql_injection', 'critical', 'active', 'SQL Injection Attempt Detected', 
 'Malicious SQL code detected in request parameters', '198.51.100.45', 'blocked', NOW() - INTERVAL '30 minutes'),
 
('SEC000005', 'brute_force', 'high', 'investigating', 'Brute Force Attack on API', 
 'Multiple rapid requests detected from single IP', '203.0.113.67', 'rate_limited', NOW() - INTERVAL '15 minutes');

-- Insert sample blocked IPs
INSERT INTO public.blocked_ips (
    ip_address, reason, blocked_at, attempts_count, is_permanent
) VALUES
('198.51.100.23', 'SQL Injection Attempts', NOW() - INTERVAL '2 hours', 15, false),
('203.0.113.42', 'Brute Force Attack', NOW() - INTERVAL '1 hour', 25, false),
('192.0.2.100', 'Suspicious Activity', NOW() - INTERVAL '3 hours', 8, false),
('198.51.100.67', 'DDoS Attempt', NOW() - INTERVAL '4 hours', 50, true),
('203.0.113.89', 'Malware Distribution', NOW() - INTERVAL '5 hours', 12, true);

-- Insert system security status
INSERT INTO public.system_security_status (
    component_name, status, uptime_percentage, last_check_at
) VALUES
('Firewall Status', 'active', 99.8, NOW()),
('SSL Certificate', 'valid', 100.0, NOW()),
('Database Encryption', 'active', 99.9, NOW()),
('API Rate Limiting', 'active', 99.7, NOW()),
('Backup Systems', 'active', 98.5, NOW());

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON public.security_alerts TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.blocked_ips TO authenticated;
GRANT SELECT, INSERT ON public.audit_logs TO authenticated;
GRANT SELECT ON public.system_security_status TO authenticated;
GRANT USAGE ON SEQUENCE security_alert_id_seq TO authenticated;

COMMENT ON TABLE public.security_alerts IS 'Stores security alerts and incidents';
COMMENT ON TABLE public.blocked_ips IS 'Stores blocked IP addresses and reasons';
COMMENT ON TABLE public.audit_logs IS 'Stores audit trail of system actions';
COMMENT ON TABLE public.system_security_status IS 'Stores system security component status';
