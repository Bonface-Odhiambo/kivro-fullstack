import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
Deno.serve(async () => {
  const fallback = { XOF:600,XAF:600,KES:132,NGN:1580,GHS:15,ZAR:19,EGP:49,MAD:10,TZS:2700,UGX:3800,RWF:1350,ETB:57,MZN:16 };
  let rates = fallback;
  const apiKey = Deno.env.get('EXCHANGE_RATE_API_KEY');
  if (apiKey) {
    try {
      const r = await fetch(`https://v6.exchangerate-api.com/v6/${apiKey}/latest/USD`);
      const d = await r.json();
      if (d.result === 'success') rates = Object.fromEntries(Object.entries(d.conversion_rates).filter(([k]) => k in fallback));
    } catch { /* use fallback */ }
  }
  const { error } = await supabase.from('currency_rates').upsert({ base:'USD', rates, updated_at: new Date().toISOString() }, { onConflict:'base' });
  return new Response(JSON.stringify({ success: !error, rates: Object.keys(rates).length }), { headers: { 'Content-Type':'application/json' } });
});
