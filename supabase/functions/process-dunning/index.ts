Deno.serve(async () => {
  const res = await fetch(`${Deno.env.get('BACKEND_URL')}/api/billing/process-dunning`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${Deno.env.get('ADMIN_SERVICE_TOKEN')}` },
  });
  const d = await res.json();
  return new Response(JSON.stringify(d), { headers: { 'Content-Type':'application/json' } });
});
