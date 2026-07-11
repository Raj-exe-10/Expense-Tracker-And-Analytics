export type SupportedCurrency = 'INR' | 'USD' | 'GBP' | 'EUR';

export interface LocaleCurrencyConfig {
  locale: string;
  currency: SupportedCurrency;
  currencyNoun: string;
  headline: string;
}

const REGION_TO_CURRENCY: Record<string, SupportedCurrency> = {
  IN: 'INR',
  US: 'USD',
  GB: 'GBP',
  UK: 'GBP',
  DE: 'EUR',
  FR: 'EUR',
  IT: 'EUR',
  ES: 'EUR',
  NL: 'EUR',
  IE: 'EUR',
  AT: 'EUR',
  PT: 'EUR',
};

const CURRENCY_NOUN: Record<SupportedCurrency, string> = {
  INR: 'rupee',
  USD: 'dollar',
  GBP: 'pound',
  EUR: 'euro',
};

const CURRENCY_SYMBOL: Record<SupportedCurrency, string> = {
  INR: '₹',
  USD: '$',
  GBP: '£',
  EUR: '€',
};

/** Demo FX multipliers relative to USD for landing-page sample figures. */
const DEMO_FX_FROM_USD: Record<SupportedCurrency, number> = {
  USD: 1,
  INR: 100,
  GBP: 0.79,
  EUR: 0.92,
};

function parseRegion(locale: string): string {
  const parts = locale.replace('_', '-').split('-');
  if (parts.length >= 2) return parts[1].toUpperCase();
  return '';
}

export function detectLocale(): string {
  if (typeof navigator === 'undefined') return 'en-US';
  return navigator.language || (navigator.languages?.[0] ?? 'en-US');
}

export function resolveCurrencyFromLocale(locale: string): SupportedCurrency {
  const region = parseRegion(locale);
  const mapped = REGION_TO_CURRENCY[region];
  if (mapped && mapped in CURRENCY_NOUN) return mapped as SupportedCurrency;
  if (locale.toLowerCase().includes('in')) return 'INR';
  return 'USD';
}

export function getLocaleCurrencyConfig(locale?: string): LocaleCurrencyConfig {
  const resolvedLocale = locale || detectLocale();
  const currency = resolveCurrencyFromLocale(resolvedLocale);
  const noun = CURRENCY_NOUN[currency];
  return {
    locale: resolvedLocale,
    currency,
    currencyNoun: noun,
    headline: `Know exactly where every ${noun} goes.`,
  };
}

export function formatLandingMoney(
  amount: number,
  currency: SupportedCurrency,
  locale?: string,
): string {
  const loc = locale || detectLocale();
  try {
    return new Intl.NumberFormat(loc, {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${CURRENCY_SYMBOL[currency]}${amount.toFixed(2)}`;
  }
}

/** Compact stat for hero trust bar (e.g. ₹2.4Cr+ or $2.4M+). */
export function formatLandingCompactTotal(
  currency: SupportedCurrency,
  locale?: string,
): string {
  const loc = locale || detectLocale();
  if (currency === 'INR') {
    return '₹2.4Cr+';
  }
  if (currency === 'GBP') {
    return new Intl.NumberFormat(loc, {
      style: 'currency',
      currency: 'GBP',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(2_400_000);
  }
  if (currency === 'EUR') {
    return new Intl.NumberFormat(loc, {
      style: 'currency',
      currency: 'EUR',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(2_400_000);
  }
  return '$2.4M+';
}

export function scaleDemoAmount(usdAmount: number, currency: SupportedCurrency): number {
  const rate = DEMO_FX_FROM_USD[currency] ?? 1;
  if (currency === 'INR') {
    return Math.round(usdAmount * rate);
  }
  return Math.round(usdAmount * rate * 100) / 100;
}

export interface CashFlowCategory {
  id: string;
  label: string;
  amount: number;
  percent: number;
}

export function getDemoCashFlow(currency: SupportedCurrency): {
  totalIncome: number;
  categories: CashFlowCategory[];
  savingsMomPercent: number;
} {
  const totalIncome = scaleDemoAmount(6450, currency);
  const categories: CashFlowCategory[] = [
    { id: 'rent', label: 'Rent', amount: scaleDemoAmount(2100, currency), percent: 33 },
    { id: 'groceries', label: 'Groceries', amount: scaleDemoAmount(850, currency), percent: 13 },
    { id: 'entertainment', label: 'Entertainment', amount: scaleDemoAmount(500, currency), percent: 8 },
    { id: 'savings', label: 'Savings', amount: scaleDemoAmount(3000, currency), percent: 46 },
  ];
  return { totalIncome, categories, savingsMomPercent: 5.2 };
}

export function getDemoInsights(currency: SupportedCurrency, locale?: string) {
  const loc = locale || detectLocale();
  const monthlySave = scaleDemoAmount(42, currency);
  return [
    {
      title: 'Subscription Audit',
      body: `Identified 3 unused subscriptions saving ${formatLandingMoney(monthlySave, currency, loc)}/mo.`,
    },
    {
      title: 'Grocery Trend',
      body: 'Grocery spending is 15% lower than your 3-month average.',
    },
    {
      title: 'Savings Goal',
      body: 'You are on track to hit your Emergency Fund goal by December.',
    },
  ];
}
