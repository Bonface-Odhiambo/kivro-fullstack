/**
 * Email Service — sends transactional emails via Resend (primary) or
 * nodemailer/SMTP (fallback). Configure RESEND_API_KEY or SMTP_* env vars.
 */

const fetch = require('cross-fetch');

const FROM_ADDRESS = process.env.EMAIL_FROM || 'Kivro <hello@kivro.africa>';

// ── Resend (primary) ──────────────────────────────────────────────────────

async function sendViaResend(to, subject, html) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error('RESEND_API_KEY not configured');

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ from: FROM_ADDRESS, to: [to], subject, html }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Resend delivery failed');
  return data;
}

// ── SMTP fallback ─────────────────────────────────────────────────────────

async function sendViaSMTP(to, subject, html) {
  const nodemailer = require('nodemailer');
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  return transporter.sendMail({ from: FROM_ADDRESS, to, subject, html });
}

// ── Public send function ──────────────────────────────────────────────────

async function sendEmail(to, subject, html) {
  if (process.env.RESEND_API_KEY) return sendViaResend(to, subject, html);
  if (process.env.SMTP_HOST)       return sendViaSMTP(to, subject, html);
}

// ── Templates ─────────────────────────────────────────────────────────────

async function sendOnboardingConfirmation({ contactEmail, contactName, orgName, plan }) {
  const html = `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px 24px">
      <img src="https://kivro.africa/kivro-logo.jpg" alt="Kivro" style="height:48px;margin-bottom:24px"/>
      <h1 style="font-size:22px;font-weight:600;margin-bottom:8px">Application received!</h1>
      <p style="color:#555;margin-bottom:24px">
        Hi ${contactName}, we've received your ${plan} plan application for <strong>${orgName}</strong>.
        Our team will review it and get back to you within one business day.
      </p>
      <div style="background:#f5f5f5;border-radius:8px;padding:16px;margin-bottom:24px">
        <p style="margin:0;font-size:14px;color:#555">
          <strong>Organization:</strong> ${orgName}<br/>
          <strong>Plan requested:</strong> ${plan}<br/>
          <strong>Contact:</strong> ${contactEmail}
        </p>
      </div>
      <p style="color:#555;font-size:14px">
        Questions? Reply to this email or visit 
        <a href="https://kivro.africa/help" style="color:#0ea5e9">kivro.africa/help</a>
      </p>
      <p style="color:#999;font-size:12px;margin-top:32px">
        © ${new Date().getFullYear()} Kivro · 
        <a href="https://kivro.africa/privacy" style="color:#999">Privacy</a>
      </p>
    </div>`;

  return sendEmail(contactEmail, `Application received — ${orgName}`, html);
}

async function sendApiKeyCreated({ email, keyName, plan }) {
  const html = `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px 24px">
      <img src="https://kivro.africa/kivro-logo.jpg" alt="Kivro" style="height:48px;margin-bottom:24px"/>
      <h1 style="font-size:22px;font-weight:600;margin-bottom:8px">New API key created</h1>
      <p style="color:#555;margin-bottom:16px">
        A new <strong>${plan}</strong> API key named <strong>${keyName}</strong> was just created on your account.
      </p>
      <p style="color:#555;font-size:14px">
        If you didn't do this, 
        <a href="https://kivro.africa/dashboard/settings?tab=apikeys" style="color:#0ea5e9">revoke it immediately</a>.
      </p>
    </div>`;

  return sendEmail(email, `New API key created — ${keyName}`, html);
}

module.exports = { sendEmail, sendOnboardingConfirmation, sendApiKeyCreated };
