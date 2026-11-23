import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Image, Link } from '@salla.sa/twilight-theme-engine/common';
import { useMoney } from '@salla.sa/twilight-theme-engine/hooks/useMoney';
import { useTranslation } from '@salla.sa/twilight-theme-engine/i18n';
import { useTwilight } from '@salla.sa/twilight-theme-engine/providers';
import { product as productApi } from '@salla.sa/twilight-theme-engine/api/product';
import type { Cart, Product } from '@salla.sa/twilight-theme-engine/types';
import { BrandIcon } from '../brandIcons';
import { blockNumber, blockText } from '../../lib/blockData';
import { isOn } from '../../lib/settings';

/**
 * Cart page additions — Figma «04 · Cart»: the title with the item count, the
 * free-shipping progress bar and the «يكمّل طقسك» upsell. Salla's own
 * `CartSummary` (coupon, gift, loyalty, totals, checkout) stays as it is.
 * Styling: `04-components/hudoo-cart.scss`.
 */

function useSettings() {
  const { theme } = useTwilight();
  return (theme?.settings ?? {}) as Record<string, unknown>;
}

/** «السلة (2)» */
export function CartHead({ count }: { count: number }) {
  const { t } = useTranslation();
  return (
    <h1 className="hd-display hd-cart-head">
      {t('common.titles.cart', 'Cart')} <span className="hd-cart-head__count">({count})</span>
    </h1>
  );
}

/**
 * How far the cart is from free shipping. The threshold is the theme setting
 * `free_shipping_threshold`; when it is empty, the store's own free-shipping
 * rule from Salla (`cart.free_shipping_bar`) is used. Nothing shows when there
 * is neither, or when the cart needs no shipping.
 */
export function freeShippingState(cart: Pick<Cart, 'sub_total' | 'free_shipping_bar' | 'is_require_shipping'>, setting: unknown) {
  if (cart.is_require_shipping === false) return null;
  const threshold = blockNumber(setting, 1, 1_000_000) ?? cart.free_shipping_bar?.minimum_amount;
  if (!threshold) return null;
  const subtotal = Number(cart.sub_total) || 0;
  const remaining = Math.max(0, Math.round((threshold - subtotal) * 100) / 100);
  const reached = remaining === 0 || cart.free_shipping_bar?.has_free_shipping === true;
  return { threshold, remaining: reached ? 0 : remaining, percent: reached ? 100 : Math.min(100, (subtotal / threshold) * 100) };
}

export function FreeShippingProgress({ cart }: { cart: Cart }) {
  const { t, locale } = useTranslation();
  const { format } = useMoney();
  const settings = useSettings();
  if (!isOn(settings.free_shipping_enabled)) return null;
  const state = freeShippingState(cart, settings.free_shipping_threshold);
  if (!state) return null;

  const remainingText =
    blockText(settings.free_shipping_text, locale) ||
    t('blocks.hudoo.free_shipping_left', '{amount} more for free shipping');
  const doneText =
    blockText(settings.free_shipping_done_text, locale) ||
    t('blocks.hudoo.free_shipping_done', 'Your order ships free');
  // `{amount}` becomes the formatted price, wherever the merchant put it.
  const [before, after] = remainingText.split('{amount}');

  return (
    <div className="hd-ship" role="status">
      <p className="hd-ship__text">
        <BrandIcon name="snow" className="hd-ship__icon" />
        {state.remaining === 0 ? (
          <span>{doneText}</span>
        ) : (
          <span>
            {before}
            {after !== undefined && <b>{format(state.remaining)}</b>}
            {after}
          </span>
        )}
      </p>
      <div
        className="hd-ship__track"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(state.percent)}
        aria-label={t('blocks.hudoo.free_shipping', 'Free shipping progress')}
      >
        <span className="hd-ship__fill" style={{ width: `${state.percent}%` }} />
      </div>
    </div>
  );
}

/**
 * «يكمّل طقسك»: one product related to the first item in the cart, not already
 * in it, that can be added straight away. One request; hidden when there is none.
 */
export function CartUpsell({ cart, onAdded }: { cart: Cart; onAdded: () => void }) {
  const { t, locale } = useTranslation();
  const { format } = useMoney();
  const settings = useSettings();
  const [busy, setBusy] = useState(false);
  const enabled = isOn(settings.cart_upsell_enabled);
  const firstId = cart.items[0]?.product_id;
  const inCart = new Set(cart.items.map((item) => String(item.product_id)));

  const { data } = useQuery({
    ...productApi.queries.list({ source: 'related', sourceValue: Number(firstId), perPage: 8 }),
    enabled: enabled && !!firstId,
  });
  const pick = (data?.items ?? []).find(
    (p: Product) => !inCart.has(String(p.id)) && !p.is_out_of_stock && !p.has_options
  );
  if (!enabled || !pick) return null;

  const price = pick.is_on_sale ? pick.sale_price ?? pick.price : pick.price;
  const title = blockText(settings.cart_upsell_title, locale) || t('blocks.hudoo.cart_upsell', 'Completes your ritual');

  const add = async () => {
    const sdk = window.salla?.cart;
    if (!sdk || busy) return;
    setBusy(true);
    try {
      await sdk.addItem({ id: Number(pick.id) });
      onAdded();
    } catch {
      // The SDK shows its own message.
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="hd-upsell" aria-labelledby="hd-upsell-title">
      <h2 id="hd-upsell-title" className="hd-display hd-upsell__title">
        {title}
      </h2>
      <div className="hd-upsell__card">
        <span className="hd-upsell__photo">
          {pick.image?.url && (
            <Image src={pick.image.url} alt="" objectFit="cover" noWrapper width={120} height={120} className="hd-upsell__img" />
          )}
        </span>
        <span className="hd-upsell__text">
          <Link to={pick.url} className="hd-upsell__name">
            {pick.name}
          </Link>
          {pick.subtitle && <span className="hd-upsell__hint">{pick.subtitle}</span>}
        </span>
        <button
          type="button"
          className="hd-upsell__add"
          onClick={add}
          disabled={busy}
          aria-busy={busy}
          aria-label={`${t('blocks.hudoo.add_to_cart', 'Add to cart')}: ${pick.name}`}
        >
          <BrandIcon name="plus" className="h-3.5 w-3.5" />
          <span>{format(price)}</span>
        </button>
      </div>
    </section>
  );
}
