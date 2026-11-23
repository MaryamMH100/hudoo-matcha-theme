/**
 * Matcha data from product tags.
 *
 * Salla does not give themes per-product custom fields, so the merchant writes
 * small "key:value" tags on each product (guide: docs/merchant-tags.md):
 *
 *   grade:ceremonial   umami:5   sweet:3   bitter:2   body:4   cups:15
 *   harvest:First flush 2026     use:latte
 *
 * Reading is forgiving: Arabic or English keys and values, any letter case,
 * spaces around the separator, `:` `=` or the Arabic/full-width colon, and
 * Arabic-Indic digits (٥). Tags that are not data tags are left alone and still
 * show as normal tags. Missing data simply stays `undefined`, so the matching
 * blocks hide themselves.
 */

export type Grade = 'ceremonial' | 'premium' | 'culinary';
export type TasteKey = 'umami' | 'sweetness' | 'bitterness' | 'body';
export type Use = 'drink' | 'latte' | 'baking';

export interface MatchaData {
  grade?: Grade;
  taste: Partial<Record<TasteKey, number>>;
  cups?: number;
  harvest?: string;
  uses: Use[];
}

type Key = 'grade' | TasteKey | 'cups' | 'harvest' | 'use';

/** Normalise Arabic and Latin text for matching: lower case, no diacritics or
 *  tatweel, one form of alef / ta marbuta / ya, Western digits, single spaces. */
export function normalize(input: string): string {
  return input
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[ً-ْٰـ]/g, '') // harakat, dagger alef, tatweel
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    .replace(/\s+/g, ' ')
    .trim();
}

const KEY_ALIASES: Record<Key, string[]> = {
  grade: ['grade', 'درجه', 'الدرجه'],
  umami: ['umami', 'اومامي', 'امامي'],
  sweetness: ['sweet', 'sweetness', 'حلاوه', 'الحلاوه'],
  bitterness: ['bitter', 'bitterness', 'مراره', 'المراره'],
  body: ['body', 'texture', 'creaminess', 'قوام', 'القوام'],
  cups: ['cups', 'cup', 'اكواب', 'الاكواب', 'كوب'],
  harvest: ['harvest', 'حصاد', 'الحصاد'],
  use: ['use', 'usage', 'استخدام', 'الاستخدام'],
};

const GRADE_ALIASES: Record<Grade, string[]> = {
  ceremonial: ['ceremonial', 'ceremony', 'سيريمونيال', 'سيرامونيال', 'احتفاليه', 'احتفالي', 'طقسيه'],
  premium: ['premium', 'بريميوم', 'ممتازه', 'فاخره'],
  culinary: ['culinary', 'cooking', 'طبخ', 'للطبخ', 'طهي', 'للطهي'],
};

const USE_ALIASES: Record<Use, string[]> = {
  drink: ['drink', 'drinking', 'plain', 'شرب', 'للشرب', 'سادة', 'ساده', 'للشرب ساده'],
  latte: ['latte', 'لاتيه', 'للاتيه', 'لاتيه'],
  baking: ['baking', 'dessert', 'desserts', 'حلويات', 'للحلويات', 'خبز', 'للخبز'],
};

function buildLookup<T extends string>(aliases: Record<T, string[]>): Map<string, T> {
  const map = new Map<string, T>();
  for (const [value, names] of Object.entries(aliases) as [T, string[]][]) {
    for (const name of names) map.set(normalize(name), value);
  }
  return map;
}

const KEYS = buildLookup(KEY_ALIASES);
const GRADES = buildLookup(GRADE_ALIASES);
const USES = buildLookup(USE_ALIASES);

/**
 * `"Umami : ٥"` → `{ key: 'umami', value: '5', rawValue: '٥' }`.
 * The separator is `:` `=` `：`, or — when the store's tag field refuses
 * those — a space, `-` or `_` after a known key (`umami 5`, `grade-premium`).
 */
function splitTag(tag: string): { key: Key; value: string; rawValue: string } | null {
  const match =
    tag.match(/^\s*([^:=：﹕]+?)\s*[:=：﹕]\s*(.+?)\s*$/) ?? tag.match(/^\s*(\S+?)[\s_-]+(.+?)\s*$/);
  if (!match) return null;
  const key = KEYS.get(normalize(match[1]));
  if (!key) return null;
  return { key, value: normalize(match[2]), rawValue: match[2].trim() };
}

function level(value: string): number | undefined {
  const n = Number.parseFloat(value);
  if (!Number.isFinite(n)) return undefined;
  return Math.min(5, Math.max(1, Math.round(n)));
}

type Reading =
  | { key: 'grade'; grade: Grade }
  | { key: 'cups'; cups: number }
  | { key: 'harvest'; harvest: string }
  | { key: 'use'; uses: Use[] }
  | { key: TasteKey; level: number };

/** One tag → its data, or `null` when it is an ordinary tag (or its value is not valid). */
function readTag(tag: string): Reading | null {
  const parts = splitTag(tag);
  if (!parts) return null;
  const { key, value, rawValue } = parts;

  switch (key) {
    case 'grade': {
      const grade = GRADES.get(value);
      return grade ? { key, grade } : null;
    }
    case 'cups': {
      const cups = Number.parseInt(value, 10);
      return Number.isFinite(cups) && cups > 0 && /^\d/.test(value) ? { key, cups } : null;
    }
    case 'harvest':
      return rawValue ? { key, harvest: rawValue } : null;
    case 'use': {
      // `use:latte, baking` is allowed too.
      const uses: Use[] = [];
      for (const one of value.split(/[,،/]| و /)) {
        const use = USES.get(one.trim());
        if (use && !uses.includes(use)) uses.push(use);
      }
      return uses.length ? { key, uses } : null;
    }
    default: {
      const n = /^\d/.test(value) ? level(value) : undefined;
      return n === undefined ? null : { key, level: n };
    }
  }
}

/** Whether a tag is one of ours (so the product page can hide it from the visible tag list). */
export function isDataTag(tag: string): boolean {
  return readTag(tag) !== null;
}

/** Read all matcha data from a product's tags (names or `{ name }` objects).
 *  When a key appears twice, the first tag wins. */
export function parseProductTags(
  tags: ReadonlyArray<string | { name?: string | null }> | null | undefined
): MatchaData {
  const data: MatchaData = { taste: {}, uses: [] };
  for (const item of tags ?? []) {
    const name = typeof item === 'string' ? item : item?.name;
    const reading = name ? readTag(name) : null;
    if (!reading) continue;

    switch (reading.key) {
      case 'grade':
        data.grade ??= reading.grade;
        break;
      case 'cups':
        data.cups ??= reading.cups;
        break;
      case 'harvest':
        data.harvest ??= reading.harvest;
        break;
      case 'use':
        for (const use of reading.uses) if (!data.uses.includes(use)) data.uses.push(use);
        break;
      default:
        data.taste[reading.key] ??= reading.level;
    }
  }
  return data;
}

/** True when there is any taste value to draw. */
export const hasTaste = (data: MatchaData) => Object.keys(data.taste).length > 0;

/** Price per cup, rounded to 0.1 — `undefined` when the pack size is unknown. */
export function costPerCup(price: number | string | null | undefined, cups?: number) {
  const n = typeof price === 'string' ? Number.parseFloat(price) : price;
  if (!cups || !n || !Number.isFinite(n)) return undefined;
  return Math.round((n / cups) * 10) / 10;
}
