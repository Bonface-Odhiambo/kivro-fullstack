/**
 * Subscription page — lets end users view, upgrade, or cancel their plan.
 * Accessible at /dashboard/subscription
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useTenant } from '@/contexts/TenantContext';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency, convertFromUSD, getTenantCurrency } from '@/lib/currency';
import { CheckCircle2, Zap, Building2, ShieldCheck, Loader2, AlertCircle } from 'lucide-react';
import UserDashboardLayout from '../components/UserDashboardLayout';

interface Subscription {
  id: string;
  plan: string;
  status: string;
  amount: number;
  currency: string;
  interval: string;
  current_period_end: string;
  next_billing_at: string;
  cancelled_at: string | null;
}

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    usdPrice: 0,
    icon: Zap,
    features: ['1 Kivro address (30-day trial)', 'Basic tracking', 'QR code'],
  },
  {
    id: 'pro',
    name: 'Pro',
    usdPrice: 1,
    icon: Zap,
    features: ['1 permanent address', 'Priority verification', 'Vanity aliases', 'API access (60 req/min)'],
    popular: false,
  },
  {
    id: 'business',
    name: 'Business',
    usdPrice: 2,
    icon: Building2,
    features: ['Unlimited addresses', 'Team management', 'API (300 req/min)', 'Webhooks', 'Analytics'],
    popular: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    usdPrice: null,
    icon: ShieldCheck,
    features: ['Everything in Business', '1,000 req/min', 'Custom SLA', 'SSO', 'Dedicated support'],
  },
];

export default function Subscription() {
  const { toast } = useToast();
  const { tenant } = useTenant();
  const navigate = useNavigate();
  const currency = getTenantCurrency(tenant.default_language);
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  const [sub, setSub] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { navigate('/auth'); return; }
      try {
        const r = await fetch(`${apiUrl}/api/billing/subscription`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (r.ok) {
          const d = await r.json();
          setSub(d.subscription);
        }
      } catch { /* no sub yet */ }
      setLoading(false);
    });
  }, []);

  const handleUpgrade = async (planId: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    setUpgrading(planId);
    try {
      const r = await fetch(`${apiUrl}/api/billing/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ plan: planId, currency: currency.code, interval: 'month' }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setSub(d.subscription);
      toast({ title: 'Plan updated', description: `You are now on the ${planId} plan.` });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setUpgrading(null);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm('Cancel your subscription? You keep access until the end of the billing period.')) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    setCancelling(true);
    try {
      const r = await fetch(`${apiUrl}/api/billing/cancel`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!r.ok) throw new Error('Failed to cancel');
      toast({ title: 'Subscription cancelled', description: 'You keep access until the end of the current period.' });
      setSub(prev => prev ? { ...prev, status: 'cancelled', cancelled_at: new Date().toISOString() } : prev);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setCancelling(false);
    }
  };

  const price = (usd: number | null) => {
    if (usd === null) return 'Custom';
    if (usd === 0) return 'Free';
    return `${formatCurrency(convertFromUSD(usd, currency.code), currency.code)}/mo`;
  };

  return (
    <UserDashboardLayout>
      <div className="max-w-4xl mx-auto py-8 px-4 space-y-8">
        <div>
          <h1 className="text-2xl font-bold mb-1">Subscription</h1>
          <p className="text-muted-foreground text-sm">Manage your plan and billing.</p>
        </div>

        {/* Current plan */}
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div>
        ) : sub ? (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Current plan</CardTitle>
                <Badge variant={sub.status === 'active' ? 'default' : sub.status === 'cancelled' ? 'secondary' : 'destructive'}>
                  {sub.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold capitalize text-lg">{sub.plan}</span>
                <span className="text-muted-foreground text-sm">
                  {formatCurrency(sub.amount, sub.currency)}/{sub.interval}
                </span>
              </div>
              <div className="text-xs text-muted-foreground space-y-1">
                <div>Current period ends: <strong>{new Date(sub.current_period_end).toLocaleDateString()}</strong></div>
                {sub.cancelled_at && (
                  <div className="flex items-center gap-1 text-amber-600">
                    <AlertCircle className="w-3 h-3" />
                    Cancelled — access until period end
                  </div>
                )}
              </div>
              {sub.status === 'active' && (
                <Button variant="outline" size="sm" onClick={handleCancel} disabled={cancelling} className="text-destructive border-destructive hover:bg-destructive/5">
                  {cancelling ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Cancel subscription
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-5 text-center text-muted-foreground">
              <p>No active subscription. Choose a plan below to get started.</p>
            </CardContent>
          </Card>
        )}

        {/* Plan grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {PLANS.map(plan => {
            const isCurrent = sub?.plan === plan.id;
            const Icon = plan.icon;
            return (
              <Card key={plan.id} className={`relative flex flex-col ${plan.popular ? 'border-primary ring-2 ring-primary/20' : ''}`}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-primary text-primary-foreground px-3 py-0.5 rounded-full text-xs font-medium">Popular</span>
                  </div>
                )}
                <CardContent className="p-5 flex flex-col flex-1 pt-7">
                  <Icon className="w-5 h-5 text-primary mb-2" />
                  <div className="font-semibold mb-0.5">{plan.name}</div>
                  <div className="text-xl font-bold mb-3">{price(plan.usdPrice)}</div>
                  <ul className="space-y-1.5 flex-1 mb-4">
                    {plan.features.map(f => (
                      <li key={f} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                        <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  {isCurrent ? (
                    <Button variant="outline" size="sm" disabled className="w-full">Current plan</Button>
                  ) : plan.usdPrice === null ? (
                    <Button variant="outline" size="sm" className="w-full" onClick={() => navigate('/contact')}>Contact sales</Button>
                  ) : (
                    <Button size="sm" className="w-full" disabled={!!upgrading} onClick={() => handleUpgrade(plan.id)}>
                      {upgrading === plan.id ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
                      {upgrading === plan.id ? 'Upgrading…' : isCurrent ? 'Current' : 'Select'}
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </UserDashboardLayout>
  );
}
