/**
 * Small helpers for reading merchant settings safely.
 * A multilanguage text field can arrive as a plain string (already in the
 * visitor's language) or as `{ ar, en }`; a missing value means "not set".
 */
export function localizedText(raw: unknown, locale: string | undefined): string {
  if (typeof raw === 'string') return raw.trim();
  if (raw && typeof raw === 'object') {
    const map = raw as Record<string, unknown>;
    const lang = (locale || 'ar').slice(0, 2);
    const value = map[lang] ?? map.ar ?? map.en;
    return typeof value === 'string' ? value.trim() : '';
  }
  return '';
}

/** Only http(s) links or site-relative paths; anything else is dropped. */
export function safeUrl(raw: unknown): string | undefined {
  if (typeof raw !== 'string') return undefined;
  const value = raw.trim();
  if (/^https?:\/\//i.test(value) || (value.startsWith('/') && !value.startsWith('//'))) {
    return value;
  }
  return undefined;
}

/** A setting that is on unless the merchant explicitly turned it off. */
export const isOn = (raw: unknown) => raw !== false;
