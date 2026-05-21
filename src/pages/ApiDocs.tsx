import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Code2, Key, Zap, Plus, Copy, Trash2, Eye, EyeOff,
  RefreshCw, Shield, AlertCircle, CheckCircle2, Building2
} from 'lucide-react';
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
import { supabase } from '@/integrations/supabase/client';

// ── Endpoints ────────────────────────────────────────────────────────────────

const endpoints = [
  {
    method: 'POST',
    path: '/api/addresses/create',
    description: 'Create a Kivro address for a given GPS coordinate',
    example: `{
  "latitude": -1.2921,
  "longitude": 36.8219,
  "phone": "+254712345678",
  "label": "Head Office",
  "country_code": "KEN"
}`,
  },
  {
    method: 'GET',
    path: '/api/addresses/{address_code}',
    description: 'Resolve an address code to its full details and coordinates',
    example: `{
  "address_code": "KEN-NBO-48F2-9XQ1",
  "coordinates": { "latitude": -1.2921, "longitude": 36.8219 },
  "country": "Kenya",
  "created_at": "2025-01-01T10:00:00Z"
}`,
  },
  {
    method: 'POST',
    path: '/api/deliveries/track',
    description: 'Track a package by ID and get real-time location',
    example: `{
  "package_id": "PKG-12345",
  "status": "in_transit",
  "location": { "latitude": -1.2921, "longitude": 36.8219 },
  "estimated_delivery": "2025-01-01T15:30:00Z"
}`,
  },
  {
    method: 'POST',
    path: '/api/addresses/verify',
    description: 'Verify that an address code is valid and belongs to an active account',
    example: `{
  "address_code": "KEN-NBO-48F2-9XQ1",
  "valid": true,
  "owner_phone": "+254712345678",
  "active": true
}`,
  },
  {
    method: 'GET',
    path: '/api/addresses/search',
    description: 'Search addresses by phone number or short code (B2B/government)',
    example: `{
  "results": [
    {
      "address_code": "KEN-NBO-48F2-9XQ1",
      "label": "Head Office",
      "country": "Kenya"
    }
  ],
  "total": 1
}`,
  },
];

// ── Webhook events ─────────────────────────────────────────────────────────

const webhookEvents = [
  { event: 'address.created', description: 'Fires when a new Kivro address is generated' },
  { event: 'address.verified', description: 'Fires when an address is successfully verified' },
  { event: 'delivery.status_changed', description: 'Fires on any package status change' },
  { event: 'delivery.delivered', description: 'Fires when a package is marked delivered' },
  { event: 'payment.received', description: 'Fires when a payment is confirmed' },
];

// ── Plan options ────────────────────────────────────────────────────────────

const PLAN_OPTIONS: { value: ApiKey['plan']; label: string; desc: string }[] = [
  { value: 'pro', label: 'Pro', desc: '60 req/min — individual developers' },
  { value: 'business', label: 'Business', desc: '300 req/min — companies' },
  { value: 'enterprise', label: 'Enterprise', desc: '1,000 req/min — large organizations' },
  { value: 'government', label: 'Government', desc: '500 req/min — public sector' },
];

// ── Main component ──────────────────────────────────────────────────────────

const ApiDocs = () => {
  const { toast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyPlan, setNewKeyPlan] = useState<ApiKey['plan']>('business');
  const [creating, setCreating] = useState(false);
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<NewApiKeyResult | null>(null);
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());
  const [revoking, setRevoking] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
      if (session) loadKeys();
    });
  }, []);

  const loadKeys = async () => {
    setLoading(true);
    try {
      const keys = await listApiKeys();
      setApiKeys(keys);
    } catch {
      // silently fail — user sees empty state
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newKeyName.trim()) return;
    setCreating(true);
    try {
      const result = await createApiKey(newKeyName.trim(), newKeyPlan);
      setNewlyCreatedKey(result);
      setApiKeys(prev => [result.key, ...prev]);
      setNewKeyName('');
      setShowCreateDialog(false);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setCreating(false);
    }
  };

  const handleRevoke = async (keyId: string, keyName: string) => {
    if (!window.confirm(`Revoke "${keyName}"? This cannot be undone.`)) return;
    setRevoking(keyId);
    try {
      await revokeApiKey(keyId);
      setApiKeys(prev => prev.map(k => k.id === keyId ? { ...k, status: 'revoked' } : k));
      toast({ title: 'Key revoked', description: `"${keyName}" has been revoked.` });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setRevoking(null);
    }
  };

  const copyToClipboard = (text: string, label = 'Copied') => {
    navigator.clipboard.writeText(text).then(() => {
      toast({ title: label, description: 'Copied to clipboard.' });
    });
  };

  const toggleKeyVisibility = (keyId: string) => {
    setVisibleKeys(prev => {
      const next = new Set(prev);
      next.has(keyId) ? next.delete(keyId) : next.add(keyId);
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="py-20">
        <div className="container max-w-5xl">

          {/* Hero */}
          <div className="text-center mb-16">
            <h1 className="text-4xl font-bold mb-4">Kivro API</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Integrate Kivro address generation, verification, and delivery tracking into
              any application — built for businesses and governments across Africa.
            </p>
          </div>

          {/* Feature tiles */}
          <div className="grid md:grid-cols-3 gap-6 mb-16">
            {[
              { icon: Code2, title: 'RESTful API', desc: 'Simple JSON endpoints covering all 54 African countries' },
              { icon: Key, title: 'Secure keys', desc: 'Per-key rate limits, scoping, and instant revocation' },
              { icon: Zap, title: 'Webhooks', desc: 'Real-time push notifications for address and delivery events' },
            ].map(({ icon: Icon, title, desc }) => (
              <Card key={title} className="text-center">
                <CardContent className="p-6">
                  <Icon className="w-10 h-10 text-primary mx-auto mb-3" />
                  <h3 className="font-semibold mb-1">{title}</h3>
                  <p className="text-sm text-muted-foreground">{desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* ── API Key Management ──────────────────────────────────────── */}
          <section className="mb-16">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Your API Keys</h2>
              {isAuthenticated && (
                <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
                  <Plus className="w-4 h-4" /> Create key
                </Button>
              )}
            </div>

            {!isAuthenticated ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Shield className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                  <p className="font-medium mb-2">Sign in to manage API keys</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    You need a Kivro account to generate and manage API keys.
                  </p>
                  <Button onClick={() => window.location.href = '/auth'}>Sign in</Button>
                </CardContent>
              </Card>
            ) : loading ? (
              <div className="flex justify-center py-10">
                <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : apiKeys.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Key className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                  <p className="font-medium mb-1">No API keys yet</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Create your first key to start integrating Kivro.
                  </p>
                  <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
                    <Plus className="w-4 h-4" /> Create your first key
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {apiKeys.map(key => (
                  <Card key={key.id} className={key.status === 'revoked' ? 'opacity-50' : ''}>
                    <CardContent className="p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium truncate">{key.name}</span>
                            <Badge variant={key.status === 'active' ? 'default' : 'secondary'}>
                              {key.status}
                            </Badge>
                            <Badge variant="outline" className="capitalize">{key.plan}</Badge>
                          </div>
                          <div className="font-mono text-sm text-muted-foreground">
                            {visibleKeys.has(key.id) ? key.key_prefix : maskKey(key.key_prefix)}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {key.rate_limit_per_min} req/min &middot;{' '}
                            {key.requests_today.toLocaleString()} req today &middot;{' '}
                            {key.last_used_at
                              ? `Last used ${new Date(key.last_used_at).toLocaleDateString()}`
                              : 'Never used'}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Button
                            variant="ghost" size="icon"
                            onClick={() => toggleKeyVisibility(key.id)}
                            title={visibleKeys.has(key.id) ? 'Hide key' : 'Show key'}
                          >
                            {visibleKeys.has(key.id) ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </Button>
                          <Button
                            variant="ghost" size="icon"
                            onClick={() => copyToClipboard(key.key_prefix, 'Key prefix copied')}
                            title="Copy key"
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                          {key.status === 'active' && (
                            <Button
                              variant="ghost" size="icon"
                              disabled={revoking === key.id}
                              onClick={() => handleRevoke(key.id, key.name)}
                              title="Revoke key"
                              className="text-destructive hover:text-destructive"
                            >
                              {revoking === key.id
                                ? <RefreshCw className="w-4 h-4 animate-spin" />
                                : <Trash2 className="w-4 h-4" />}
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>

          {/* Newly created key banner */}
          {newlyCreatedKey && (
            <div className="mb-10 rounded-lg border border-green-300 bg-green-50 p-5">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-green-800 mb-1">
                    API key created — save it now
                  </p>
                  <p className="text-sm text-green-700 mb-3">
                    This is the only time the full key will be shown. Copy it to a secure location.
                  </p>
                  <div className="flex items-center gap-2 font-mono text-sm bg-white rounded border border-green-200 px-3 py-2 overflow-x-auto">
                    <span className="flex-1">{newlyCreatedKey.plaintext}</span>
                    <Button
                      size="sm" variant="ghost"
                      onClick={() => copyToClipboard(newlyCreatedKey.plaintext, 'Full key copied!')}
                      className="shrink-0"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <Button
                  variant="ghost" size="icon"
                  onClick={() => setNewlyCreatedKey(null)}
                  className="shrink-0 text-green-600"
                >✕</Button>
              </div>
            </div>
          )}

          {/* ── Authentication Guide ─────────────────────────────────────── */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold mb-6">Authentication</h2>
            <Card>
              <CardContent className="p-6 space-y-4">
                <p className="text-muted-foreground">
                  Pass your API key as a Bearer token in the <code className="bg-muted px-1 rounded">Authorization</code> header of every request.
                </p>
                <div className="bg-muted p-4 rounded-lg font-mono text-sm space-y-1">
                  <p className="text-muted-foreground">Headers:</p>
                  <p>Authorization: Bearer kv_live_••••••••••••••••</p>
                  <p>Content-Type: application/json</p>
                </div>
                <div className="flex items-start gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded p-3">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>
                    Never expose your API key in client-side code or public repositories.
                    Use environment variables and server-side calls only.
                  </span>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* ── Rate Limits ──────────────────────────────────────────────── */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold mb-6">Rate limits</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {PLAN_OPTIONS.map(p => (
                <Card key={p.value}>
                  <CardContent className="p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <Building2 className="w-4 h-4 text-primary" />
                      <span className="font-semibold capitalize">{p.label}</span>
                    </div>
                    <div className="text-2xl font-bold mb-1">
                      {RATE_LIMITS[p.value].toLocaleString()}
                      <span className="text-sm font-normal text-muted-foreground"> req/min</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{p.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
            <p className="text-sm text-muted-foreground mt-3">
              Exceeded limits return <code className="bg-muted px-1 rounded">429 Too Many Requests</code> with a
              {' '}<code className="bg-muted px-1 rounded">Retry-After</code> header. Quotas reset every 60 seconds.
            </p>
          </section>

          {/* ── Endpoints ────────────────────────────────────────────────── */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold mb-6">Endpoints</h2>
            <div className="space-y-4">
              {endpoints.map((ep, i) => (
                <Card key={i}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-0.5 text-xs font-bold rounded ${
                        ep.method === 'POST' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {ep.method}
                      </span>
                      <code className="text-sm font-mono">{ep.path}</code>
                    </div>
                    <p className="text-sm text-muted-foreground">{ep.description}</p>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-muted p-4 rounded-lg">
                      <div className="text-xs text-muted-foreground mb-2">Example response:</div>
                      <pre className="font-mono text-xs overflow-x-auto">{ep.example}</pre>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* ── Webhooks ─────────────────────────────────────────────────── */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold mb-6">Webhooks</h2>
            <Card className="mb-6">
              <CardContent className="p-6 space-y-4">
                <p className="text-muted-foreground">
                  Register a HTTPS endpoint in your dashboard settings. Kivro will POST a signed JSON payload
                  to your URL on each event. Validate the signature using the
                  {' '}<code className="bg-muted px-1 rounded">X-Kivro-Signature</code> header (HMAC-SHA256).
                </p>
                <div className="bg-muted p-4 rounded-lg font-mono text-sm">
                  <p className="text-muted-foreground mb-1">POST https://your-server.com/webhooks/kivro</p>
                  <p>X-Kivro-Signature: sha256=••••••••</p>
                  <p>Content-Type: application/json</p>
                </div>
              </CardContent>
            </Card>
            <div className="space-y-2">
              {webhookEvents.map(ev => (
                <div key={ev.event} className="flex items-center gap-3 p-3 border rounded-lg">
                  <code className="text-sm font-mono text-primary bg-primary/5 px-2 py-0.5 rounded">
                    {ev.event}
                  </code>
                  <span className="text-sm text-muted-foreground">{ev.description}</span>
                </div>
              ))}
            </div>
          </section>

          {/* ── SDKs ─────────────────────────────────────────────────────── */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold mb-4">SDKs</h2>
            <p className="text-muted-foreground mb-6">
              Official SDK packages are in development. For now, call the REST API directly using
              any HTTP client. Below are quick-start examples.
            </p>
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader><CardTitle className="text-base">JavaScript / Node.js</CardTitle></CardHeader>
                <CardContent>
                  <div className="bg-muted p-4 rounded-lg font-mono text-xs overflow-x-auto">
                    <pre>{`const res = await fetch(
  'https://kivro-fullstack.vercel.app/api/addresses/create',
  {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + process.env.KIVRO_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      latitude: -1.2921,
      longitude: 36.8219,
      phone: '+254712345678',
      country_code: 'KEN',
    }),
  }
);
const address = await res.json();`}</pre>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-base">Python</CardTitle></CardHeader>
                <CardContent>
                  <div className="bg-muted p-4 rounded-lg font-mono text-xs overflow-x-auto">
                    <pre>{`import os, requests

resp = requests.post(
    "https://kivro-fullstack.vercel.app/api/addresses/create",
    headers={
        "Authorization": f"Bearer {os.environ['KIVRO_API_KEY']}",
        "Content-Type": "application/json",
    },
    json={
        "latitude": -1.2921,
        "longitude": 36.8219,
        "phone": "+254712345678",
        "country_code": "KEN",
    },
)
address = resp.json()`}</pre>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Support CTA */}
          <section className="text-center bg-muted rounded-lg p-10">
            <h2 className="text-2xl font-bold mb-3">Need help integrating?</h2>
            <p className="text-muted-foreground mb-6">
              Our developer support team is available for business and government partners across Africa.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button onClick={() => window.location.href = '/contact'}>Contact support</Button>
              <Button variant="outline" onClick={() => window.location.href = '/help'}>Help center</Button>
            </div>
          </section>

        </div>
      </main>
      <Footer />

      {/* Create key dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create API key</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label htmlFor="key-name">Key name</Label>
              <Input
                id="key-name"
                placeholder="e.g. Production — Acme Logistics"
                value={newKeyName}
                onChange={e => setNewKeyName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCreate()}
              />
              <p className="text-xs text-muted-foreground">
                A descriptive name helps you identify this key later.
              </p>
            </div>
            <div className="space-y-1">
              <Label>Plan</Label>
              <Select value={newKeyPlan} onValueChange={v => setNewKeyPlan(v as ApiKey['plan'])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PLAN_OPTIONS.map(p => (
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
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={creating || !newKeyName.trim()}>
              {creating ? 'Creating…' : 'Create key'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ApiDocs;
