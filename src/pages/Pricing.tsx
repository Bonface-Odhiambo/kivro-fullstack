import React from 'react';
import { useTenant } from '@/contexts/TenantContext';
import { getTenantCurrency, convertFromUSD, formatCurrency } from '@/lib/currency';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Building2, ShieldCheck } from 'lucide-react';

interface Plan {
  name: string;
  price: string;
  priceDetail?: string;
  description: string;
  features: string[];
  popular?: boolean;
  enterprise?: boolean;
  cta: string;
  ctaHref: string;
}

const plans: Plan[] = [
  {
    name: 'Free',
    price: price(0),
    description: 'Try Kivro with no commitment',
    features: [
      '1 Kivro address (30-day trial)',
      'Basic delivery tracking',
      'SMS & WhatsApp sharing',
      'QR code generation',
      'Community support',
    ],
    cta: 'Get started free',
    ctaHref: '/auth',
  },
  {
    name: 'Pro',
    price: price(1) + '/month',
    priceDetail: 'Billed annually at ' + price(12) + '/year',
    description: 'For individual power users',
    features: [
      '1 permanent Kivro address',
      'Priority pin verification',
      'Custom vanity aliases',
      'Advanced delivery analytics',
      'API access (60 req/min)',
      '24/7 priority support',
    ],
    cta: 'Get Pro',
    ctaHref: '/auth',
  },
  {
    name: 'Business',
    price: price(2) + '/month',
    priceDetail: 'Billed annually at ' + price(24) + '/year',
    description: 'For growing businesses across Africa',
    features: [
      'Unlimited Kivro addresses',
      'Bulk QR code generation',
      'Team management tools',
      'Advanced analytics dashboard',
      'API access (300 req/min)',
      'Webhook notifications',
      'White-label options',
      'Dedicated account manager',
    ],
    popular: true,
    cta: 'Get Business',
    ctaHref: '/auth',
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    description: 'For large organizations and enterprises',
    features: [
      'Everything in Business',
      'API access (1,000 req/min)',
      'Custom SLA agreements',
      'Dedicated infrastructure',
      'SSO / SAML support',
      'Data residency options',
      'Onboarding & training',
      '24/7 dedicated support line',
    ],
    enterprise: true,
    cta: 'Contact sales',
    ctaHref: '/contact',
  },
  {
    name: 'Government',
    price: 'Custom',
    description: 'For public sector organizations in Africa',
    features: [
      'Everything in Enterprise',
      'API access (500 req/min)',
      'Full audit logs & compliance reports',
      'GDPR/data protection compliance',
      'On-premise deployment option',
      'Multi-department address management',
      'Service request & tracking portal',
      'Sovereign data residency',
      'Government SLA (99.9% uptime)',
    ],
    enterprise: true,
    cta: 'Contact government sales',
    ctaHref: '/contact',
  },
];

const paymentMethods = [
  { region: 'East Africa', methods: ['M-Pesa (Kenya, Tanzania)', 'Airtel Money', 'Equitel', 'Bank transfer'] },
  { region: 'West Africa', methods: ['MTN Mobile Money', 'Airtel Money', 'Orange Money', 'Flutterwave', 'Paystack'] },
  { region: 'Southern Africa', methods: ['Ecocash (Zimbabwe)', 'MTN MoMo', 'Bank transfer'] },
  { region: 'North Africa', methods: ['Fawry (Egypt)', 'Bank transfer', 'Credit cards'] },
  { region: 'Global', methods: ['Visa / Mastercard', 'Bank transfer (SWIFT)', 'Stripe'] },
];

const Pricing = () => {
  const { tenant } = useTenant();
  const currency = getTenantCurrency(tenant.default_language);

  // Convert USD prices to tenant's local currency
  const price = (usd: number) => usd === 0
    ? 'Free'
    : formatCurrency(convertFromUSD(usd, currency.code), currency.code);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="py-12 sm:py-16 lg:py-20">
        <div className="container px-4 sm:px-6">

          {/* Header */}
          <div className="text-center mb-10 sm:mb-14">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4">Simple, transparent pricing</h1>
            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
              From individual users to government ministries — Kivro has a plan for every scale across Africa.
            </p>
          </div>

          {/* Plans grid — 3 cols for first 3, then 2 cols for enterprise */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {plans.slice(0, 3).map((plan) => (
              <PlanCard key={plan.name} plan={plan} />
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
            {plans.slice(3).map((plan) => (
              <PlanCard key={plan.name} plan={plan} />
            ))}
          </div>

          {/* Payment methods */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold mb-2">Accepted payment methods</h2>
            <p className="text-muted-foreground mb-6">
              Pay with the method that works best in your country — no conversion hassle.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {paymentMethods.map(({ region, methods }) => (
                <Card key={region}>
                  <CardContent className="p-5">
                    <h3 className="font-semibold mb-3">{region}</h3>
                    <ul className="space-y-1">
                      {methods.map(m => (
                        <li key={m} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Check className="w-3.5 h-3.5 text-green-600 shrink-0" />
                          {m}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* FAQ */}
          <section className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold mb-6 text-center">Frequently asked questions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                {
                  q: 'Can I change plans anytime?',
                  a: 'Yes. Upgrade or downgrade at any time — changes take effect immediately.',
                },
                {
                  q: 'Is there a setup fee?',
                  a: 'No. Pay only for your plan. Enterprise and government plans may include one-time onboarding.',
                },
                {
                  q: 'Do you offer refunds?',
                  a: 'Yes — 30-day money-back guarantee on all paid plans, no questions asked.',
                },
                {
                  q: 'Can businesses share one API key across teams?',
                  a: 'Business and Enterprise plans support multiple keys with individual rate limits and scoping per team.',
                },
                {
                  q: 'Which African countries are supported?',
                  a: 'All 54 African countries are supported for address generation and API access.',
                },
                {
                  q: 'What SLA do government plans get?',
                  a: '99.9% uptime SLA with dedicated support and monthly compliance reports.',
                },
              ].map(({ q, a }) => (
                <div key={q}>
                  <h3 className="font-semibold mb-2">{q}</h3>
                  <p className="text-sm text-muted-foreground">{a}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
};

function PlanCard({ plan }: { plan: Plan }) {
  return (
    <Card className={`relative flex flex-col ${plan.popular ? 'border-primary ring-2 ring-primary/20' : ''}`}>
      {plan.popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-medium">
            Most popular
          </span>
        </div>
      )}
      {plan.enterprise && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="bg-gray-800 text-white px-4 py-1 rounded-full text-sm font-medium flex items-center gap-1.5">
            {plan.name === 'Government'
              ? <><ShieldCheck className="w-3.5 h-3.5" /> Government</>
              : <><Building2 className="w-3.5 h-3.5" /> Enterprise</>
            }
          </span>
        </div>
      )}
      <CardHeader className="text-center pb-4 pt-8">
        <CardTitle className="text-xl">{plan.name}</CardTitle>
        <div className="mt-2">
          <span className="text-3xl font-bold">{plan.price}</span>
          {plan.priceDetail && (
            <p className="text-xs text-muted-foreground mt-1">{plan.priceDetail}</p>
          )}
        </div>
        <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>
      </CardHeader>
      <CardContent className="flex flex-col flex-1 space-y-6">
        <ul className="space-y-2 flex-1">
          {plan.features.map(f => (
            <li key={f} className="flex items-start gap-2">
              <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <span className="text-sm">{f}</span>
            </li>
          ))}
        </ul>
        <Button
          className="w-full"
          variant={plan.popular ? 'default' : 'outline'}
          onClick={() => window.location.href = plan.ctaHref}
        >
          {plan.cta}
        </Button>
      </CardContent>
    </Card>
  );
}

export default Pricing;
