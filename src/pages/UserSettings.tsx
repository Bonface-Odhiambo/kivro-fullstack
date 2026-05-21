import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Loader2, User, Bell, Lock, Globe, Save, Download, Trash2, Key, Plus, Copy, Eye, EyeOff, RefreshCw, AlertCircle, CheckCircle2, Share2, Gift } from 'lucide-react';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import {
  listApiKeys, createApiKey, revokeApiKey, maskKey, RATE_LIMITS,
  type ApiKey, type NewApiKeyResult
} from '@/lib/apiKeys';

interface UserProfile {
  full_name: string;
  phone_number: string;
  bio?: string;
  location?: string;
}

const UserSettings = () => {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [profileForm, setProfileForm] = useState({
    full_name: '',
    phone_number: '',
    bio: '',
    location: ''
  });
  const [notificationSettings, setNotificationSettings] = useState({
    email: false,
    sms: true,
    push: true
  });
  const [privacySettings, setPrivacySettings] = useState({
    publicProfile: false,
    showAddresses: true
  });
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
        return;
      }

      setUser(session.user);
      await fetchUserData(session.user.id);
    };

    checkUser();
  }, [navigate]);

  const fetchUserData = async (userId: string) => {
    try {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('display_name, phone_number, bio, location')
        .eq('user_id', userId)
        .single();

      if (profileData) {
        const data = profileData as any;
        setProfile({
          full_name: data.display_name || '',
          phone_number: data.phone_number || '',
          bio: data.bio || '',
          location: data.location || ''
        });
        setProfileForm({
          full_name: data.display_name || '',
          phone_number: data.phone_number || '',
          bio: data.bio || '',
          location: data.location || ''
        });
      }
    } catch (error) {
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfileUpdate = async () => {
    if (!user) return;

    setIsSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session');

      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/api/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          display_name: profileForm.full_name,
          phone_number: profileForm.phone_number,
          bio: profileForm.bio,
          location: profileForm.location
        })
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        toast({
          title: "Profile Updated",
          description: "Your profile has been updated successfully",
        });
        await fetchUserData(user.id);
      } else {
        throw new Error(data.message || 'Update failed');
      }
    } catch (error) {
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : 'Could not update profile',
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };


  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    );
  }

  const handleExportData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      toast({ title: 'Preparing export…', description: 'Gathering your data.' });

      // Fetch all user data in parallel
      const [profileRes, addressesRes, paymentsRes, keysRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('user_id', session.user.id).single(),
        supabase.from('kivro_addresses').select('*').eq('user_id', session.user.id),
        supabase.from('payments').select('*').eq('user_id', session.user.id),
        supabase.from('api_keys').select('id, name, key_prefix, plan, status, created_at').eq('user_id', session.user.id),
      ]);

      const exportData = {
        exported_at: new Date().toISOString(),
        user: { id: session.user.id, email: session.user.email },
        profile: profileRes.data,
        addresses: addressesRes.data ?? [],
        payments: paymentsRes.data ?? [],
        api_keys: keysRes.data ?? [],
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `kivro-data-export-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({ title: 'Export complete', description: 'Your data has been downloaded.' });
    } catch {
      toast({ title: 'Export failed', description: 'Please try again later.', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 w-full">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Settings</h1>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6 mb-4 sm:mb-6 h-auto">
          <TabsTrigger value="profile" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm py-2">
            <User className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Profile Information</span>
            <span className="sm:hidden">Profile</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm py-2">
            <Bell className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Notifications</span>
            <span className="sm:hidden">Notifs</span>
          </TabsTrigger>
          <TabsTrigger value="privacy" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm py-2">
            <Lock className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Privacy</span>
            <span className="sm:hidden">Privacy</span>
          </TabsTrigger>
          <TabsTrigger value="data" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm py-2">
            <Globe className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Data Management</span>
            <span className="sm:hidden">Data</span>
          </TabsTrigger>
          <TabsTrigger value="apikeys" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm py-2">
            <Key className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">API Keys</span>
            <span className="sm:hidden">API</span>
          </TabsTrigger>
          <TabsTrigger value="referrals" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm py-2">
            <Gift className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Referrals</span>
            <span className="sm:hidden">Ref</span>
          </TabsTrigger>
        </TabsList>

        {/* Profile Information Tab */}
        <TabsContent value="profile" className="space-y-4 sm:space-y-6">
          <Card>
            <CardContent className="pt-4 sm:pt-6">
              <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Profile Information</h3>
              
              <div className="space-y-3 sm:space-y-4">
                <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Full Name *</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="full_name"
                        value={profileForm.full_name}
                        onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
                        placeholder="Ahsan Jilani"
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone_number">Phone Number *</Label>
                    <Input
                      id="phone_number"
                      value={profileForm.phone_number}
                      onChange={(e) => setProfileForm({ ...profileForm, phone_number: e.target.value })}
                      placeholder="+252 61 234 5678"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={profileForm.location}
                    onChange={(e) => setProfileForm({ ...profileForm, location: e.target.value })}
                    placeholder="Near Burao Central Area Burao"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={profileForm.bio}
                    onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                    placeholder="Type here"
                    rows={4}
                  />
                </div>

                <Button 
                  onClick={handleProfileUpdate} 
                  disabled={isSaving}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Account Information */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold mb-4">Account Information</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Email:</span>
                  <span className="font-medium">{user?.email}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Account Created:</span>
                  <span className="font-medium">
                    {user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', {
                      month: '2-digit',
                      day: '2-digit',
                      year: 'numeric'
                    }) : 'N/A'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold mb-6">Notifications</h3>
              
              <div className="space-y-6">
                {/* Email Notifications */}
                <div className="flex items-center justify-between py-3">
                  <div>
                    <Label className="text-base font-medium">Email Notifications</Label>
                    <p className="text-sm text-gray-500">Receive notifications via email</p>
                  </div>
                  <Switch
                    checked={notificationSettings.email}
                    onCheckedChange={(checked) =>
                      setNotificationSettings({ ...notificationSettings, email: checked })
                    }
                  />
                </div>

                {/* SMS Notifications */}
                <div className="flex items-center justify-between py-3">
                  <div>
                    <Label className="text-base font-medium">SMS Notifications</Label>
                    <p className="text-sm text-gray-500">Receive notifications via SMS</p>
                  </div>
                  <Switch
                    checked={notificationSettings.sms}
                    onCheckedChange={(checked) =>
                      setNotificationSettings({ ...notificationSettings, sms: checked })
                    }
                  />
                </div>

                {/* Push Notifications */}
                <div className="flex items-center justify-between py-3">
                  <div>
                    <Label className="text-base font-medium">Push Notifications</Label>
                    <p className="text-sm text-gray-500">Receive push notifications</p>
                  </div>
                  <Switch
                    checked={notificationSettings.push}
                    onCheckedChange={(checked) =>
                      setNotificationSettings({ ...notificationSettings, push: checked })
                    }
                  />
                </div>

                <Button 
                  onClick={() => {
                    toast({
                      title: "Settings Saved",
                      description: "Your notification preferences have been updated"
                    });
                  }}
                  className="w-full bg-green-600 hover:bg-green-700 mt-4"
                >
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Account Information */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold mb-4">Account Information</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Email:</span>
                  <span className="font-medium">{user?.email}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Account Created:</span>
                  <span className="font-medium">
                    {user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', {
                      month: '2-digit',
                      day: '2-digit',
                      year: 'numeric'
                    }) : 'N/A'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Privacy Tab */}
        <TabsContent value="privacy" className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold mb-6">Privacy</h3>
              
              <div className="space-y-6">
                {/* Public Profile */}
                <div className="flex items-center justify-between py-3">
                  <div>
                    <Label className="text-base font-medium">Public Profile</Label>
                    <p className="text-sm text-gray-500">Make your profile visible to others</p>
                  </div>
                  <Switch
                    checked={privacySettings.publicProfile}
                    onCheckedChange={(checked) =>
                      setPrivacySettings({ ...privacySettings, publicProfile: checked })
                    }
                  />
                </div>

                {/* Show Addresses */}
                <div className="flex items-center justify-between py-3">
                  <div>
                    <Label className="text-base font-medium">Show Addresses</Label>
                    <p className="text-sm text-gray-500">Allow others to see your addresses</p>
                  </div>
                  <Switch
                    checked={privacySettings.showAddresses}
                    onCheckedChange={(checked) =>
                      setPrivacySettings({ ...privacySettings, showAddresses: checked })
                    }
                  />
                </div>

                <Button 
                  onClick={() => {
                    toast({
                      title: "Settings Saved",
                      description: "Your privacy preferences have been updated"
                    });
                  }}
                  className="w-full bg-green-600 hover:bg-green-700 mt-4"
                >
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Account Information */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold mb-4">Account Information</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Email:</span>
                  <span className="font-medium">{user?.email}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Account Created:</span>
                  <span className="font-medium">
                    {user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', {
                      month: '2-digit',
                      day: '2-digit',
                      year: 'numeric'
                    }) : 'N/A'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Data Management Tab */}
        <TabsContent value="data" className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold mb-6">Data Management</h3>
              
              <div className="space-y-6">
                {/* Export Data */}
                <div className="flex items-center justify-between py-3">
                  <div>
                    <Label className="text-base font-medium">Export Data</Label>
                    <p className="text-sm text-gray-500">Download all your data</p>
                  </div>
                  <Button 
                    variant="outline"
                    className="text-green-600 border-green-600 hover:bg-green-50"
                    onClick={handleExportData}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Export
                  </Button>
                </div>

                {/* Delete Account */}
                <div className="flex items-center justify-between py-3">
                  <div>
                    <Label className="text-base font-medium">Delete Account</Label>
                    <p className="text-sm text-gray-500">Permanently delete your account</p>
                  </div>
                  <Button 
                    variant="outline"
                    className="text-orange-600 border-orange-600 hover:bg-orange-50"
                    onClick={() => {
                      if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
                        toast({
                          title: "Account Deletion",
                          description: "Please contact support to delete your account",
                          variant: "destructive"
                        });
                      }
                    }}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Account Information */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold mb-4">Account Information</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Email:</span>
                  <span className="font-medium">{user?.email}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Account Created:</span>
                  <span className="font-medium">
                    {user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', {
                      month: '2-digit',
                      day: '2-digit',
                      year: 'numeric'
                    }) : 'N/A'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>


        </TabsContent>

        {/* API Keys Tab */}
        <TabsContent value="apikeys" className="space-y-4 sm:space-y-6">
          <ApiKeysTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

// ── API Keys sub-component ─────────────────────────────────────────────────

const API_PLAN_OPTIONS: { value: ApiKey['plan']; label: string; desc: string }[] = [
  { value: 'pro', label: 'Pro', desc: '60 req/min' },
  { value: 'business', label: 'Business', desc: '300 req/min' },
  { value: 'enterprise', label: 'Enterprise', desc: '1,000 req/min' },
  { value: 'government', label: 'Government', desc: '500 req/min' },
];

function ApiKeysTab() {
  const { toast } = useToast();
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPlan, setNewPlan] = useState<ApiKey['plan']>('business');
  const [creating, setCreating] = useState(false);
  const [freshKey, setFreshKey] = useState<NewApiKeyResult | null>(null);
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());
  const [revoking, setRevoking] = useState<string | null>(null);

  useEffect(() => {
    listApiKeys().then(setApiKeys).finally(() => setLoading(false));
  }, []);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const result = await createApiKey(newName.trim(), newPlan);
      setFreshKey(result);
      setApiKeys(prev => [result.key, ...prev]);
      setNewName('');
      setShowCreate(false);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setCreating(false);
    }
  };

  const handleRevoke = async (keyId: string, name: string) => {
    if (!window.confirm(`Revoke "${name}"? This cannot be undone.`)) return;
    setRevoking(keyId);
    try {
      await revokeApiKey(keyId);
      setApiKeys(prev => prev.map(k => k.id === keyId ? { ...k, status: 'revoked' } : k));
      toast({ title: 'Key revoked', description: `"${name}" revoked.` });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setRevoking(null);
    }
  };

  const toggleVisible = (id: string) =>
    setVisibleKeys(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const copy = (text: string) =>
    navigator.clipboard.writeText(text).then(() =>
      toast({ title: 'Copied', description: 'Copied to clipboard.' }));

  return (
    <Card>
      <CardContent className="pt-4 sm:pt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base sm:text-lg font-semibold">API Keys</h3>
          <Button size="sm" onClick={() => setShowCreate(true)} className="gap-2">
            <Plus className="w-4 h-4" /> Create key
          </Button>
        </div>

        <p className="text-sm text-gray-500 mb-4">
          API keys allow external apps to integrate with Kivro. Never share keys publicly.
        </p>

        {freshKey && (
          <div className="mb-4 rounded-lg border border-green-300 bg-green-50 p-4">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-green-800 text-sm mb-1">Save this key now — it won't be shown again</p>
                <div className="flex items-center gap-2 font-mono text-xs bg-white border border-green-200 rounded px-2 py-1.5 overflow-x-auto">
                  <span className="flex-1">{freshKey.plaintext}</span>
                  <button onClick={() => copy(freshKey.plaintext)}><Copy className="w-3.5 h-3.5 text-green-700" /></button>
                </div>
              </div>
              <button onClick={() => setFreshKey(null)} className="text-green-600 text-lg leading-none">✕</button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-gray-400" /></div>
        ) : apiKeys.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <Key className="w-8 h-8 mx-auto mb-2" />
            <p className="text-sm">No API keys yet. Create one to get started.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {apiKeys.map(k => (
              <div key={k.id} className={`border rounded-lg p-3 ${k.status === 'revoked' ? 'opacity-50' : ''}`}>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm truncate">{k.name}</span>
                      <Badge variant={k.status === 'active' ? 'default' : 'secondary'} className="text-xs">{k.status}</Badge>
                      <Badge variant="outline" className="text-xs capitalize">{k.plan}</Badge>
                    </div>
                    <div className="font-mono text-xs text-gray-500">
                      {visibleKeys.has(k.id) ? k.key_prefix : maskKey(k.key_prefix)}
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      {k.rate_limit_per_min} req/min · {k.requests_today} today ·{' '}
                      {k.last_used_at ? `Last used ${new Date(k.last_used_at).toLocaleDateString()}` : 'Never used'}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toggleVisible(k.id)}>
                      {visibleKeys.has(k.id) ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copy(k.key_prefix)}>
                      <Copy className="w-3.5 h-3.5" />
                    </Button>
                    {k.status === 'active' && (
                      <Button
                        variant="ghost" size="icon" className="h-7 w-7 text-red-500"
                        disabled={revoking === k.id}
                        onClick={() => handleRevoke(k.id, k.name)}
                      >
                        {revoking === k.id ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 flex items-start gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-3">
          <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          <span>Never expose API keys in client-side code or public repositories. Use server-side environment variables only.</span>
        </div>
      </CardContent>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create API key</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label>Key name</Label>
              <Input
                placeholder="e.g. Production — Logistics App"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCreate()}
              />
            </div>
            <div className="space-y-1">
              <Label>Plan</Label>
              <Select value={newPlan} onValueChange={v => setNewPlan(v as ApiKey['plan'])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {API_PLAN_OPTIONS.map(p => (
                    <SelectItem key={p.value} value={p.value}>
                      <span className="font-medium capitalize">{p.label}</span>
                      <span className="text-muted-foreground ml-2 text-xs">{p.desc}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={creating || !newName.trim()}>
              {creating ? 'Creating…' : 'Create key'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

// ── Referrals tab ─────────────────────────────────────────────────────────

function ReferralsTab() {
  const { toast } = useToast();
  const [code, setCode] = useState('');
  const [shareUrl, setShareUrl] = useState('');
  const [stats, setStats] = useState<{ total: number; converted: number; pending: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [inputCode, setInputCode] = useState('');
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setLoading(false); return; }
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const headers = { Authorization: `Bearer ${session.access_token}` };
      const [codeRes, statsRes] = await Promise.all([
        fetch(`${apiUrl}/api/referrals/code`, { headers }),
        fetch(`${apiUrl}/api/referrals/stats`, { headers }),
      ]);
      if (codeRes.ok) { const d = await codeRes.json(); setCode(d.code); setShareUrl(d.shareUrl); }
      if (statsRes.ok) { const d = await statsRes.json(); setStats(d); }
      setLoading(false);
    })();
  }, []);

  const copy = (text: string) => navigator.clipboard.writeText(text)
    .then(() => toast({ title: 'Copied!', description: 'Link copied to clipboard.' }));

  const applyCode = async () => {
    if (!inputCode.trim()) return;
    setApplying(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const res = await fetch(`${apiUrl}/api/referrals/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({ code: inputCode.trim() }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      toast({ title: 'Referral applied!', description: d.message });
      setInputCode('');
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setApplying(false);
    }
  };

  return (
    <TabsContent value="referrals" className="space-y-4">
      <Card>
        <CardContent className="pt-5 space-y-5">
          <div>
            <h3 className="text-base font-semibold mb-1">Invite friends to Kivro</h3>
            <p className="text-sm text-muted-foreground">Share your link — every friend who signs up helps you both.</p>
          </div>

          {loading ? (
            <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin" /></div>
          ) : (
            <>
              {/* Stats */}
              {stats && (
                <div className="grid grid-cols-3 gap-3 text-center">
                  {[
                    { label: 'Invited', value: stats.total },
                    { label: 'Converted', value: stats.converted },
                    { label: 'Pending', value: stats.pending },
                  ].map(s => (
                    <div key={s.label} className="border rounded-lg p-3">
                      <div className="text-2xl font-bold">{s.value}</div>
                      <div className="text-xs text-muted-foreground">{s.label}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Referral link */}
              <div className="space-y-1">
                <Label>Your referral link</Label>
                <div className="flex items-center gap-2">
                  <Input value={shareUrl} readOnly className="font-mono text-xs" />
                  <Button size="icon" variant="outline" onClick={() => copy(shareUrl)}>
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">Code: <span className="font-mono font-bold">{code}</span></p>
              </div>

              <div className="flex gap-2 flex-wrap">
                <Button variant="outline" size="sm" className="gap-2"
                  onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(`Join me on Kivro — the digital address platform for Africa. Use my link: ${shareUrl}`)}`)}>
                  <Share2 className="w-4 h-4" /> Share via WhatsApp
                </Button>
                <Button variant="outline" size="sm" className="gap-2" onClick={() => copy(shareUrl)}>
                  <Copy className="w-4 h-4" /> Copy link
                </Button>
              </div>

              {/* Apply a code */}
              <div className="border-t pt-4 space-y-2">
                <Label>Have a friend's referral code?</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="e.g. AB12CD34"
                    value={inputCode}
                    onChange={e => setInputCode(e.target.value.toUpperCase())}
                    maxLength={8}
                    className="font-mono uppercase"
                  />
                  <Button onClick={applyCode} disabled={applying || inputCode.length !== 8}>
                    {applying ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Apply'}
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </TabsContent>
  );
}

export default UserSettings;
