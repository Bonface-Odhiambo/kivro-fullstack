/**
 * Multi-currency formatting for Kivro
 * Supports all major African currencies + USD/EUR/GBP
 */

export interface CurrencyConfig {
  code: string;
  symbol: string;
  name: string;
  locale: string;
  decimals: number;
  position: 'before' | 'after';
}

export const CURRENCIES: Record<string, CurrencyConfig> = {
  USD: { code: 'USD', symbol: '$',    name: 'US Dollar',          locale: 'en-US',  decimals: 2, position: 'before' },
  EUR: { code: 'EUR', symbol: '€',    name: 'Euro',               locale: 'fr-FR',  decimals: 2, position: 'before' },
  GBP: { code: 'GBP', symbol: '£',    name: 'British Pound',      locale: 'en-GB',  decimals: 2, position: 'before' },
  KES: { code: 'KES', symbol: 'KSh',  name: 'Kenyan Shilling',    locale: 'sw-KE',  decimals: 0, position: 'before' },
  TZS: { code: 'TZS', symbol: 'TSh',  name: 'Tanzanian Shilling', locale: 'sw-TZ',  decimals: 0, position: 'before' },
  UGX: { code: 'UGX', symbol: 'USh',  name: 'Ugandan Shilling',   locale: 'sw-UG',  decimals: 0, position: 'before' },
  NGN: { code: 'NGN', symbol: '₦',    name: 'Nigerian Naira',     locale: 'en-NG',  decimals: 2, position: 'before' },
  GHS: { code: 'GHS', symbol: 'GH₵',  name: 'Ghanaian Cedi',      locale: 'en-GH',  decimals: 2, position: 'before' },
  XOF: { code: 'XOF', symbol: 'CFA',  name: 'West African CFA',   locale: 'fr-CI',  decimals: 0, position: 'after'  },
  XAF: { code: 'XAF', symbol: 'FCFA', name: 'Central African CFA',locale: 'fr-CM',  decimals: 0, position: 'after'  },
  ZAR: { code: 'ZAR', symbol: 'R',    name: 'South African Rand', locale: 'en-ZA',  decimals: 2, position: 'before' },
  EGP: { code: 'EGP', symbol: 'E£',   name: 'Egyptian Pound',     locale: 'ar-EG',  decimals: 2, position: 'before' },
  MAD: { code: 'MAD', symbol: 'DH',   name: 'Moroccan Dirham',    locale: 'ar-MA',  decimals: 2, position: 'after'  },
  ETB: { code: 'ETB', symbol: 'Br',   name: 'Ethiopian Birr',     locale: 'am-ET',  decimals: 2, position: 'before' },
  RWF: { code: 'RWF', symbol: 'RF',   name: 'Rwandan Franc',      locale: 'rw-RW',  decimals: 0, position: 'before' },
  MZN: { code: 'MZN', symbol: 'MT',   name: 'Mozambican Metical', locale: 'pt-MZ',  decimals: 2, position: 'before' },
};

// Maps country codes to their default currency
export const COUNTRY_CURRENCY: Record<string, string> = {
  KEN: 'KES', TZA: 'TZS', UGA: 'UGX', RWA: 'RWF', BDI: 'USD',
  NGA: 'NGN', GHA: 'GHS', SEN: 'XOF', CIV: 'XOF', MLI: 'XOF',
  BFA: 'XOF', NER: 'XOF', TGO: 'XOF', BEN: 'XOF', GIN: 'XOF',
  CMR: 'XAF', GAB: 'XAF', COG: 'XAF', TCD: 'XAF', CAF: 'XAF',
  ZAF: 'ZAR', EGY: 'EGP', MAR: 'MAD', ETH: 'ETB', MOZ: 'MZN',
  AGO: 'AOA', TUN: 'TND', DZA: 'DZD', LBY: 'LYD',
};

// Fixed exchange rates to USD (refreshed from DB in production)
export const RATES_TO_USD: Record<string, number> = {
  USD: 1, EUR: 1.08, GBP: 1.27, KES: 0.0076, TZS: 0.00037,
  UGX: 0.00026, NGN: 0.00063, GHS: 0.067, XOF: 0.00167,
  XAF: 0.00167, ZAR: 0.053, EGP: 0.020, MAD: 0.099,
  ETB: 0.018, RWF: 0.00074, MZN: 0.016,
};

/**
 * Format an amount in a given currency for display.
 * formatCurrency(1, 'USD')  → '$1'
 * formatCurrency(600, 'XOF') → '600 CFA'
 */
export function formatCurrency(amount: number, currencyCode: string): string {
  const cfg = CURRENCIES[currencyCode] ?? CURRENCIES['USD'];

  const formatted = new Intl.NumberFormat(cfg.locale, {
    minimumFractionDigits: cfg.decimals,
    maximumFractionDigits: cfg.decimals,
  }).format(amount);

  return cfg.position === 'before'
    ? `${cfg.symbol}${formatted}`
    : `${formatted} ${cfg.symbol}`;
}

/**
 * Convert a USD price to the tenant's local currency.
 * convertFromUSD(1, 'XOF') → 600
 */
export function convertFromUSD(usdAmount: number, toCurrency: string): number {
  const rate = RATES_TO_USD[toCurrency];
  if (!rate || rate === 0) return usdAmount;
  return Math.round(usdAmount / rate);
}

/**
 * Given a tenant's country code, return the right currency and formatted price.
 * getPriceDisplay(1, 'CIV') → { amount: 600, currency: 'XOF', display: '600 CFA' }
 */
export function getPriceDisplay(usdPrice: number, countryCode: string) {
  const currency = COUNTRY_CURRENCY[countryCode] ?? 'USD';
  const amount = convertFromUSD(usdPrice, currency);
  return { amount, currency, display: formatCurrency(amount, currency) };
}

/** Get currency config for a tenant's default country */
export function getTenantCurrency(defaultLanguage: string): CurrencyConfig {
  // Map language codes to currencies
  const langCurrency: Record<string, string> = {
    FR: 'XOF',   // French → West Africa default
    SW: 'KES',   // Swahili → Kenya
    AR: 'EGP',   // Arabic → Egypt
    PT: 'MZN',   // Portuguese → Mozambique
    HA: 'NGN',   // Hausa → Nigeria
    AM: 'ETB',   // Amharic → Ethiopia
    EN: 'USD',   // English → USD
    SO: 'USD',   // Somali → USD
  };
  const code = langCurrency[defaultLanguage] ?? 'USD';
  return CURRENCIES[code];
}
