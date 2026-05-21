/**
 * TenantContext — resolves the current white-label tenant from the hostname
 * and makes branding available app-wide.
 *
 * Resolution order:
 *   1. Exact custom_domain match  (adresci.com)
 *   2. Subdomain match             (ci.kivro.africa → slug "ci")
 *   3. Fallback                    → Kivro default tenant
 */

import React, {
  createContext, useContext, useEffect, useState, ReactNode
} from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Tenant {
  id: string;
  slug: string;
  name: string;
  app_name: string;
  logo_url: string | null;
  primary_color: string;
  from_email: string;
  support_url: string | null;
  custom_domain: string | null;
  plan: string;
  default_language: string;
}

const KIVRO_DEFAULT: Tenant = {
  id: '00000000-0000-0000-0000-000000000001',
  slug: 'kivro',
  name: 'Kivro',
  app_name: 'Kivro',
  logo_url: '/kivro-logo.jpg',
  primary_color: '#0EA5E9',
  from_email: 'hello@kivro.africa',
  support_url: null,
  custom_domain: null,
  plan: 'enterprise',
  default_language: 'EN',
};

interface TenantContextValue {
  tenant: Tenant;
  loading: boolean;
  isWhiteLabel: boolean;
}

const TenantContext = createContext<TenantContextValue>({
  tenant: KIVRO_DEFAULT,
  loading: true,
  isWhiteLabel: false,
});

function resolveSlugFromHostname(): string | null {
  const host = window.location.hostname;
  // localhost or kivro.africa base domain → default tenant
  if (host === 'localhost' || host === 'kivro.africa' || host === 'www.kivro.africa') {
    return null;
  }
  // Custom domain (e.g. adresci.com) — resolved by the backend query
  if (!host.endsWith('.kivro.africa')) {
    return `__domain__${host}`;
  }
  // Subdomain (e.g. ci.kivro.africa → "ci")
  const sub = host.replace('.kivro.africa', '');
  return sub === 'www' ? null : sub;
}

export function TenantProvider({ children }: { children: ReactNode }) {
  const [tenant, setTenant] = useState<Tenant>(KIVRO_DEFAULT);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const slug = resolveSlugFromHostname();

    if (!slug) {
      setLoading(false);
      return;
    }

    const fetchTenant = async () => {
      let query = supabase
        .from('tenants')
        .select('id, slug, name, app_name, logo_url, primary_color, from_email, support_url, custom_domain, plan, default_language')
        .eq('is_active', true);

      if (slug.startsWith('__domain__')) {
        query = query.eq('custom_domain', slug.replace('__domain__', ''));
      } else {
        query = query.eq('slug', slug);
      }

      const { data, error } = await query.single();

      if (!error && data) {
        setTenant(data as Tenant);
        applyBranding(data as Tenant);
      }
      setLoading(false);
    };

    fetchTenant();
  }, []);

  const isWhiteLabel = tenant.slug !== 'kivro';

  // Don't render children until tenant is resolved — prevents flash of wrong branding
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          border: '3px solid #e5e7eb',
          borderTopColor: tenant.primary_color,
          animation: 'spin 0.8s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <TenantContext.Provider value={{ tenant, loading, isWhiteLabel }}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  return useContext(TenantContext);
}

/** Apply tenant branding to CSS variables and document metadata */
function applyBranding(tenant: Tenant) {
  // Primary colour override
  document.documentElement.style.setProperty('--brand-primary', tenant.primary_color);

  // Page title
  document.title = tenant.app_name;

  // Favicon — if tenant has a logo, use it
  if (tenant.logo_url) {
    const link = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
    if (link) link.href = tenant.logo_url;
  }

  // Meta description
  const meta = document.querySelector<HTMLMetaElement>('meta[name="description"]');
  if (meta) {
    meta.content = `${tenant.app_name} — Digital address platform for Africa`;
  }
}
