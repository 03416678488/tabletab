/**
 * Locale registry — framework-agnostic so both the proxy (server/edge) and the
 * client I18nProvider share one source of truth. A locale is a language+region
 * pair (BCP-47), e.g. `en-ae` = English as used in the UAE. The URL form is
 * lowercase (`/en-ae/...`); the `bcp47` form (`en-AE`) is what `Intl` wants.
 */

export interface LocaleDef {
  /** URL + storage form, lowercase: `en-ae`. */
  code: string;
  /** Intl/`lang` form: `en-AE`. */
  bcp47: string;
  /** Dictionary key — which translation file to load (`en`, `ar`, ...). */
  language: string;
  /** ISO-3166 region: `AE`. */
  region: string;
  /** ISO-4217 currency the region prices in: `AED`. */
  currency: string;
  /** Human label for switchers. */
  label: string;
  dir: "ltr" | "rtl";
}

export const LOCALES: LocaleDef[] = [
  { code: "en-us", bcp47: "en-US", language: "en", region: "US", currency: "USD", label: "English (US)", dir: "ltr" },
  { code: "en-ae", bcp47: "en-AE", language: "en", region: "AE", currency: "AED", label: "English (UAE)", dir: "ltr" },
  { code: "en-gb", bcp47: "en-GB", language: "en", region: "GB", currency: "GBP", label: "English (UK)", dir: "ltr" },
  { code: "ar-ae", bcp47: "ar-AE", language: "ar", region: "AE", currency: "AED", label: "العربية (الإمارات)", dir: "rtl" },
  { code: "de-de", bcp47: "de-DE", language: "de", region: "DE", currency: "EUR", label: "Deutsch (Deutschland)", dir: "ltr" },
  { code: "bn-bd", bcp47: "bn-BD", language: "bn", region: "BD", currency: "BDT", label: "বাংলা (বাংলাদেশ)", dir: "ltr" },
];

export const DEFAULT_LOCALE = "en-us";

/** Cookie the proxy sets (and the provider reads) to remember the choice. */
export const LOCALE_COOKIE = "tabletap.locale";

/** Cookie holding a display-currency override, independent of the region. */
export const CURRENCY_COOKIE = "tabletap.currency";

/** Human names for the language dropdown (language subtag → native label). */
export const LANGUAGE_LABELS: Record<string, string> = {
  en: "English",
  ar: "العربية",
  de: "Deutsch",
  bn: "বাংলা",
};

/** One entry per language (deduped from LOCALES), for a language-only switcher. */
export const LANGUAGES = LOCALES.reduce<{ language: string; label: string }[]>((acc, l) => {
  if (!acc.some((x) => x.language === l.language)) {
    acc.push({ language: l.language, label: LANGUAGE_LABELS[l.language] ?? l.language });
  }
  return acc;
}, []);

/** Pick the best locale code for a language, keeping `region` when that combo
 *  exists (e.g. ar + AE → ar-ae), else the first locale for that language. */
export function localeForLanguage(language: string, region: string): string {
  const sameRegion = LOCALES.find((l) => l.language === language && l.region === region);
  if (sameRegion) return sameRegion.code;
  const anyForLang = LOCALES.find((l) => l.language === language);
  return (anyForLang ?? LOCALES[0]).code;
}

export const LOCALE_CODES = LOCALES.map((l) => l.code);

const BY_CODE = new Map(LOCALES.map((l) => [l.code, l]));

export function isLocaleCode(value: string | undefined | null): value is string {
  return !!value && BY_CODE.has(value.toLowerCase());
}

/** Resolve a code to its definition, falling back to the default locale. */
export function getLocale(code: string | undefined | null): LocaleDef {
  return (code && BY_CODE.get(code.toLowerCase())) || BY_CODE.get(DEFAULT_LOCALE)!;
}

/**
 * Best locale for a visitor, in priority order:
 *   1. a valid `preferred` (saved cookie / explicit choice)
 *   2. language from Accept-Language, paired with `country` (geo header) when it
 *      yields a supported locale — else the first locale in that language
 *   3. DEFAULT_LOCALE
 * `country` is an ISO-3166 code (e.g. from x-vercel-ip-country / cf-ipcountry);
 * it is often absent (localhost), in which case only the language is used.
 */
export function detectLocale(opts: {
  preferred?: string | null;
  acceptLanguage?: string | null;
  country?: string | null;
}): string {
  if (isLocaleCode(opts.preferred)) return opts.preferred!.toLowerCase();

  const region = opts.country?.toUpperCase();
  const languages = parseAcceptLanguage(opts.acceptLanguage);

  for (const lang of languages) {
    // Prefer an exact language+region match when we know the country.
    if (region) {
      const exact = LOCALES.find((l) => l.language === lang && l.region === region);
      if (exact) return exact.code;
    }
    const byLang = LOCALES.find((l) => l.language === lang);
    if (byLang) return byLang.code;
  }

  // No language matched but we do know the country — try any locale there.
  if (region) {
    const byRegion = LOCALES.find((l) => l.region === region);
    if (byRegion) return byRegion.code;
  }

  return DEFAULT_LOCALE;
}

/** Ordered, de-duped language subtags from an Accept-Language header. */
function parseAcceptLanguage(header: string | undefined | null): string[] {
  if (!header) return [];
  const seen = new Set<string>();
  return header
    .split(",")
    .map((part) => {
      const [tag, q] = part.trim().split(";q=");
      return { lang: tag.split("-")[0].toLowerCase(), q: q ? parseFloat(q) : 1 };
    })
    .filter((x) => x.lang && !Number.isNaN(x.q))
    .sort((a, b) => b.q - a.q)
    .map((x) => x.lang)
    .filter((lang) => (seen.has(lang) ? false : (seen.add(lang), true)));
}

/**
 * Split a pathname into its locale prefix (if any) and the rest.
 * `/en-ae/checkout` → { locale: 'en-ae', rest: '/checkout' }
 * `/checkout`       → { locale: null,    rest: '/checkout' }
 */
export function splitLocalePath(pathname: string): { locale: string | null; rest: string } {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length && isLocaleCode(segments[0])) {
    const locale = segments[0].toLowerCase();
    const rest = "/" + segments.slice(1).join("/");
    return { locale, rest: rest === "/" ? "/" : rest };
  }
  return { locale: null, rest: pathname };
}

/** Prefix a path with a locale: `withLocale('en-ae', '/checkout')` → `/en-ae/checkout`. */
export function withLocale(locale: string, path: string): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  return clean === "/" ? `/${locale}` : `/${locale}${clean}`;
}
