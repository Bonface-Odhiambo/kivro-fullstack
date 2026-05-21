import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Building2, ShieldCheck, CheckCircle2, ChevronRight,
  Loader2, Zap, Lock, HeartHandshake
} from 'lucide-react';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';

const AFRICAN_COUNTRIES = [
  'Algeria','Angola','Benin','Botswana','Burkina Faso','Burundi','Cabo Verde',
  'Cameroon','Central African Republic','Chad','Comoros','Congo','DR Congo',
  'Djibouti','Egypt','Equatorial Guinea','Eritrea','Eswatini','Ethiopia',
  'Gabon','Gambia','Ghana','Guinea','Guinea-Bissau','Ivory Coast','Kenya',
  'Lesotho','Liberia','Libya','Madagascar','Malawi','Mali','Mauritania',
  'Mauritius','Morocco','Mozambique','Namibia','Niger','Nigeria','Rwanda',
  'São Tomé & Príncipe','Senegal','Seychelles','Sierra Leone','Somalia',
  'South Africa','South Sudan','Sudan','Tanzania','Togo','Tunisia',
  'Uganda','Zambia','Zimbabwe',
];

type OrgType = 'company' | 'government' | 'ngo' | 'startup';
type PlanType = 'business' | 'enterprise' | 'government';

interface FormData {
  orgType: OrgType | '';
  orgName: string;
  regNumber: string;
  country: string;
  city: string;
  website: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  contactRole: string;
  useCase: string;
  estimatedUsers: string;
  plan: PlanType;
  agreeTerms: boolean;
}

const EMPTY: FormData = {
  orgType: '', orgName: '', regNumber: '', country: '', city: '', website: '',
  contactName: '', contactEmail: '', contactPhone: '', contactRole: '',
  useCase: '', estimatedUsers: '', plan: 'business', agreeTerms: false,
};

const BusinessOnboarding = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState<1 | 2 | 3 | 'done'>(1);
  const [form, setForm] = useState<FormData>(EMPTY);
  const [submitting, setSubmitting] = useState(false);

  const set = (field: keyof FormData, value: string | boolean) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const step1OK = !!(form.orgType && form.orgName.trim().length >= 2 && form.country && form.city.trim());
  const step2OK = !!(form.contactName.trim() && form.contactEmail.trim() && form.contactPhone.trim() && form.contactRole.trim());
  const step3OK = form.useCase.trim().length >= 20 && form.agreeTerms;

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const res = await fetch(`${apiUrl}/api/onboarding/business`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session ? { 'Authorization': `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error('server');
    } catch {
      // Fallback: store directly in Supabase
      await supabase.from('business_onboarding_requests' as any).insert({
        org_type: form.orgType, org_name: form.orgName, country: form.country,
        city: form.city, contact_email: form.contactEmail, contact_name: form.contactName,
        contact_phone: form.contactPhone, plan: form.plan, use_case: form.useCase, status: 'pending',
      });
    } finally {
      setSubmitting(false);
      setStep('done');
    }
  };

  // ── Step progress bar ─────────────────────────────────────────────────────
  const StepBar = () => (
    <div className="flex items-center gap-2 mb-8">
      {([1, 2, 3] as const).map((s, i) => (
        <React.Fragment key={s}>
          <div className={`flex items-center gap-2 ${
            step === s ? 'text-primary' : (step === 'done' || (step as number) > s) ? 'text-green-600' : 'text-muted-foreground'
          }`}>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold border-2 ${
              step === s ? 'border-primary bg-primary text-white' :
              (step === 'done' || (step as number) > s) ? 'border-green-600 bg-green-600 text-white' :
              'border-muted-foreground'
            }`}>
              {(step === 'done' || (step as number) > s) ? '✓' : s}
            </div>
            <span className="text-sm font-medium hidden sm:inline">
              {s === 1 ? 'Organization' : s === 2 ? 'Contact' : 'Plan & Use case'}
            </span>
          </div>
          {i < 2 && <div className="flex-1 h-px bg-border" />}
        </React.Fragment>
      ))}
    </div>
  );

  // ── Success ───────────────────────────────────────────────────────────────
  if (step === 'done') return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="py-20">
        <div className="container max-w-lg text-center">
          <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-6" />
          <h1 className="text-3xl font-bold mb-3">Application received!</h1>
          <p className="text-muted-foreground text-lg mb-6">
            Thank you, <strong>{form.contactName}</strong>. We've received the application for{' '}
            <strong>{form.orgName}</strong> and will review it within one business day.
          </p>
          <div className="bg-muted rounded-lg p-5 text-left mb-8 space-y-3 text-sm">
            {[
              ['Organization', form.orgName],
              ['Country', form.country],
              ['Plan requested', form.plan],
              ['Contact email', form.contactEmail],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between">
                <span className="text-muted-foreground">{k}</span>
                <span className="font-medium capitalize">{v}</span>
              </div>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={() => navigate('/api')}>View API docs</Button>
            <Button variant="outline" onClick={() => navigate('/')}>Back to home</Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="py-12 sm:py-16">
        <div className="container max-w-3xl px-4">

          {/* Hero */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-medium mb-4">
              <Building2 className="w-4 h-4" /> Business & Government Access
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold mb-3">Integrate Kivro into your organization</h1>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Get API access, dedicated support, and custom SLAs for businesses and government
              ministries across all 54 African countries.
            </p>
          </div>

          {/* Benefits row — step 1 only */}
          {step === 1 && (
            <div className="grid sm:grid-cols-3 gap-4 mb-10">
              {[
                { icon: Zap, title: 'Fast onboarding', desc: 'Live API keys within 24 hours of approval' },
                { icon: Lock, title: 'Secure & compliant', desc: 'Data residency options and full audit logs' },
                { icon: HeartHandshake, title: 'Dedicated support', desc: 'Named account manager for your team' },
              ].map(({ icon: Icon, title, desc }) => (
                <Card key={title} className="text-center">
                  <CardContent className="p-5">
                    <Icon className="w-7 h-7 text-primary mx-auto mb-2" />
                    <p className="font-semibold text-sm mb-1">{title}</p>
                    <p className="text-xs text-muted-foreground">{desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <StepBar />

          {/* ── Step 1: Organization ─────────────────────────────────── */}
          {step === 1 && (
            <Card>
              <CardHeader><CardTitle>Tell us about your organization</CardTitle></CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <Label>Organization type *</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {([
                      { value: 'company' as OrgType, label: 'Company', Icon: Building2 },
                      { value: 'government' as OrgType, label: 'Government', Icon: ShieldCheck },
                      { value: 'ngo' as OrgType, label: 'NGO / INGO', Icon: HeartHandshake },
                      { value: 'startup' as OrgType, label: 'Startup', Icon: Zap },
                    ]).map(({ value, label, Icon }) => (
                      <button
                        key={value}
                        onClick={() => set('orgType', value)}
                        className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 transition-all text-sm font-medium ${
                          form.orgType === value ? 'border-primary bg-primary/5 text-primary' : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <Icon className="w-5 h-5" />{label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label>Organization name *</Label>
                    <Input placeholder="Acme Logistics Ltd" value={form.orgName} onChange={e => set('orgName', e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label>Registration number</Label>
                    <Input placeholder="PVT-12345 / Ministry ref" value={form.regNumber} onChange={e => set('regNumber', e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label>Country *</Label>
                    <Select value={form.country} onValueChange={v => set('country', v)}>
                      <SelectTrigger><SelectValue placeholder="Select country" /></SelectTrigger>
                      <SelectContent className="max-h-72">
                        {AFRICAN_COUNTRIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label>City *</Label>
                    <Input placeholder="Nairobi" value={form.city} onChange={e => set('city', e.target.value)} />
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <Label>Website</Label>
                    <Input placeholder="https://acmelogistics.co.ke" value={form.website} onChange={e => set('website', e.target.value)} />
                  </div>
                </div>

                <Button className="w-full gap-2" disabled={!step1OK} onClick={() => setStep(2)}>
                  Continue <ChevronRight className="w-4 h-4" />
                </Button>
              </CardContent>
            </Card>
          )}

          {/* ── Step 2: Contact ──────────────────────────────────────── */}
          {step === 2 && (
            <Card>
              <CardHeader><CardTitle>Primary contact person</CardTitle></CardHeader>
              <CardContent className="space-y-5">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label>Full name *</Label>
                    <Input placeholder="Jane Wanjiru" value={form.contactName} onChange={e => set('contactName', e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label>Role / Title *</Label>
                    <Input placeholder="CTO, IT Director…" value={form.contactRole} onChange={e => set('contactRole', e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label>Work email *</Label>
                    <Input type="email" placeholder="jane@org.co.ke" value={form.contactEmail} onChange={e => set('contactEmail', e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label>Phone number *</Label>
                    <Input placeholder="+254 712 345 678" value={form.contactPhone} onChange={e => set('contactPhone', e.target.value)} />
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>Back</Button>
                  <Button className="flex-1 gap-2" disabled={!step2OK} onClick={() => setStep(3)}>
                    Continue <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ── Step 3: Plan & Use case ──────────────────────────────── */}
          {step === 3 && (
            <Card>
              <CardHeader><CardTitle>Plan & Use case</CardTitle></CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <Label>Plan *</Label>
                  <div className="grid sm:grid-cols-3 gap-3">
                    {([
                      { value: 'business' as PlanType, label: 'Business', desc: '300 req/min, unlimited addresses', price: '$2/mo' },
                      { value: 'enterprise' as PlanType, label: 'Enterprise', desc: '1,000 req/min, custom SLA', price: 'Custom' },
                      { value: 'government' as PlanType, label: 'Government', desc: '500 req/min, audit logs, residency', price: 'Custom' },
                    ]).map(p => (
                      <button
                        key={p.value}
                        onClick={() => set('plan', p.value)}
                        className={`text-left p-4 rounded-lg border-2 transition-all ${
                          form.plan === p.value ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'
                        }`}
                      >
                        <div className="font-semibold text-sm mb-1">{p.label}</div>
                        <div className="text-xs text-muted-foreground mb-2">{p.desc}</div>
                        <Badge variant={form.plan === p.value ? 'default' : 'outline'} className="text-xs">{p.price}</Badge>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <Label>Describe your use case * <span className="text-muted-foreground text-xs">(min 20 chars)</span></Label>
                  <Textarea
                    placeholder="e.g. We are a last-mile delivery company serving 50,000 customers across Kenya. We need Kivro addresses so our drivers can navigate without street addresses…"
                    rows={5}
                    value={form.useCase}
                    onChange={e => set('useCase', e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <Label>Estimated users / addresses</Label>
                  <Select value={form.estimatedUsers} onValueChange={v => set('estimatedUsers', v)}>
                    <SelectTrigger><SelectValue placeholder="Select range" /></SelectTrigger>
                    <SelectContent>
                      {['1–100','100–1,000','1,000–10,000','10,000–100,000','100,000+'].map(r =>
                        <SelectItem key={r} value={r}>{r}</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" checked={form.agreeTerms} onChange={e => set('agreeTerms', e.target.checked)} className="mt-1" />
                  <span className="text-sm text-muted-foreground">
                    I agree to Kivro's <a href="/terms" target="_blank" className="underline text-primary">Terms of Service</a> and{' '}
                    <a href="/privacy" target="_blank" className="underline text-primary">Privacy Policy</a>, including the B2B data processing addendum.
                  </span>
                </label>

                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1" onClick={() => setStep(2)}>Back</Button>
                  <Button className="flex-1 gap-2" disabled={!step3OK || submitting} onClick={handleSubmit}>
                    {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</> : 'Submit application'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

        </div>
      </main>
      <Footer />
    </div>
  );
};

export default BusinessOnboarding;
