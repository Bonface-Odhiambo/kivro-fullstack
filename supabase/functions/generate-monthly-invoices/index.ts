import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
Deno.serve(async () => {
  const d = new Date(); d.setMonth(d.getMonth() - 1);
  const period = d.toISOString().slice(0, 7);
  const { data, error } = await supabase.rpc('generate_monthly_invoices', { p_period: period });
  return new Response(JSON.stringify({ success: !error, generated: data, period, error: error?.message }), { headers: { 'Content-Type':'application/json' } });
});
