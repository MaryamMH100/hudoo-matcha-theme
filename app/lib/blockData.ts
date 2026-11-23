/**
 * Read a home block's `data` safely. Salla sends each field in a few possible
 * shapes (a multilanguage text as a string or `{ ar, en }`, an image as a URL
 * or `{ url }`, a link as a URL, `{ url }` or `[{ url }]`, a number as a number
 * or a string). These helpers turn each into one plain value, or `undefined`
 * when the merchant left it empty, so a block can hide what is missing.
 */
import { localizedText, safeUrl } from './settings';
import type { Product } from '@salla.sa/twilight-theme-engine/types';

/** Text in the visitor's language; `fallback` only when the field was never set. */
export function blockText(raw: unknown, locale: string | undefined, fallback = ''): string {
  if (raw === undefined || raw === null) return fallback;
  return localizedText(raw, locale);
}

function firstOf(raw: unknown): unknown {
  return Array.isArray(raw) ? raw[0] : raw;
}

/** An image field: `'https://…'` or `{ url }`. */
export function blockImage(raw: unknown): string | undefined {
  const value = firstOf(raw);
  if (typeof value === 'string') return safeUrl(value);
  if (value && typeof value === 'object') {
    const obj = value as { url?: unknown; src?: unknown };
    return safeUrl(obj.url ?? obj.src);
  }
  return undefined;
}

/** A link field (`url`, `variable-list`): `'/x'`, `{ url }`, `{ value }` or `[{ … }]`.
 *  `#` and empty mean "no link". In-page anchors (`#grade-finder`) are kept. */
export function blockLink(raw: unknown): string | undefined {
  const value = firstOf(raw);
  let url: unknown = value;
  if (value && typeof value === 'object') {
    const obj = value as { url?: unknown; value?: unknown; link?: unknown };
    url = obj.url ?? obj.link ?? obj.value;
  }
  if (typeof url !== 'string') return undefined;
  const trimmed = url.trim();
  if (/^#[\w-]+$/.test(trimmed)) return trimmed;
  return safeUrl(trimmed);
}

/** A whole number in `[min, max]`, or `undefined`. */
export function blockNumber(raw: unknown, min: number, max: number): number | undefined {
  const n = typeof raw === 'string' ? Number(raw.trim()) : raw;
  if (typeof n !== 'number' || !Number.isFinite(n)) return undefined;
  return Math.min(max, Math.max(min, Math.round(n)));
}

/** A dropdown value (`'x'` or `[{ value: 'x' }]`). */
export function blockChoice<T extends string>(raw: unknown, allowed: readonly T[]): T | undefined {
  const value = firstOf(raw);
  const v = typeof value === 'string' ? value : (value as { value?: unknown } | undefined)?.value;
  return (allowed as readonly unknown[]).includes(v) ? (v as T) : undefined;
}

/** Product ids from a products picker (`[{ id }]`, `[id]` or `{ source_value }`). */
export function blockProductIds(raw: unknown): number[] {
  if (Array.isArray(raw)) {
    return raw
      .map((item) =>
        typeof item === 'object' && item ? Number((item as Partial<Product>).id) : Number(item)
      )
      .filter((id) => Number.isInteger(id) && id > 0);
  }
  if (raw && typeof raw === 'object' && 'source_value' in raw) {
    return blockProductIds((raw as { source_value?: unknown }).source_value);
  }
  return [];
}

/** A collection field: always an array of objects. */
export function blockItems<T extends object = Record<string, unknown>>(raw: unknown): T[] {
  return Array.isArray(raw) ? (raw.filter((x) => x && typeof x === 'object') as T[]) : [];
}
