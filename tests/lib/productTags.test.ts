import { describe, expect, it } from 'vitest';
import {
  costPerCup,
  hasTaste,
  isDataTag,
  normalize,
  parseProductTags,
} from '../../app/lib/productTags';

describe('parseProductTags', () => {
  it('reads the English convention', () => {
    const data = parseProductTags([
      'grade:ceremonial',
      'umami:5',
      'sweet:3',
      'bitter:2',
      'body:4',
      'cups:15',
      'harvest:First flush 2026',
      'use:drink',
    ]);
    expect(data).toEqual({
      grade: 'ceremonial',
      taste: { umami: 5, sweetness: 3, bitterness: 2, body: 4 },
      cups: 15,
      harvest: 'First flush 2026',
      uses: ['drink'],
    });
  });

  it('is forgiving: case, spaces, other separators', () => {
    const data = parseProductTags(['Grade : Premium', ' UMAMI=4 ', 'Sweetness：3', 'cups 30', 'bitter-2']);
    expect(data.grade).toBe('premium');
    expect(data.taste).toEqual({ umami: 4, sweetness: 3, bitterness: 2 });
    expect(data.cups).toBe(30);
  });

  it('reads Arabic keys and values, with Arabic-Indic digits and diacritics', () => {
    const data = parseProductTags([
      'الدرجة: احتفالية',
      'أومامي: ٥',
      'حلاوة:٣',
      'مَرارة : 1',
      'أكواب: ١٥',
      'الحصاد: الحصاد الأول ٢٠٢٦',
      'استخدام: لاتيه، حلويات',
    ]);
    expect(data.grade).toBe('ceremonial');
    expect(data.taste).toEqual({ umami: 5, sweetness: 3, bitterness: 1 });
    expect(data.cups).toBe(15);
    expect(data.harvest).toBe('الحصاد الأول ٢٠٢٦');
    expect(data.uses).toEqual(['latte', 'baking']);
  });

  it('knows each grade in both languages', () => {
    expect(parseProductTags(['grade:culinary']).grade).toBe('culinary');
    expect(parseProductTags(['درجة:للطبخ']).grade).toBe('culinary');
    expect(parseProductTags(['درجة:بريميوم']).grade).toBe('premium');
    expect(parseProductTags(['grade:سيريمونيال']).grade).toBe('ceremonial');
  });

  it('clamps taste to 1–5 and ignores bad values', () => {
    const data = parseProductTags(['umami:9', 'sweet:0', 'bitter:abc', 'cups:-3', 'grade:gold']);
    expect(data.taste).toEqual({ umami: 5, sweetness: 1 });
    expect(data.cups).toBeUndefined();
    expect(data.grade).toBeUndefined();
  });

  it('accepts Salla tag objects and keeps the first value of a repeated key', () => {
    const data = parseProductTags([{ name: 'grade:premium' }, { name: 'grade:culinary' }, { name: null }]);
    expect(data.grade).toBe('premium');
  });

  it('returns empty data for products without matcha tags', () => {
    const data = parseProductTags(['new', 'gift', 'كوب ماتشا']);
    expect(data).toEqual({ taste: {}, uses: [] });
    expect(hasTaste(data)).toBe(false);
    expect(parseProductTags(undefined)).toEqual({ taste: {}, uses: [] });
  });
});

describe('isDataTag', () => {
  it('separates data tags from ordinary tags', () => {
    expect(isDataTag('grade:ceremonial')).toBe(true);
    expect(isDataTag('أومامي ٥')).toBe(true);
    expect(isDataTag('هدية')).toBe(false);
    expect(isDataTag('كوب ماتشا')).toBe(false);
    expect(isDataTag('first-flush')).toBe(false);
  });
});

describe('helpers', () => {
  it('normalises Arabic letter forms', () => {
    expect(normalize('  الإحتفاليّة  ')).toBe('الاحتفاليه');
  });

  it('computes cost per cup', () => {
    expect(costPerCup(129, 15)).toBe(8.6);
    expect(costPerCup('349', 50)).toBe(7);
    expect(costPerCup(129, undefined)).toBeUndefined();
  });
});

describe('detectGrade / productGrade', () => {
  it('finds a grade inside a category name, in either language', async () => {
    const { detectGrade } = await import('../../app/lib/productTags');
    expect(detectGrade('ماتشا سيريمونيال')).toBe('ceremonial');
    expect(detectGrade('Premium Matcha')).toBe('premium');
    expect(detectGrade('للطبخ')).toBe('culinary');
    expect(detectGrade('أدوات التحضير')).toBeUndefined();
    expect(detectGrade(null)).toBeUndefined();
  });

  it('prefers the grade tag over the category name', async () => {
    const { productGrade } = await import('../../app/lib/productTags');
    expect(productGrade({ tags: [{ name: 'grade:premium' }], category: { name: 'سيريمونيال' } })).toBe('premium');
    expect(productGrade({ tags: [], category: { name: 'ماتشا للطبخ' } })).toBe('culinary');
    expect(productGrade({})).toBeUndefined();
  });
});
