import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import type { Product } from '@salla.sa/twilight-theme-engine/types';
import { HudooProductCard } from '../../../app/components/product/HudooProductCard';

const wishlist = vi.hoisted(() => ({ ids: new Set<number>(), toggle: vi.fn() }));

vi.mock('@salla.sa/twilight-theme-engine/i18n', async () => {
  const ar = (await import('../../../locales/ar.json')).default as Record<string, string>;
  return { useTranslation: () => ({ t: (k: string, fb?: string) => ar[k] ?? fb ?? k, locale: 'ar' }) };
});
vi.mock('@salla.sa/twilight-theme-engine/common', () => ({
  Link: ({ to, children, className, ...rest }: Record<string, unknown>) => (
    <a href={String(to)} className={String(className ?? '')} aria-label={rest['aria-label'] as string}>
      {children as never}
    </a>
  ),
  Image: ({ src }: Record<string, unknown>) => <img alt="" src={String(src)} />,
}));
vi.mock('@salla.sa/twilight-theme-engine/hooks/useMoney', () => ({
  useMoney: () => ({ format: (n: number) => `${n} ر.س` }),
}));
vi.mock('@salla.sa/twilight-theme-engine/hooks/useWishlist', () => ({
  useWishlist: () => ({ has: (id: number) => wishlist.ids.has(id), toggle: wishlist.toggle }),
}));
vi.mock('@salla.sa/twilight-components-react/add-product-button', () => ({
  SallaAddProductButton: ({ children, productId }: { children?: unknown; productId: number }) => (
    <salla-add-product-button data-product-id={productId}>{children as never}</salla-add-product-button>
  ),
}));

const base = {
  id: '101' as unknown as number,
  name: 'ماتشا سيريمونيال · أوجي',
  url: 'https://store.test/p101',
  price: 129,
  regular_price: 129,
  sale_price: null,
  is_on_sale: false,
  is_out_of_stock: false,
  status: 'sale',
  type: 'product',
  image: { url: 'https://cdn.test/a.jpg' },
  weight: '30 جم',
  tags: [{ name: 'grade:ceremonial', url: '' }, { name: 'use:drink', url: '' }],
} as unknown as Product;

describe('HudooProductCard', () => {
  it('shows grade, name, meta line, price and the add button', () => {
    const { container } = render(<HudooProductCard product={base} />);
    expect(screen.getByText('سيريمونيال')).toBeTruthy();
    expect(screen.getByRole('link', { name: base.name }).getAttribute('href')).toBe(base.url);
    expect(screen.getByText('30 جم · للشرب سادة')).toBeTruthy();
    expect(screen.getByText('129 ر.س')).toBeTruthy();
    expect(container.querySelector('salla-add-product-button')?.getAttribute('data-product-id')).toBe('101');
  });

  it('shows the old price and a discount badge on sale', () => {
    render(<HudooProductCard product={{ ...base, is_on_sale: true, sale_price: 99, regular_price: 129 }} />);
    expect(screen.getByText('99 ر.س')).toBeTruthy();
    expect(screen.getByText('129 ر.س').tagName).toBe('S');
    expect(screen.getByText('خصم 23%')).toBeTruthy();
  });

  it('marks a sold-out product and hides the add button', () => {
    const { container } = render(<HudooProductCard product={{ ...base, is_out_of_stock: true }} />);
    expect(screen.getByText('نفدت الكمية')).toBeTruthy();
    expect(container.querySelector('salla-add-product-button')).toBeNull();
    expect(container.querySelector('.hd-card.is-sold-out')).toBeTruthy();
  });

  it('sends products with options to their page instead of adding', () => {
    const { container } = render(<HudooProductCard product={{ ...base, has_options: true }} />);
    expect(container.querySelector('salla-add-product-button')).toBeNull();
    expect(screen.getByRole('link', { name: /اختر الخيارات/ }).getAttribute('href')).toBe(base.url);
  });

  it('works without matcha data or a photo, and toggles the wishlist', () => {
    const { container } = render(<HudooProductCard product={{ ...base, tags: [], weight: null, image: {} as never }} />);
    expect(container.querySelector('.hd-card__grade')).toBeNull();
    expect(container.querySelector('.hd-card__meta')).toBeNull();
    expect(container.querySelector('.hd-card__placeholder')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Add or remove to wishlist' }));
    expect(wishlist.toggle).toHaveBeenCalledWith(101);
  });
});
