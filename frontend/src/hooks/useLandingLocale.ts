import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  SupportedCurrency,
  detectLocale,
  formatLandingCompactTotal,
  formatLandingMoney,
  getDemoCashFlow,
  getDemoInsights,
  getLocaleCurrencyConfig,
} from '../utils/localeCurrency';

const VALID_CURRENCIES: SupportedCurrency[] = ['INR', 'USD', 'GBP', 'EUR'];

function currencyFromQuery(param: string | null): SupportedCurrency | null {
  if (!param) return null;
  const upper = param.toUpperCase() as SupportedCurrency;
  return VALID_CURRENCIES.includes(upper) ? upper : null;
}

export function useLandingLocale() {
  const [searchParams] = useSearchParams();

  return useMemo(() => {
    const locale = detectLocale();
    const queryCurrency = currencyFromQuery(searchParams.get('currency'));
    const base = getLocaleCurrencyConfig(locale);
    const currency = queryCurrency ?? base.currency;
    const noun =
      currency === 'INR'
        ? 'rupee'
        : currency === 'GBP'
          ? 'pound'
          : currency === 'EUR'
            ? 'euro'
            : 'dollar';
    const headline = `Know exactly where every ${noun} goes.`;

    return {
      locale,
      currency,
      currencyNoun: noun,
      headline,
      formatMoney: (amount: number) => formatLandingMoney(amount, currency, locale),
      expensesTrackedStat: formatLandingCompactTotal(currency, locale),
      cashFlow: getDemoCashFlow(currency),
      insights: getDemoInsights(currency, locale),
    };
  }, [searchParams]);
}
