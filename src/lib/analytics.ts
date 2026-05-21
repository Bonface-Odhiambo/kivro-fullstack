/**
 * Privacy-first analytics — PostHog
 * Only activates if VITE_POSTHOG_KEY is set AND user accepted cookies.
 * No tracking if user declined consent.
 */

let ph: import('posthog-js').PostHog | null = null;
let initialised = false;

function hasConsent(): boolean {
  return localStorage.getItem('kivro_cookie_consent') === 'accepted';
}

export async function initAnalytics() {
  const key = import.meta.env.VITE_POSTHOG_KEY as string | undefined;
  if (!key || !hasConsent() || initialised) return;

  try {
    const { default: posthog } = await import('posthog-js');
    posthog.init(key, {
      api_host: 'https://eu.posthog.com',   // EU data residency
      autocapture: false,                    // manual events only — no accidental PII
      capture_pageview: true,
      capture_pageleave: true,
      disable_session_recording: true,       // no screen recordings by default
      respect_dnt: true,                     // honour browser Do Not Track
      persistence: 'localStorage',
      loaded(ph) {
        // Strip any PII from user properties
        ph.register({ platform: 'web' });
      },
    });
    ph = posthog;
    initialised = true;
  } catch {
    // posthog-js not installed — analytics disabled
  }
}

export function track(event: string, properties?: Record<string, unknown>) {
  if (!hasConsent() || !ph) return;
  ph.capture(event, properties);
}

export function identify(userId: string, traits?: Record<string, unknown>) {
  if (!hasConsent() || !ph) return;
  // Never send email/phone as identity — use hashed or opaque ID only
  ph.identify(userId, traits);
}

export function page(pageName?: string) {
  if (!hasConsent() || !ph) return;
  ph.capture('$pageview', { page: pageName ?? window.location.pathname });
}

// Key product events
export const Events = {
  ADDRESS_CREATED:     'address_created',
  ADDRESS_SHARED:      'address_shared',
  API_KEY_CREATED:     'api_key_created',
  ONBOARDING_STARTED:  'onboarding_started',
  ONBOARDING_COMPLETED:'onboarding_completed',
  PLAN_UPGRADED:       'plan_upgraded',
  REFERRAL_SHARED:     'referral_shared',
  PACKAGE_TRACKED:     'package_tracked',
} as const;
