/** Currencies ECB/Frankfurter publishes. */
export const FRANKFURTER_CODES = new Set([
  'AUD', 'BGN', 'BRL', 'CAD', 'CHF', 'CNY', 'CZK', 'DKK', 'EUR', 'GBP',
  'HKD', 'HUF', 'IDR', 'ILS', 'INR', 'ISK', 'JPY', 'KRW', 'MXN', 'MYR',
  'NOK', 'NZD', 'PHP', 'PLN', 'RON', 'SEK', 'SGD', 'THB', 'TRY', 'USD', 'ZAR',
]);

/** Provider catalogue surfaced to the admin UI. */
export const FX_PROVIDERS: {
  id: string;
  label: string;
  requiresKey: boolean;
  note: string;
}[] = [
  {
    id: 'frankfurter',
    label: 'Frankfurter (ECB)',
    requiresKey: false,
    note: 'Free, no key. ~31 major currencies, daily. Base must be supported.',
  },
  {
    id: 'erapi',
    label: 'open.er-api.com',
    requiresKey: false,
    note: 'Free, no key. 160+ currencies incl. BDT/NGN/PKR, daily.',
  },
  {
    id: 'currencyapi',
    label: 'Fawaz currency-api',
    requiresKey: false,
    note: 'Free, no key (CDN). 200+ currencies incl. crypto, daily.',
  },
  {
    id: 'exchangerate_api',
    label: 'ExchangeRate-API (v6)',
    requiresKey: true,
    note: 'Requires a free API key. 160+ currencies.',
  },
];

/** Order the orchestrator falls back through (broad, key-less providers first). */
export const FX_FALLBACK_ORDER = ['erapi', 'currencyapi', 'frankfurter'];
