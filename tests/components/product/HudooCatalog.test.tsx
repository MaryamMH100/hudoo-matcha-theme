import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import type { Category, Product } from '@salla.sa/twilight-theme-engine/types';
import {
  GradeFilter,
  UseChips,
  gradeSubcategories,
  matchesFacets,
  presentFacets,
} from '../../../app/components/product/HudooCatalog';

vi.mock('@salla.sa/twilight-theme-engine/i18n', async () => {
  const en = (await import('../../../locales/en.json')).default as Record<string, string>;
  return { useTranslation: () => ({ t: (k: string, fb?: string) => en[k] ?? fb ?? k, locale: 'en' }) };
});
vi.mock('@salla.sa/twilight-theme-engine/providers', () => ({ useTwilight: () => ({ theme: { settings: {} } }) }));
vi.mock('@salla.sa/twilight-theme-engine/common', () => ({
  Link: ({ to, children, className }: Record<string, unknown>) => (
    <a href={String(to)} className={String(className ?? '')}>
      {children as never}
    </a>
  ),
}));

const p = (tags: string[], category?: string) =>
  ({ id: Math.random(), tags: tags.map((name) => ({ name, url: '' })), category: category ? { name: category } : undefined }) as unknown as Product;

describe('category facets', () => {
  const products = [
    p(['grade:culinary', 'use:baking']),
    p(['grade:ceremonial', 'use:drink']),
    p([], 'ماتشا بريميوم'),
    p(['use:latte']),
  ];

  it('lists the grades and uses present, in display order', () => {
    expect(presentFacets(products)).toEqual({
      grades: ['ceremonial', 'premium', 'culinary'],
      uses: ['drink', 'latte', 'baking'],
    });
  });

  it('matches by grade and use', () => {
    expect(products.filter((x) => matchesFacets(x, 'premium', null))).toHaveLength(1);
    expect(products.filter((x) => matchesFacets(x, 'all', 'latte'))).toHaveLength(1);
    expect(products.filter((x) => matchesFacets(x, 'all', null))).toHaveLength(4);
  });

  it('finds grade sub-categories (two or more) by their names', () => {
    const category = {
      sub_categories: [
        { name: 'للطبخ', url: '/c/3' },
        { name: 'Ceremonial', url: '/c/1' },
        { name: 'أدوات', url: '/c/9' },
      ],
    } as unknown as Category;
    expect(gradeSubcategories(category)).toEqual([
      { grade: 'ceremonial', url: '/c/1' },
      { grade: 'culinary', url: '/c/3' },
    ]);
    expect(gradeSubcategories({ sub_categories: [{ name: 'Premium', url: '/c/2' }] } as unknown as Category)).toEqual([]);
  });
});

describe('GradeFilter / UseChips', () => {
  it('filters in place with pressed buttons', () => {
    const onChange = vi.fn();
    render(<GradeFilter links={[]} grades={['ceremonial', 'premium']} value="all" onChange={onChange} />);
    expect(screen.getByRole('button', { name: 'All' }).getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(screen.getByRole('button', { name: 'Premium' }));
    expect(onChange).toHaveBeenCalledWith('premium');
  });

  it('links to grade sub-categories when there are some', () => {
    render(
      <GradeFilter
        links={[{ grade: 'ceremonial', url: '/c/1' }, { grade: 'premium', url: '/c/2' }]}
        grades={[]}
        value="all"
        onChange={() => {}}
      />
    );
    expect(screen.getByRole('link', { name: 'Premium' }).getAttribute('href')).toBe('/c/2');
  });

  it('hides the grade filter with fewer than two grades, and toggles a chip off', () => {
    const { container } = render(<GradeFilter links={[]} grades={['premium']} value="all" onChange={() => {}} />);
    expect(container.innerHTML).toBe('');
    const onChange = vi.fn();
    render(<UseChips uses={['latte']} value="latte" onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'For lattes' }));
    expect(onChange).toHaveBeenCalledWith(null);
  });
});
