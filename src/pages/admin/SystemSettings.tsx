import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { API_ENDPOINTS } from '@/config/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Settings,
  Database,
  Mail,
  Bell,
  Shield,
  Globe,
  Server,
  Key,
  Palette,
  Clock,
  MapPin,
  DollarSign,
  Users,
  Package,
  Save,
  RefreshCw,
  Download,
  Upload,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

const systemConfig = {
  general: {
    systemName: 'KIVRO Address System',
    systemVersion: '2.1.4',
    timezone: 'Africa/Mogadishu',
    language: 'English',
    currency: 'USD',
    dateFormat: 'DD/MM/YYYY',
    maintenanceMode: false
  },
  email: {
    smtpHost: 'smtp.gmail.com',
    smtpPort: '587',
    smtpUsername: 'system@kivro.so',
    smtpPassword: '••••••••',
    fromEmail: 'noreply@kivro.so',
    fromName: 'KIVRO System',
    enableSSL: true
  },
  notifications: {
    emailNotifications: true,
    smsNotifications: true,
    pushNotifications: true,
    adminAlerts: true,
    userWelcomeEmail: true,
    packageStatusUpdates: true,
    paymentConfirmations: true
  },
  security: {
    sessionTimeout: '30',
    maxLoginAttempts: '5',
    passwordMinLength: '8',
    requireSpecialChars: true,
    enableTwoFactor: false,
    ipWhitelist: '',
    apiRateLimit: '1000'
  },
  payment: {
    mpesaConsumerKey: '••••••••••••••••',
    mpesaConsumerSecret: '••••••••••••••••',
    mpesaPasskey: '••••••••••••••••',
    mpesaShortcode: '174379',
    subscriptionPrice: '50',
    currency: 'KES',
    enablePayments: true
  },
  database: {
    host: 'localhost',
    port: '5432',
    name: 'kivro_db',
    username: 'kivro_user',
    maxConnections: '100',
    backupEnabled: true,
    backupFrequency: 'daily',
    retentionDays: '30'
  }
};


const getStatusColor = (status: string) => {
  switch (status) {
    case 'healthy': return 'bg-green-100 text-green-800';
    case 'warning': return 'bg-yellow-100 text-yellow-800';
    case 'error': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'healthy': return <CheckCircle className="h-4 w-4 text-green-600" />;
    case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
    case 'error': return <AlertTriangle className="h-4 w-4 text-red-600" />;
    default: return <Server className="h-4 w-4 text-gray-600" />;
  }
};

export default function SystemSettings() {
  const [activeTab, setActiveTab] = useState('general');
  const [config, setConfig] = useState(systemConfig);
  const [hasChanges, setHasChanges] = useState(false);
  const [systemHealth, setSystemHealth] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const authHeader = { Authorization: `Bearer ${session.access_token}` };

      const [settingsRes, healthRes] = await Promise.all([
        fetch(API_ENDPOINTS.SETTINGS.LIST, { headers: authHeader }),
        fetch(API_ENDPOINTS.SETTINGS.HEALTH_METRICS, { headers: authHeader }),
      ]);

      if (settingsRes.ok) {
        const { data: settings } = await settingsRes.json();
        if (settings?.length) {
          const merged = { ...systemConfig } as any;
          settings.forEach((s: any) => {
            const [section, key] = s.setting_key.split('.');
            if (section && key && merged[section] !== undefined) {
              merged[section] = { ...merged[section], [key]: s.setting_value };
            }
          });
          setConfig(merged);
        }
      }

      if (healthRes.ok) {
        const { data: metrics } = await healthRes.json();
        if (metrics?.length) {
          setSystemHealth(metrics.map((m: any) => ({
            component: m.component_name,
            status: m.status,
            uptime: m.metric_value ?? 'N/A',
            lastCheck: m.last_check_at ?? ''
          })));
        }
      }
    } catch {
      // silently fall back to default static data
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleConfigChange = (section: string, key: string, value: any) => {
    setConfig(prev => ({
      ...(prev as any),
      [section]: {
        ...((prev as any)[section]),
        [key]: value
      }
    } as typeof systemConfig));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const authHeader = { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` };

      const updates: Promise<Response>[] = [];
      (Object.keys(config) as Array<keyof typeof config>).forEach(section => {
        (Object.keys(config[section]) as string[]).forEach(key => {
          const settingKey = `${String(section)}.${String(key)}`;
          updates.push(
            fetch(API_ENDPOINTS.SETTINGS.UPDATE(settingKey), {
              method: 'PUT',
              headers: authHeader,
              body: JSON.stringify({ setting_value: String((config[section] as any)[key]) })
            })
          );
        });
      });
      await Promise.allSettled(updates);
      setHasChanges(false);
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'email', label: 'Email', icon: Mail },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'payment', label: 'Payment', icon: DollarSign },
    { id: 'database', label: 'Database', icon: Database }
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">System Settings</h1>
          <p className="text-muted-foreground mt-1">
            Configure system parameters and preferences
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button 
            onClick={handleSave}
            disabled={!hasChanges || saving}
            className="bg-primary hover:bg-primary-dark"
          >
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </div>

      {/* System Health Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5 text-primary" />
            System Health Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {systemHealth.map((component, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  {getStatusIcon(component.status)}
                  <div>
                    <p className="font-medium text-sm">{component.component}</p>
                    <p className="text-xs text-muted-foreground">Uptime: {component.uptime}</p>
                  </div>
                </div>
                <Badge className={getStatusColor(component.status)}>
                  {component.status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Settings Navigation */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Settings Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                    activeTab === tab.id
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-muted'
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  <span className="text-sm">{tab.label}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Settings Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* General Settings */}
          {activeTab === 'general' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-primary" />
                  General Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="systemName">System Name</Label>
                    <Input
                      id="systemName"
                      value={config.general.systemName}
                      onChange={(e) => handleConfigChange('general', 'systemName', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="systemVersion">System Version</Label>
                    <Input
                      id="systemVersion"
                      value={config.general.systemVersion}
                      disabled
                    />
                  </div>
                  <div>
                    <Label htmlFor="timezone">Timezone</Label>
                    <select
                      id="timezone"
                      value={config.general.timezone}
                      onChange={(e) => handleConfigChange('general', 'timezone', e.target.value)}
                      className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
                    >
                      <option value="Africa/Mogadishu">Africa/Mogadishu</option>
                      <option value="UTC">UTC</option>
                      <option value="America/New_York">America/New_York</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="language">Language</Label>
                    <select
                      id="language"
                      value={config.general.language}
                      onChange={(e) => handleConfigChange('general', 'language', e.target.value)}
                      className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
                    >
                      <option value="English">English</option>
                      <option value="Somali">Somali</option>
                      <option value="Arabic">Arabic</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="currency">Currency</Label>
                    <select
                      id="currency"
                      value={config.general.currency}
                      onChange={(e) => handleConfigChange('general', 'currency', e.target.value)}
                      className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
                    >
                      <option value="USD">USD</option>
                      <option value="KES">KES</option>
                      <option value="SOS">SOS</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="dateFormat">Date Format</Label>
                    <select
                      id="dateFormat"
                      value={config.general.dateFormat}
                      onChange={(e) => handleConfigChange('general', 'dateFormat', e.target.value)}
                      className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
                    >
                      <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                      <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                      <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                    </select>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="maintenanceMode"
                    checked={config.general.maintenanceMode}
                    onCheckedChange={(checked) => handleConfigChange('general', 'maintenanceMode', checked)}
                  />
                  <Label htmlFor="maintenanceMode">Maintenance Mode</Label>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Email Settings */}
          {activeTab === 'email' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5 text-primary" />
                  Email Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="smtpHost">SMTP Host</Label>
                    <Input
                      id="smtpHost"
                      value={config.email.smtpHost}
                      onChange={(e) => handleConfigChange('email', 'smtpHost', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="smtpPort">SMTP Port</Label>
                    <Input
                      id="smtpPort"
                      value={config.email.smtpPort}
                      onChange={(e) => handleConfigChange('email', 'smtpPort', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="smtpUsername">SMTP Username</Label>
                    <Input
                      id="smtpUsername"
                      value={config.email.smtpUsername}
                      onChange={(e) => handleConfigChange('email', 'smtpUsername', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="smtpPassword">SMTP Password</Label>
                    <Input
                      id="smtpPassword"
                      type="password"
                      value={config.email.smtpPassword}
                      onChange={(e) => handleConfigChange('email', 'smtpPassword', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="fromEmail">From Email</Label>
                    <Input
                      id="fromEmail"
                      value={config.email.fromEmail}
                      onChange={(e) => handleConfigChange('email', 'fromEmail', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="fromName">From Name</Label>
                    <Input
                      id="fromName"
                      value={config.email.fromName}
                      onChange={(e) => handleConfigChange('email', 'fromName', e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="enableSSL"
                    checked={config.email.enableSSL}
                    onCheckedChange={(checked) => handleConfigChange('email', 'enableSSL', checked)}
                  />
                  <Label htmlFor="enableSSL">Enable SSL/TLS</Label>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notification Settings */}
          {activeTab === 'notifications' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-primary" />
                  Notification Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  {Object.entries(config.notifications).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between">
                      <Label htmlFor={key} className="text-sm font-medium">
                        {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      </Label>
                      <Switch
                        id={key}
                        checked={value}
                        onCheckedChange={(checked) => handleConfigChange('notifications', key, checked)}
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Security Settings */}
          {activeTab === 'security' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  Security Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                    <Input
                      id="sessionTimeout"
                      type="number"
                      value={config.security.sessionTimeout}
                      onChange={(e) => handleConfigChange('security', 'sessionTimeout', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="maxLoginAttempts">Max Login Attempts</Label>
                    <Input
                      id="maxLoginAttempts"
                      type="number"
                      value={config.security.maxLoginAttempts}
                      onChange={(e) => handleConfigChange('security', 'maxLoginAttempts', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="passwordMinLength">Password Min Length</Label>
                    <Input
                      id="passwordMinLength"
                      type="number"
                      value={config.security.passwordMinLength}
                      onChange={(e) => handleConfigChange('security', 'passwordMinLength', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="apiRateLimit">API Rate Limit (per hour)</Label>
                    <Input
                      id="apiRateLimit"
                      type="number"
                      value={config.security.apiRateLimit}
                      onChange={(e) => handleConfigChange('security', 'apiRateLimit', e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="ipWhitelist">IP Whitelist (comma separated)</Label>
                  <Input
                    id="ipWhitelist"
                    value={config.security.ipWhitelist}
                    onChange={(e) => handleConfigChange('security', 'ipWhitelist', e.target.value)}
                    placeholder="192.168.1.1, 10.0.0.1"
                  />
                </div>
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="requireSpecialChars"
                      checked={config.security.requireSpecialChars}
                      onCheckedChange={(checked) => handleConfigChange('security', 'requireSpecialChars', checked)}
                    />
                    <Label htmlFor="requireSpecialChars">Require Special Characters in Passwords</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="enableTwoFactor"
                      checked={config.security.enableTwoFactor}
                      onCheckedChange={(checked) => handleConfigChange('security', 'enableTwoFactor', checked)}
                    />
                    <Label htmlFor="enableTwoFactor">Enable Two-Factor Authentication</Label>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Payment Settings */}
          {activeTab === 'payment' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-primary" />
                  Payment Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="mpesaConsumerKey">M-Pesa Consumer Key</Label>
                    <Input
                      id="mpesaConsumerKey"
                      type="password"
                      value={config.payment.mpesaConsumerKey}
                      onChange={(e) => handleConfigChange('payment', 'mpesaConsumerKey', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="mpesaConsumerSecret">M-Pesa Consumer Secret</Label>
                    <Input
                      id="mpesaConsumerSecret"
                      type="password"
                      value={config.payment.mpesaConsumerSecret}
                      onChange={(e) => handleConfigChange('payment', 'mpesaConsumerSecret', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="mpesaPasskey">M-Pesa Passkey</Label>
                    <Input
                      id="mpesaPasskey"
                      type="password"
                      value={config.payment.mpesaPasskey}
                      onChange={(e) => handleConfigChange('payment', 'mpesaPasskey', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="mpesaShortcode">M-Pesa Shortcode</Label>
                    <Input
                      id="mpesaShortcode"
                      value={config.payment.mpesaShortcode}
                      onChange={(e) => handleConfigChange('payment', 'mpesaShortcode', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="subscriptionPrice">Subscription Price</Label>
                    <Input
                      id="subscriptionPrice"
                      type="number"
                      value={config.payment.subscriptionPrice}
                      onChange={(e) => handleConfigChange('payment', 'subscriptionPrice', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="paymentCurrency">Currency</Label>
                    <select
                      id="paymentCurrency"
                      value={config.payment.currency}
                      onChange={(e) => handleConfigChange('payment', 'currency', e.target.value)}
                      className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
                    >
                      <option value="KES">KES</option>
                      <option value="USD">USD</option>
                      <option value="SOS">SOS</option>
                    </select>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="enablePayments"
                    checked={config.payment.enablePayments}
                    onCheckedChange={(checked) => handleConfigChange('payment', 'enablePayments', checked)}
                  />
                  <Label htmlFor="enablePayments">Enable Payment Processing</Label>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Database Settings */}
          {activeTab === 'database' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5 text-primary" />
                  Database Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="dbHost">Database Host</Label>
                    <Input
                      id="dbHost"
                      value={config.database.host}
                      onChange={(e) => handleConfigChange('database', 'host', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="dbPort">Database Port</Label>
                    <Input
                      id="dbPort"
                      value={config.database.port}
                      onChange={(e) => handleConfigChange('database', 'port', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="dbName">Database Name</Label>
                    <Input
                      id="dbName"
                      value={config.database.name}
                      onChange={(e) => handleConfigChange('database', 'name', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="dbUsername">Database Username</Label>
                    <Input
                      id="dbUsername"
                      value={config.database.username}
                      onChange={(e) => handleConfigChange('database', 'username', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="maxConnections">Max Connections</Label>
                    <Input
                      id="maxConnections"
                      type="number"
                      value={config.database.maxConnections}
                      onChange={(e) => handleConfigChange('database', 'maxConnections', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="retentionDays">Backup Retention (days)</Label>
                    <Input
                      id="retentionDays"
                      type="number"
                      value={config.database.retentionDays}
                      onChange={(e) => handleConfigChange('database', 'retentionDays', e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="backupFrequency">Backup Frequency</Label>
                  <select
                    id="backupFrequency"
                    value={config.database.backupFrequency}
                    onChange={(e) => handleConfigChange('database', 'backupFrequency', e.target.value)}
                    className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
                  >
                    <option value="hourly">Hourly</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                  </select>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="backupEnabled"
                    checked={config.database.backupEnabled}
                    onCheckedChange={(checked) => handleConfigChange('database', 'backupEnabled', checked)}
                  />
                  <Label htmlFor="backupEnabled">Enable Automatic Backups</Label>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
