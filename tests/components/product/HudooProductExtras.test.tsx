import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { Product } from '@salla.sa/twilight-theme-engine/types';
import {
  BrewSteps,
  CostPerCup,
  ProductBadges,
  TasteProfile,
} from '../../../app/components/product/HudooProductExtras';

const settings = vi.hoisted(() => ({ value: {} as Record<string, unknown> }));

vi.mock('@salla.sa/twilight-theme-engine/i18n', async () => {
  const ar = (await import('../../../locales/ar.json')).default as Record<string, string>;
  return { useTranslation: () => ({ t: (k: string, fb?: string) => ar[k] ?? fb ?? k, locale: 'ar' }) };
});
vi.mock('@salla.sa/twilight-theme-engine/providers', () => ({
  useTwilight: () => ({ theme: { settings: settings.value } }),
}));
vi.mock('@salla.sa/twilight-theme-engine/hooks/useMoney', () => ({
  useMoney: () => ({ format: (n: number) => `${n} ر.س` }),
}));
vi.mock('@salla.sa/twilight-theme-engine/common', () => ({
  Link: ({ to, children }: Record<string, unknown>) => <a href={String(to)}>{children as never}</a>,
  Image: () => <img alt="" />,
}));
vi.mock('@salla.sa/twilight-theme-engine/api/product', () => ({
  product: { queries: { list: () => ({ queryKey: ['x'], queryFn: async () => ({ items: [] }) }) } },
}));

const matcha = {
  id: 1,
  name: 'ماتشا',
  price: 129,
  is_on_sale: false,
  tags: ['grade:ceremonial', 'harvest:الحصاد الأول ٢٠٢٦', 'umami:5', 'sweet:4', 'bitter:1', 'body:4', 'cups:15'].map(
    (name) => ({ name, url: '' })
  ),
} as unknown as Product;
const whisk = { id: 2, name: 'مخفقة', price: 59, is_on_sale: false, tags: [] } as unknown as Product;

describe('product extras', () => {
  it('shows grade and harvest badges, and cost per cup', () => {
    render(
      <>
        <ProductBadges product={matcha} />
        <CostPerCup product={matcha} />
      </>
    );
    expect(screen.getByText('سيريمونيال')).toBeTruthy();
    expect(screen.getByText('الحصاد الأول ٢٠٢٦')).toBeTruthy();
    expect(screen.getByText(/8.6 ر.س/)).toBeTruthy();
  });

  it('draws one bar per taste with a word for its level', () => {
    const { container } = render(<TasteProfile product={matcha} />);
    expect(screen.getByText('بروفايل الطعم')).toBeTruthy();
    expect(screen.getByText('غني')).toBeTruthy(); // umami 5
    expect(screen.getByText('طبيعية')).toBeTruthy(); // sweetness 4
    expect(screen.getByText('خفيفة جدًا')).toBeTruthy(); // bitterness 1
    expect(container.querySelectorAll('.hd-taste__row')).toHaveLength(4);
    expect(container.querySelectorAll('.hd-taste__row')[0].querySelectorAll('.is-on')).toHaveLength(5);
  });

  it('hides everything on a product without matcha data', () => {
    settings.value = { product_brew_steps: [{ icon: 'spoon', text: 'انخل' }] };
    const { container } = render(
      <>
        <ProductBadges product={whisk} />
        <CostPerCup product={whisk} />
        <TasteProfile product={whisk} />
        <BrewSteps product={whisk} />
      </>
    );
    expect(container.innerHTML).toBe('');
  });

  it('shows the brew steps from the settings on matcha products', () => {
    settings.value = {
      product_brew_title: 'طريقة التحضير',
      product_brew_steps: [
        { icon: 'spoon', text: 'انخل 2 جم', hint: 'النخل يمنع الكتل' },
        { icon: 'thermo', text: 'أضف 70 مل ماء' },
      ],
    };
    render(<BrewSteps product={matcha} />);
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
    expect(screen.getByText('النخل يمنع الكتل')).toBeTruthy();
    settings.value = { ...settings.value, product_brew_enabled: false };
  });
});
