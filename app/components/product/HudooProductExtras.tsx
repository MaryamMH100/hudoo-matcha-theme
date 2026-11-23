import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Image, Link } from '@salla.sa/twilight-theme-engine/common';
import { useMoney } from '@salla.sa/twilight-theme-engine/hooks/useMoney';
import { useTranslation } from '@salla.sa/twilight-theme-engine/i18n';
import { useTwilight } from '@salla.sa/twilight-theme-engine/providers';
import { product as productApi } from '@salla.sa/twilight-theme-engine/api/product';
import type { Product } from '@salla.sa/twilight-theme-engine/types';
import { BRAND_ICON_NAMES, BrandIcon } from '../brandIcons';
import { blockChoice, blockItems, blockProductIds, blockText } from '../../lib/blockData';
import { costPerCup, parseProductTags, productGrade, type TasteKey } from '../../lib/productTags';
import { isOn } from '../../lib/settings';
import { GRADE_COLORS } from '../../lib/tokens';

/**
 * Product page additions — Figma «03 · Product»: badges, cost per cup, taste
 * profile, brew steps and «complete the ritual». Each piece reads the product's
 * Hudoo tags (lib/productTags.ts) and hides itself when the data is missing, so
 * a whisk or a bowl shows a normal product page.
 * Styling: `04-components/hudoo-product.scss`.
 */

const amount = (value: unknown): number | undefined => {
  const n = typeof value === 'string' ? Number(value) : value;
  return typeof n === 'number' && Number.isFinite(n) ? n : undefined;
};

/** What the customer pays now for one unit. */
export function currentPrice(p: Pick<Product, 'is_on_sale' | 'sale_price' | 'price'>) {
  return p.is_on_sale ? amount(p.sale_price) ?? amount(p.price) : amount(p.price);
}

function useSettings() {
  const { theme } = useTwilight();
  return (theme?.settings ?? {}) as Record<string, unknown>;
}

/** Grade (surface, grade dot) and harvest (highlight) badges above the title. */
export function ProductBadges({ product }: { product: Product }) {
  const { t } = useTranslation();
  const grade = productGrade(product);
  const { harvest } = parseProductTags(product.tags);
  if (!grade && !harvest) return null;
  return (
    <div className="hd-product-badges">
      {grade && (
        <span className="hd-product-badges__grade" style={{ '--grade-color': GRADE_COLORS[grade] } as React.CSSProperties}>
          <span className="hd-product-badges__dot" aria-hidden="true" />
          {t(`blocks.hudoo.grade.${grade}`, grade)}
        </span>
      )}
      {harvest && <span className="hd-product-badges__harvest">{harvest}</span>}
    </div>
  );
}

/** «≈ 8.6 ر.س للكوب» from the `cups:` tag and the current price. */
export function CostPerCup({ product }: { product: Product }) {
  const { cups } = parseProductTags(product.tags);
  const perCup = costPerCup(currentPrice(product), cups);
  return perCup === undefined ? null : <CostPerCupChip value={perCup} />;
}

function CostPerCupChip({ value }: { value: number }) {
  const { t } = useTranslation();
  const { format } = useMoney();
  return (
    <span className="hd-cost-cup">
      ≈ {format(value)} {t('blocks.hudoo.per_cup', 'per cup')}
    </span>
  );
}

const TASTE_ORDER: TasteKey[] = ['umami', 'sweetness', 'bitterness', 'body'];

/** «بروفايل الطعم»: one five-segment bar per taste, with a word for the level. */
export function TasteProfile({ product }: { product: Product }) {
  const { t } = useTranslation();
  const { taste } = parseProductTags(product.tags);
  const rows = TASTE_ORDER.filter((key) => taste[key] !== undefined);
  if (!rows.length) return null;

  return (
    <section className="hd-taste" aria-labelledby="hd-taste-title">
      <h2 id="hd-taste-title" className="hd-display hd-product-section__title">
        {t('blocks.hudoo.taste_profile', 'Taste profile')}
      </h2>
      <dl className="hd-taste__rows">
        {rows.map((key) => {
          const level = taste[key]!;
          const word = t(`blocks.hudoo.taste_level.${key}.${level}`, `${level}/5`);
          return (
            <div key={key} className="hd-taste__row">
              <dt className="hd-taste__name">{t(`blocks.hudoo.taste.${key}`, key)}</dt>
              <dd className="hd-taste__value">
                <span className="hd-taste__bar" aria-hidden="true">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <span key={n} className={`hd-taste__seg${n <= level ? ' is-on' : ''}`} />
                  ))}
                </span>
                <span className="hd-taste__word">{word}</span>
                <span className="sr-only">
                  {t('blocks.hudoo.out_of_five', '{value} of 5').replace('{value}', String(level))}
                </span>
              </dd>
            </div>
          );
        })}
      </dl>
    </section>
  );
}

/** «طريقة التحضير»: numbered steps from the theme settings, on matcha products only. */
export function BrewSteps({ product }: { product: Product }) {
  const { locale } = useTranslation();
  const settings = useSettings();
  if (!isOn(settings.product_brew_enabled) || !productGrade(product)) return null;
  const steps = blockItems(settings.product_brew_steps)
    .map((step) => ({
      icon: blockChoice(step.icon, BRAND_ICON_NAMES) ?? 'leaf',
      text: blockText(step.text, locale),
      hint: blockText(step.hint, locale),
    }))
    .filter((step) => step.text);
  if (!steps.length) return null;
  const title = blockText(settings.product_brew_title, locale);

  return (
    <section className="hd-brew-steps" aria-label={title || undefined}>
      {title && <h2 className="hd-display hd-product-section__title">{title}</h2>}
      <ol className="hd-brew-steps__list">
        {steps.map((step, index) => (
          <li key={`${step.text}-${index}`} className="hd-brew-steps__step">
            <span className="hd-brew-steps__icon">
              <BrandIcon name={step.icon} className="h-5 w-5" />
              <span className="hd-brew-steps__num" aria-hidden="true">
                {index + 1}
              </span>
            </span>
            <span className="hd-brew-steps__text">
              <span className="hd-brew-steps__main">{step.text}</span>
              {step.hint && <span className="hd-brew-steps__hint">{step.hint}</span>}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}

/**
 * «أكمل الطقس»: this product with the tools that complete it (the products
 * picked in the theme settings, or else two related products). Each tile can be
 * ticked off; the total follows, and «أضف الطقم» adds the ticked products to the
 * cart through the Salla SDK. Products that need options are left out (they
 * can't be added without choosing). On matcha products only.
 */
export function CompleteRitual({ product }: { product: Product }) {
  const { t, locale } = useTranslation();
  const { format } = useMoney();
  const settings = useSettings();
  const pickedIds = blockProductIds(settings.ritual_products).filter((id) => id !== Number(product.id));
  const isMatcha = !!productGrade(product);
  const enabled = isOn(settings.ritual_enabled) && isMatcha;

  const { data } = useQuery({
    ...productApi.queries.list(
      pickedIds.length
        ? { source: 'selected', sourceValue: pickedIds, perPage: 4 }
        : { source: 'related', sourceValue: Number(product.id), perPage: 4 }
    ),
    enabled,
  });

  const items = useMemo(() => {
    const addable = (p: Product) => !p.is_out_of_stock && !p.has_options && currentPrice(p) !== undefined;
    const others = (data?.items ?? [])
      .filter((p) => String(p.id) !== String(product.id) && addable(p))
      .slice(0, 2);
    return addable(product) ? [product, ...others] : others;
  }, [data, product]);

  const [unticked, setUnticked] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);

  if (!enabled || items.length < 2) return null;

  const chosen = items.filter((p) => !unticked.has(String(p.id)));
  const total = chosen.reduce((sum, p) => sum + (currentPrice(p) ?? 0), 0);
  const totalRegular = chosen.reduce((sum, p) => sum + (amount(p.regular_price) ?? currentPrice(p) ?? 0), 0);
  const toggle = (id: string) =>
    setUnticked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const addSet = async () => {
    const cart = window.salla?.cart;
    if (!cart || busy || !chosen.length) return;
    setBusy(true);
    try {
      for (const p of chosen) await cart.addItem({ id: Number(p.id) });
    } catch {
      // The SDK shows its own error message.
    } finally {
      setBusy(false);
    }
  };

  const title = blockText(settings.ritual_title, locale) || t('blocks.hudoo.complete_ritual', 'Complete the ritual');
  const text = blockText(settings.ritual_text, locale);

  return (
    <section className="hd-ritual" aria-labelledby="hd-ritual-title">
      <h2 id="hd-ritual-title" className="hd-display hd-product-section__title">
        {title}
      </h2>
      {text && <p className="hd-ritual__text">{text}</p>}
      <ul className="hd-ritual__items">
        {items.map((p) => {
          const id = String(p.id);
          const on = !unticked.has(id);
          const isThis = id === String(product.id);
          return (
            <li key={id} className={`hd-ritual__item${on ? ' is-on' : ''}`}>
              <button
                type="button"
                className="hd-ritual__tick"
                aria-pressed={on}
                aria-label={`${on ? t('blocks.hudoo.remove_from_set', 'Remove from set') : t('blocks.hudoo.add_to_set', 'Add to set')}: ${p.name}`}
                onClick={() => toggle(id)}
              >
                <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true">
                  <path d="M3 8.5l3 3 7-7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <span className="hd-ritual__photo">
                {p.image?.url && (
                  <Image src={p.image.url} alt="" objectFit="cover" noWrapper width={188} height={192} className="hd-ritual__img" />
                )}
              </span>
              {isThis ? (
                <span className="hd-ritual__name">{t('blocks.hudoo.this_product', 'This product')}</span>
              ) : (
                <Link to={p.url} className="hd-ritual__name">
                  {p.name}
                </Link>
              )}
              <span className="hd-ritual__price">{format(currentPrice(p))}</span>
            </li>
          );
        })}
      </ul>
      <div className="hd-ritual__foot">
        <p className="hd-ritual__total">
          <span className="hd-ritual__now">{format(total)}</span>
          {totalRegular > total && <s className="hd-ritual__was">{format(totalRegular)}</s>}
        </p>
        <button
          type="button"
          className="hd-btn hd-btn--outline hd-ritual__add"
          onClick={addSet}
          disabled={busy || !chosen.length}
          aria-busy={busy}
        >
          {t('blocks.hudoo.add_set', 'Add the set')}
        </button>
      </div>
    </section>
  );
}
