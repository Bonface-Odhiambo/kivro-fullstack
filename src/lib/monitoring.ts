/**
 * Error monitoring — Sentry integration
 * Set VITE_SENTRY_DSN in your .env.local to enable.
 * Falls back to console.error in development.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let Sentry: any = null;

export async function initMonitoring() {
  const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;
  if (!dsn || import.meta.env.DEV) return;

  try {
    const mod = '@sentry/react';
    Sentry = await import(mod);
    Sentry.init({
      dsn,
      environment: import.meta.env.MODE,
      tracesSampleRate: 0.1,
      release: `kivro@${import.meta.env.VITE_APP_VERSION || '1.0.0'}`,
      integrations: [
        Sentry.browserTracingIntegration(),
      ],
      beforeSend(event: Record<string, any>) {
        // Strip PII from events before sending
        if (event.user) {
          delete event.user.ip_address;
          delete event.user.username;
        }
        return event;
      },
    });
  } catch {
    // Sentry package not installed — monitoring disabled
  }
}

export function captureException(error: unknown, context?: Record<string, unknown>) {
  if (Sentry) {
    Sentry.captureException(error, { extra: context });
  } else if (import.meta.env.DEV) {
    console.error('[Error]', error, context);
  }
}

export function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info') {
  if (Sentry) {
    Sentry.captureMessage(message, level);
  }
}
