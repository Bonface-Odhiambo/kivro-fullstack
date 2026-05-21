/**
 * Business & Government Onboarding Routes
 * POST /api/onboarding/business — submit an onboarding application
 * GET  /api/onboarding/business — admin: list all pending applications
 */

const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const { sendOnboardingConfirmation } = require('../services/emailService');

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  { auth: { persistSession: false } }
);

// ── POST /api/onboarding/business ────────────────────────────────────────────

router.post('/business', async (req, res) => {
  const {
    orgType, orgName, regNumber, country, city, website,
    contactName, contactEmail, contactPhone, contactRole,
    useCase, estimatedUsers, plan,
  } = req.body;

  if (!orgName || !country || !contactEmail || !useCase || !plan) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  if (useCase.trim().length < 20) {
    return res.status(400).json({ error: 'Use case must be at least 20 characters' });
  }

  // Optional: get user_id if authenticated
  let userId = null;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const { data: { user } } = await supabaseAdmin.auth.getUser(authHeader.slice(7));
    userId = user?.id || null;
  }

  const { data, error } = await supabaseAdmin
    .from('business_onboarding_requests')
    .insert({
      user_id: userId,
      org_type: orgType,
      org_name: orgName,
      reg_number: regNumber,
      country,
      city,
      website,
      contact_name: contactName,
      contact_email: contactEmail,
      contact_phone: contactPhone,
      contact_role: contactRole,
      use_case: useCase,
      estimated_users: estimatedUsers,
      plan,
      status: 'pending',
    })
    .select('id')
    .single();

  if (error) {
    return res.status(500).json({ error: 'Failed to submit application' });
  }

  // Send confirmation email (fire-and-forget — don't block the response)
  sendOnboardingConfirmation({ contactEmail, contactName, orgName, plan })
    .catch(err => console.error('Onboarding email failed:', err.message));

  return res.status(201).json({ success: true, id: data.id });
});

// ── GET /api/onboarding/business — admin only ─────────────────────────────────

router.get('/business', async (req, res) => {
  // Require service-level admin token
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

  if (error || !user) return res.status(401).json({ error: 'Unauthorized' });

  // Check admin role
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('user_type')
    .eq('user_id', user.id)
    .single();

  if (!profile || profile.user_type !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const { data, error: fetchErr } = await supabaseAdmin
    .from('business_onboarding_requests')
    .select('*')
    .order('created_at', { ascending: false });

  if (fetchErr) return res.status(500).json({ error: 'Failed to fetch applications' });
  return res.json({ applications: data || [] });
});

module.exports = router;
