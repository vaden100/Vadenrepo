import { en, type Strings } from './strings.en';

export { en, type Strings };

export const locales = ['en'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'en';

const dictionaries: Record<Locale, Strings> = { en };

/** Strings for a locale. Unknown locales fall back to English. */
export function strings(locale: string = defaultLocale): Strings {
  return dictionaries[locale as Locale] ?? en;
}

/** Fills `{name}` slots: format('Hi {name}', { name: 'Dub' }). */
export function format(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (m, k: string) => (k in values ? String(values[k]) : m));
}

/** Flattens a strings object to `a.b.c` keys (used by the copy and readability checks). */
export function flatten(obj: unknown, prefix = ''): Array<[key: string, value: string]> {
  if (typeof obj === 'string') return [[prefix, obj]];
  if (!obj || typeof obj !== 'object') return [];
  return Object.entries(obj).flatMap(([k, v]) => flatten(v, prefix ? `${prefix}.${k}` : k));
}

/** "once a month", "twice a month", "3 times a month". */
export function perMonth(n: number, locale: string = defaultLocale): string {
  const f = strings(locale).frequency;
  if (n === 1) return f.once;
  if (n === 2) return f.twice;
  return format(f.many, { n });
}
