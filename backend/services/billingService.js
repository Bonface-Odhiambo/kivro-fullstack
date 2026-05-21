/**
 * Billing Service — handles subscription lifecycle, invoicing, dunning.
 */

const { createClient } = require('@supabase/supabase-js');
const { sendEmail } = require('./emailService');

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY,
  { auth: { persistSession: false } }
);

// Plan pricing in USD
const PLAN_PRICES = {
  free:        { monthly: 0,    annual: 0    },
  pro:         { monthly: 1,    annual: 10   },
  business:    { monthly: 2,    annual: 20   },
  enterprise:  { monthly: null, annual: null }, // custom
  government:  { monthly: null, annual: null }, // custom
};

// Platform fees charged to resellers per month
const PLATFORM_FEES = {
  starter:    150,
  growth:     400,
  scale:      800,
  enterprise: 1500,
};

// Dunning schedule: days after failure to retry
const DUNNING_SCHEDULE = [1, 3, 7, 14]; // retry on day 1, 3, 7, 14

// ── Create subscription ───────────────────────────────────────────────────────
async function createSubscription({ userId, tenantId, plan, currency = 'USD', interval = 'month' }) {
  const price = PLAN_PRICES[plan];
  if (!price) throw new Error(`Unknown plan: ${plan}`);

  const amount = interval === 'year' ? price.annual : price.monthly;
  const now = new Date();
  const periodEnd = new Date(now);
  if (interval === 'month') periodEnd.setMonth(periodEnd.getMonth() + 1);
  else periodEnd.setFullYear(periodEnd.getFullYear() + 1);

  const { data, error } = await supabaseAdmin
    .from('subscriptions')
    .insert({
      user_id: userId,
      tenant_id: tenantId,
      plan,
      status: amount === 0 ? 'active' : 'trialing',
      amount: amount ?? 0,
      currency,
      interval,
      current_period_start: now.toISOString(),
      current_period_end: periodEnd.toISOString(),
      trial_end: amount === 0 ? null : new Date(now.getTime() + 14 * 86400000).toISOString(),
      next_billing_at: periodEnd.toISOString(),
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

// ── Record revenue event ──────────────────────────────────────────────────────
async function recordRevenue({ tenantId, userId, period, description, type, grossAmount, currency = 'USD', paymentId }) {
  const PLATFORM_SHARE = 0.40; // Kivro keeps 40%

  await supabaseAdmin.from('revenue_ledger').insert({
    tenant_id: tenantId,
    user_id: userId,
    period,
    description,
    type,
    gross_amount: grossAmount,
    platform_cut: +(grossAmount * PLATFORM_SHARE).toFixed(2),
    reseller_share: +(grossAmount * (1 - PLATFORM_SHARE)).toFixed(2),
    currency,
    amount_usd: currency === 'USD' ? grossAmount : null,
    payment_id: paymentId ?? null,
  });
}

// ── Generate invoice for a tenant ─────────────────────────────────────────────
async function generateInvoice(tenantId, period) {
  const { data: tenant } = await supabaseAdmin
    .from('tenants')
    .select('id, slug, name, plan, from_email')
    .eq('id', tenantId)
    .single();

  if (!tenant) throw new Error('Tenant not found');

  const { data: usage } = await supabaseAdmin
    .from('usage_meters')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('period', period)
    .single();

  const platformFee = PLATFORM_FEES[tenant.plan] ?? 150;
  const lineItems = [
    { description: `Platform fee — ${tenant.plan} plan`, amount: platformFee, quantity: 1 },
    { description: `Active users`, amount: 0, quantity: usage?.active_users ?? 0 },
    { description: `Addresses created`, amount: 0, quantity: usage?.addresses ?? 0 },
    { description: `API calls`, amount: 0, quantity: usage?.api_calls ?? 0 },
  ];

  const invoiceNumber = `INV-${tenant.slug.toUpperCase()}-${period.replace('-','')}-001`;

  const { data: invoice, error } = await supabaseAdmin
    .from('invoices')
    .insert({
      tenant_id: tenantId,
      invoice_number: invoiceNumber,
      period,
      status: 'sent',
      line_items: lineItems,
      subtotal: platformFee,
      total: platformFee,
      currency: 'USD',
      due_date: new Date(Date.now() + 14 * 86400000).toISOString(),
    })
    .select()
    .single();

  if (error && error.code !== '23505') throw new Error(error.message); // ignore duplicate

  // Send invoice email
  if (tenant.from_email) {
    const itemRows = lineItems
      .map(l => `<tr><td>${l.description}</td><td>${l.quantity > 0 ? l.quantity : ''}</td><td>$${l.amount.toFixed(2)}</td></tr>`)
      .join('');

    await sendEmail(
      tenant.from_email,
      `Invoice ${invoiceNumber} — ${period}`,
      `<div style="font-family:sans-serif;max-width:560px;margin:0 auto">
        <h2>Invoice ${invoiceNumber}</h2>
        <p>Period: <strong>${period}</strong></p>
        <table border="1" cellpadding="8" cellspacing="0" style="width:100%;border-collapse:collapse">
          <tr><th>Description</th><th>Qty</th><th>Amount</th></tr>
          ${itemRows}
          <tr><td colspan="2"><strong>Total</strong></td><td><strong>$${platformFee.toFixed(2)}</strong></td></tr>
        </table>
        <p>Due: ${new Date(Date.now() + 14*86400000).toLocaleDateString()}</p>
      </div>`
    ).catch(() => {});
  }

  return invoice;
}

// ── Dunning: handle failed payments ──────────────────────────────────────────
async function processDunning() {
  const { data: overdue } = await supabaseAdmin
    .from('subscriptions')
    .select('id, tenant_id, user_id, payment_failure_count')
    .eq('status', 'past_due')
    .lt('next_billing_at', new Date().toISOString());

  if (!overdue?.length) return { processed: 0, suspended: 0 };

  let processed = 0, suspended = 0;

  for (const sub of overdue) {
    const attempt = (sub.payment_failure_count ?? 0) + 1;

    if (attempt > DUNNING_SCHEDULE.length) {
      // Max retries exceeded — suspend
      await supabaseAdmin.from('subscriptions')
        .update({ status: 'suspended', updated_at: new Date().toISOString() })
        .eq('id', sub.id);

      await supabaseAdmin.from('dunning_log').insert({
        tenant_id: sub.tenant_id,
        subscription_id: sub.id,
        attempt,
        status: 'suspended',
      });
      suspended++;
    } else {
      const daysUntilRetry = DUNNING_SCHEDULE[attempt - 1];
      await supabaseAdmin.from('subscriptions')
        .update({
          payment_failure_count: attempt,
          last_failure_at: new Date().toISOString(),
          next_billing_at: new Date(Date.now() + daysUntilRetry * 86400000).toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', sub.id);

      await supabaseAdmin.from('dunning_log').insert({
        tenant_id: sub.tenant_id,
        subscription_id: sub.id,
        attempt,
        status: 'attempted',
        next_retry_at: new Date(Date.now() + daysUntilRetry * 86400000).toISOString(),
      });
      processed++;
    }
  }

  return { processed, suspended };
}

// ── Get revenue summary for a tenant ─────────────────────────────────────────
async function getRevenueSummary(tenantId, period) {
  const { data } = await supabaseAdmin
    .from('revenue_ledger')
    .select('gross_amount, platform_cut, reseller_share, currency, type')
    .eq('tenant_id', tenantId)
    .eq('period', period);

  const summary = {
    gross: 0, platform_cut: 0, reseller_share: 0,
    by_type: {},
  };

  for (const row of data ?? []) {
    summary.gross += row.gross_amount;
    summary.platform_cut += row.platform_cut;
    summary.reseller_share += row.reseller_share;
    summary.by_type[row.type] = (summary.by_type[row.type] ?? 0) + row.gross_amount;
  }

  return summary;
}

module.exports = {
  createSubscription,
  recordRevenue,
  generateInvoice,
  processDunning,
  getRevenueSummary,
  PLAN_PRICES,
  PLATFORM_FEES,
};
