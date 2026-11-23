import { describe, expect, it } from 'vitest';
import {
  blockChoice,
  blockImage,
  blockItems,
  blockLink,
  blockNumber,
  blockProductIds,
  blockText,
} from '../../app/lib/blockData';

describe('blockData', () => {
  it('reads text in the visitor language, with a fallback only when never set', () => {
    expect(blockText('مرحبا', 'ar')).toBe('مرحبا');
    expect(blockText({ ar: 'مرحبا', en: 'Hello' }, 'en')).toBe('Hello');
    expect(blockText(undefined, 'ar', 'x')).toBe('x');
    expect(blockText('', 'ar', 'x')).toBe('');
  });

  it('reads images as a URL or { url }, and drops unsafe values', () => {
    expect(blockImage('https://cdn.salla.sa/a.jpg')).toBe('https://cdn.salla.sa/a.jpg');
    expect(blockImage({ url: '/a.webp' })).toBe('/a.webp');
    expect(blockImage('javascript:alert(1)')).toBeUndefined();
    expect(blockImage(null)).toBeUndefined();
  });

  it('reads links in every shape Salla sends, keeping page anchors', () => {
    expect(blockLink('/categories/1')).toBe('/categories/1');
    expect(blockLink([{ url: 'https://store.test/c/1' }])).toBe('https://store.test/c/1');
    expect(blockLink({ value: '/offers' })).toBe('/offers');
    expect(blockLink('#grade-finder')).toBe('#grade-finder');
    expect(blockLink('#')).toBeUndefined();
    expect(blockLink([])).toBeUndefined();
  });

  it('clamps numbers and reads dropdowns', () => {
    expect(blockNumber('7', 1, 5)).toBe(5);
    expect(blockNumber(0, 1, 5)).toBe(1);
    expect(blockNumber('x', 1, 5)).toBeUndefined();
    expect(blockChoice([{ value: 'premium' }], ['ceremonial', 'premium'] as const)).toBe('premium');
    expect(blockChoice('gold', ['ceremonial'] as const)).toBeUndefined();
  });

  it('collects product ids from a products picker', () => {
    expect(blockProductIds([{ id: 12 }, { id: '13' }, 14, { name: 'x' }])).toEqual([12, 13, 14]);
    expect(blockProductIds({ source: 'selected', source_value: [5] })).toEqual([5]);
    expect(blockProductIds(undefined)).toEqual([]);
  });

  it('keeps only objects in a collection', () => {
    expect(blockItems([{ a: 1 }, null, 'x'])).toEqual([{ a: 1 }]);
    expect(blockItems('x')).toEqual([]);
  });
});
