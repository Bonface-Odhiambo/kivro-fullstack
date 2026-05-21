/**
 * Reseller Portal — full dashboard for white-label partners.
 * Tabs: Overview · Customers · Revenue · Invoices · Branding
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useTenant } from '@/contexts/TenantContext';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency, getTenantCurrency } from '@/lib/currency';
import {
  Users, MapPin, Key, TrendingUp, Settings, Copy, RefreshCw,
  Globe, Palette, Mail, ChevronRight, Loader2, Building2,
  FileText, DollarSign, AlertCircle, CheckCircle2, XCircle,
  Download, Search, UserX, UserCheck, ChevronDown
} from 'lucide-react';

interface Stats { users: number; addresses: number; active_api_keys: number; }
interface Customer {
  id: string; email: string; full_name: string;
  user_type: string; created_at: string; subscription?: { plan: string; status: string; };
}
interface Invoice {
  id: string; invoice_number: string; period: string;
  status: string; total: number; currency: string;
  due_date: string; paid_at: string | null;
}
interface RevenueSummary {
  gross: number; platform_cut: number; reseller_share: number;
  by_type: Record<string, number>;
}

const TABS = ['overview', 'customers', 'revenue', 'invoices', 'branding'] as const;
type Tab = typeof TABS[number];

export default function ResellerPortal() {
  const { tenant } = useTenant();
  const { toast } = useToast();
  const navigate = useNavigate();
  const currency = getTenantCurrency(tenant.default_language);
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  const [tab, setTab] = useState<Tab>('overview');
  const [token, setToken] = useState('');
  const [stats, setStats] = useState<Stats | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [revenue, setRevenue] = useState<RevenueSummary | null>(null);
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [search, setSearch] = useState('');
  const [revPeriod, setRevPeriod] = useState(new Date().toISOString().slice(0, 7));

  // Branding form state
  const [brand, setBrand] = useState({
    app_name: tenant.app_name,
    primary_color: tenant.primary_color,
    logo_url: tenant.logo_url ?? '',
    from_email: tenant.from_email,
    support_url: tenant.support_url ?? '',
    custom_domain: tenant.custom_domain ?? '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { navigate('/auth'); return; }
      setToken(session.access_token);
    });
  }, [navigate]);

  const get = useCallback(async (path: string) => {
    const r = await fetch(`${apiUrl}${path}`, { headers: { Authorization: `Bearer ${token}` } });
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  }, [token, apiUrl]);

  const patch = useCallback(async (path: string, body: object) => {
    const r = await fetch(`${apiUrl}${path}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  }, [token, apiUrl]);

  useEffect(() => {
    if (!token) return;
    setLoading(l => ({ ...l, stats: true }));
    get(`/api/tenants/${tenant.slug}/stats`)
      .then(setStats).catch(() => {}).finally(() => setLoading(l => ({ ...l, stats: false })));
  }, [token, tenant.slug]);

  useEffect(() => {
    if (!token || tab !== 'customers') return;
    setLoading(l => ({ ...l, customers: true }));
    supabase.from('profiles').select('id, full_name, user_type, created_at')
      .eq('tenant_id', tenant.id).order('created_at', { ascending: false })
      .then(({ data }) => setCustomers((data as Customer[]) ?? []))
      .finally(() => setLoading(l => ({ ...l, customers: false })));
  }, [token, tab, tenant.id]);

  useEffect(() => {
    if (!token || tab !== 'invoices') return;
    setLoading(l => ({ ...l, invoices: true }));
    get('/api/billing/invoices').then(d => setInvoices(d.invoices ?? []))
      .catch(() => {}).finally(() => setLoading(l => ({ ...l, invoices: false })));
  }, [token, tab]);

  useEffect(() => {
    if (!token || tab !== 'revenue') return;
    setLoading(l => ({ ...l, revenue: true }));
    get(`/api/billing/revenue/${revPeriod}`).then(setRevenue)
      .catch(() => {}).finally(() => setLoading(l => ({ ...l, revenue: false })));
  }, [token, tab, revPeriod]);

  const saveBranding = async () => {
    setSaving(true);
    try {
      await patch(`/api/tenants/${tenant.slug}`, brand);
      toast({ title: 'Branding saved', description: 'Reload to see changes.' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally { setSaving(false); }
  };

  const exportCustomers = () => {
    const csv = ['Name,Type,Joined', ...customers.map(c =>
      `"${c.full_name ?? ''}","${c.user_type}","${new Date(c.created_at).toLocaleDateString()}"`
    )].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${tenant.slug}-customers-${new Date().toISOString().slice(0,10)}.csv`;
    a.click(); URL.revokeObjectURL(a.href);
  };

  const filteredCustomers = customers.filter(c =>
    (c.full_name ?? '').toLowerCase().includes(search.toLowerCase())
  );

  const PLAN_LIMITS: Record<string, number> = { starter: 500, growth: 5000, scale: 99999, enterprise: 99999999 };
  const maxUsers = PLAN_LIMITS[tenant.plan] ?? 500;

  const statusIcon = (s: string) => ({
    paid: <CheckCircle2 className="w-4 h-4 text-green-600" />,
    sent: <AlertCircle className="w-4 h-4 text-amber-500" />,
    overdue: <XCircle className="w-4 h-4 text-red-500" />,
  }[s] ?? <FileText className="w-4 h-4 text-muted-foreground" />);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="py-8 sm:py-12">
        <div className="container max-w-5xl px-4">

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Building2 className="w-5 h-5 text-primary" />
                <h1 className="text-2xl font-bold">Reseller Portal</h1>
                <Badge variant="outline" className="capitalize">{tenant.plan}</Badge>
              </div>
              <p className="text-muted-foreground text-sm">
                {tenant.name} · <span className="font-mono text-xs">{tenant.slug}.kivro.africa</span>
              </p>
            </div>
          </div>

          {/* Tab nav */}
          <div className="flex gap-0 border-b mb-6 overflow-x-auto">
            {TABS.map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-4 py-2.5 text-sm font-medium capitalize whitespace-nowrap border-b-2 transition-colors ${
                  tab === t ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}>
                {t}
              </button>
            ))}
          </div>

          {/* ── OVERVIEW ───────────────────────────────── */}
          {tab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {[
                  { icon: Users,   label: 'Total users',     value: stats?.users,           max: maxUsers },
                  { icon: MapPin,  label: 'Addresses',       value: stats?.addresses,       max: null },
                  { icon: Key,     label: 'Active API keys', value: stats?.active_api_keys, max: null },
                ].map(({ icon: Icon, label, value, max }) => (
                  <Card key={label}>
                    <CardContent className="p-5">
                      <div className="flex items-center gap-2 mb-2 text-muted-foreground">
                        <Icon className="w-4 h-4" /><span className="text-xs">{label}</span>
                      </div>
                      {loading.stats
                        ? <Loader2 className="w-5 h-5 animate-spin" />
                        : <>
                          <div className="text-2xl font-bold">{(value ?? 0).toLocaleString()}</div>
                          {max && typeof value === 'number' && (
                            <>
                              <div className="text-xs text-muted-foreground">/ {max.toLocaleString()}</div>
                              <div className="w-full bg-muted rounded-full h-1 mt-2">
                                <div className="bg-primary rounded-full h-1" style={{ width: `${Math.min(100,(value/max)*100)}%` }} />
                              </div>
                            </>
                          )}
                        </>
                      }
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Card>
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Globe className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium text-sm">Your API endpoint</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-muted px-3 py-2 rounded text-xs font-mono overflow-x-auto">
                      {tenant.custom_domain ? `https://${tenant.custom_domain}/api/v1` : `https://kivro.africa/api/v1`}
                    </code>
                    <Button variant="outline" size="icon"
                      onClick={() => { navigator.clipboard.writeText(tenant.custom_domain ? `https://${tenant.custom_domain}/api/v1` : 'https://kivro.africa/api/v1'); toast({ title: 'Copied' }); }}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Include <code className="bg-muted px-1 rounded">X-Tenant-Slug: {tenant.slug}</code> on all API requests.
                  </p>
                </CardContent>
              </Card>

              <div className="grid sm:grid-cols-2 gap-3">
                {[
                  { icon: TrendingUp, label: 'View revenue', action: () => setTab('revenue') },
                  { icon: FileText,   label: 'View invoices', action: () => setTab('invoices') },
                  { icon: Users,      label: 'Manage customers', action: () => setTab('customers') },
                  { icon: Mail,       label: 'Contact Kivro support', action: () => navigate('/contact') },
                ].map(({ icon: Icon, label, action }) => (
                  <button key={label} onClick={action}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors text-left">
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{label}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── CUSTOMERS ──────────────────────────────── */}
          {tab === 'customers' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input className="pl-9" placeholder="Search customers…" value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <Button variant="outline" size="sm" className="gap-2 shrink-0" onClick={exportCustomers}>
                  <Download className="w-4 h-4" /> Export CSV
                </Button>
              </div>

              {loading.customers
                ? <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin" /></div>
                : filteredCustomers.length === 0
                ? <div className="text-center py-12 text-muted-foreground">
                    <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p>No customers yet</p>
                  </div>
                : <div className="divide-y border rounded-lg">
                    {filteredCustomers.map(c => (
                      <div key={c.id} className="flex items-center gap-3 px-4 py-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <span className="text-xs font-bold text-primary">
                            {(c.full_name ?? 'U').slice(0,2).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{c.full_name ?? 'Unknown'}</div>
                          <div className="text-xs text-muted-foreground">
                            Joined {new Date(c.created_at).toLocaleDateString()}
                          </div>
                        </div>
                        <Badge variant="outline" className="capitalize text-xs">{c.user_type}</Badge>
                      </div>
                    ))}
                  </div>
              }
            </div>
          )}

          {/* ── REVENUE ────────────────────────────────── */}
          {tab === 'revenue' && (
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <Label>Period</Label>
                <Input type="month" value={revPeriod}
                  onChange={e => setRevPeriod(e.target.value)}
                  className="w-44" />
              </div>

              {loading.revenue
                ? <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin" /></div>
                : !revenue
                ? <div className="text-center py-12 text-muted-foreground">No revenue data for this period.</div>
                : <>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                      { label: 'Gross revenue', value: revenue.gross, color: 'text-foreground' },
                      { label: 'Your share (60%)', value: revenue.reseller_share, color: 'text-green-600' },
                      { label: 'Platform fee (40%)', value: revenue.platform_cut, color: 'text-muted-foreground' },
                    ].map(({ label, value, color }) => (
                      <Card key={label}>
                        <CardContent className="p-5">
                          <div className="text-xs text-muted-foreground mb-1">{label}</div>
                          <div className={`text-2xl font-bold ${color}`}>
                            {formatCurrency(value, currency.code)}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  {Object.keys(revenue.by_type).length > 0 && (
                    <Card>
                      <CardHeader className="pb-2"><CardTitle className="text-sm">By type</CardTitle></CardHeader>
                      <CardContent className="divide-y">
                        {Object.entries(revenue.by_type).map(([type, amount]) => (
                          <div key={type} className="flex justify-between py-2 text-sm">
                            <span className="capitalize text-muted-foreground">{type.replace('_', ' ')}</span>
                            <span className="font-medium">{formatCurrency(amount as number, currency.code)}</span>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}
                </>
              }
            </div>
          )}

          {/* ── INVOICES ───────────────────────────────── */}
          {tab === 'invoices' && (
            <div className="space-y-3">
              {loading.invoices
                ? <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin" /></div>
                : invoices.length === 0
                ? <div className="text-center py-12 text-muted-foreground">
                    <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p>No invoices yet</p>
                  </div>
                : <div className="divide-y border rounded-lg">
                    {invoices.map(inv => (
                      <div key={inv.id} className="flex items-center gap-3 px-4 py-3">
                        {statusIcon(inv.status)}
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium">{inv.invoice_number}</div>
                          <div className="text-xs text-muted-foreground">
                            {inv.period} · Due {new Date(inv.due_date).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="text-sm font-semibold">{formatCurrency(inv.total, inv.currency)}</div>
                        <Badge variant={inv.status === 'paid' ? 'default' : inv.status === 'overdue' ? 'destructive' : 'secondary'}>
                          {inv.status}
                        </Badge>
                        {inv.pdf_url && (
                          <Button variant="ghost" size="icon" asChild>
                            <a href={inv.pdf_url} target="_blank" rel="noopener noreferrer">
                              <Download className="w-4 h-4" />
                            </a>
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
              }
            </div>
          )}

          {/* ── BRANDING ───────────────────────────────── */}
          {tab === 'branding' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Palette className="w-4 h-4" /> White-label branding
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  {[
                    { label: 'App name',      key: 'app_name',      type: 'text',  placeholder: 'AdresCI' },
                    { label: 'From email',    key: 'from_email',    type: 'email', placeholder: 'hello@adresci.com' },
                    { label: 'Logo URL',      key: 'logo_url',      type: 'url',   placeholder: 'https://cdn.example.com/logo.png' },
                    { label: 'Support URL',   key: 'support_url',   type: 'url',   placeholder: 'https://help.adresci.com' },
                    { label: 'Custom domain', key: 'custom_domain', type: 'text',  placeholder: 'adresci.com' },
                  ].map(({ label, key, type, placeholder }) => (
                    <div key={key} className="space-y-1">
                      <Label>{label}</Label>
                      <Input type={type} value={(brand as any)[key]} placeholder={placeholder}
                        onChange={e => setBrand(p => ({ ...p, [key]: e.target.value }))} />
                    </div>
                  ))}
                  <div className="space-y-1">
                    <Label>Primary colour</Label>
                    <div className="flex gap-2">
                      <input type="color" value={brand.primary_color}
                        onChange={e => setBrand(p => ({ ...p, primary_color: e.target.value }))}
                        className="h-10 w-12 rounded border cursor-pointer" />
                      <Input value={brand.primary_color} className="font-mono"
                        onChange={e => setBrand(p => ({ ...p, primary_color: e.target.value }))} />
                    </div>
                  </div>
                </div>

                {/* Preview */}
                <div className="border rounded-lg p-4 bg-muted/30">
                  <p className="text-xs text-muted-foreground mb-3">Live preview</p>
                  <div className="flex items-center gap-3">
                    {brand.logo_url
                      ? <img src={brand.logo_url} alt="logo" className="h-10 w-auto rounded object-contain" />
                      : <div className="h-10 w-10 rounded flex items-center justify-center text-white text-sm font-bold"
                          style={{ background: brand.primary_color }}>
                          {brand.app_name.slice(0,2).toUpperCase()}
                        </div>
                    }
                    <span className="font-semibold text-lg">{brand.app_name || 'Your App'}</span>
                    <div className="ml-auto px-4 py-1.5 rounded-lg text-white text-sm font-medium"
                      style={{ background: brand.primary_color }}>
                      Get started
                    </div>
                  </div>
                </div>

                <Button onClick={saveBranding} disabled={saving} className="gap-2">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Settings className="w-4 h-4" />}
                  {saving ? 'Saving…' : 'Save branding'}
                </Button>
              </CardContent>
            </Card>
          )}

        </div>
      </main>
      <Footer />
    </div>
  );
}
