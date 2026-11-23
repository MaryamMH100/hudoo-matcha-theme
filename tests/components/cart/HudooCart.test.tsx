import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { Cart } from '@salla.sa/twilight-theme-engine/types';
import { FreeShippingProgress, freeShippingState } from '../../../app/components/cart/HudooCart';

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
vi.mock('@salla.sa/twilight-theme-engine/common', () => ({ Link: () => null, Image: () => null }));
vi.mock('@salla.sa/twilight-theme-engine/api/product', () => ({ product: { queries: { list: () => ({}) } } }));

const cart = (sub_total: number, extra: Partial<Cart> = {}) => ({ sub_total, items: [], ...extra }) as unknown as Cart;

describe('freeShippingState', () => {
  it('uses the theme threshold first', () => {
    expect(freeShippingState(cart(188), 199)).toEqual({ threshold: 199, remaining: 11, percent: (188 / 199) * 100 });
  });

  it("falls back to the store's own rule, and stops at 100%", () => {
    expect(freeShippingState(cart(50, { free_shipping_bar: { minimum_amount: 100, has_free_shipping: false } } as never), undefined)?.remaining).toBe(50);
    expect(freeShippingState(cart(250), 199)).toEqual({ threshold: 199, remaining: 0, percent: 100 });
  });

  it('shows nothing without a threshold, or for carts that need no shipping', () => {
    expect(freeShippingState(cart(10), undefined)).toBeNull();
    expect(freeShippingState(cart(10, { is_require_shipping: false }), 199)).toBeNull();
  });
});

describe('FreeShippingProgress', () => {
  it('puts the remaining amount where the merchant wrote {amount}', () => {
    settings.value = { free_shipping_threshold: 199 };
    render(<FreeShippingProgress cart={cart(188)} />);
    expect(screen.getByText('11 ر.س')).toBeTruthy();
    expect(screen.getByText(/وتوصلك مبرّدة مجانًا/)).toBeTruthy();
    expect(screen.getByRole('progressbar').getAttribute('aria-valuenow')).toBe('94');
  });

  it('celebrates once reached, and can be switched off', () => {
    settings.value = { free_shipping_threshold: 199 };
    render(<FreeShippingProgress cart={cart(300)} />);
    expect(screen.getByText('وصلت للشحن المبرّد المجاني')).toBeTruthy();
    settings.value = { free_shipping_threshold: 199, free_shipping_enabled: false };
    const { container } = render(<FreeShippingProgress cart={cart(10)} />);
    expect(container.innerHTML).toBe('');
  });
});
