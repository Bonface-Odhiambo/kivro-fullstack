/**
 * Job queue — BullMQ backed by Redis (Upstash or self-hosted).
 * Falls back to direct execution if Redis is not configured.
 * Moves webhook delivery, email sending, and SMS off the request path.
 */

let Queue, Worker, isRedisAvailable = false;
let webhookQueue, emailQueue, smsQueue;

const REDIS_URL = process.env.REDIS_URL || process.env.UPSTASH_REDIS_URL;

async function initQueues() {
  if (!REDIS_URL) {
    return;
  }

  try {
    const bullmq = require('bullmq');
    Queue = bullmq.Queue;
    Worker = bullmq.Worker;

    const connection = { url: REDIS_URL };

    webhookQueue = new Queue('webhooks', { connection });
    emailQueue   = new Queue('emails',   { connection });
    smsQueue     = new Queue('sms',      { connection });

    // ── Webhook worker ──────────────────────────────────────────────────────
    new Worker('webhooks', async (job) => {
      const { url, payload, secret_hash } = job.data;
      const crypto = require('crypto');
      const body = JSON.stringify(payload);
      const sig = crypto.createHmac('sha256', secret_hash).update(body).digest('hex');

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Kivro-Signature': `sha256=${sig}`,
          'X-Kivro-Event': payload.event,
        },
        body,
        signal: AbortSignal.timeout(10_000),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    }, { connection, concurrency: 10 });

    // ── Email worker ────────────────────────────────────────────────────────
    new Worker('emails', async (job) => {
      const { sendEmail } = require('./emailService');
      await sendEmail(job.data.to, job.data.subject, job.data.html);
    }, { connection, concurrency: 5 });

    // ── SMS worker ──────────────────────────────────────────────────────────
    new Worker('sms', async (job) => {
      const { sendSMS } = require('./smsService');
      await sendSMS(job.data.to, job.data.message);
    }, { connection, concurrency: 20 });

    isRedisAvailable = true;
  } catch (err) {
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

async function enqueueWebhook(url, payload, secret_hash) {
  if (isRedisAvailable && webhookQueue) {
    await webhookQueue.add('deliver', { url, payload, secret_hash }, {
      attempts: 4,
      backoff: { type: 'exponential', delay: 5000 },
      removeOnComplete: 100,
      removeOnFail: 500,
    });
  } else {
    // Synchronous fallback — fire and forget
    const { dispatchWebhookEvent } = require('../routes/webhooks');
    setImmediate(() => dispatchWebhookEvent(payload.userId, payload.event, payload.data).catch(() => {}));
  }
}

async function enqueueEmail(to, subject, html) {
  if (isRedisAvailable && emailQueue) {
    await emailQueue.add('send', { to, subject, html }, {
      attempts: 3,
      backoff: { type: 'fixed', delay: 30000 },
    });
  } else {
    const { sendEmail } = require('./emailService');
    setImmediate(() => sendEmail(to, subject, html).catch(() => {}));
  }
}

async function enqueueSMS(to, message) {
  if (isRedisAvailable && smsQueue) {
    await smsQueue.add('send', { to, message }, {
      attempts: 3,
      backoff: { type: 'fixed', delay: 10000 },
    });
  } else {
    const { sendSMS } = require('./smsService');
    setImmediate(() => sendSMS(to, message).catch(() => {}));
  }
}

module.exports = { initQueues, enqueueWebhook, enqueueEmail, enqueueSMS };
