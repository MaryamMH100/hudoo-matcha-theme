import { memo } from 'react';
import type { ProductCardProps } from '@salla.sa/twilight-theme-engine/product';
import { Image, Link } from '@salla.sa/twilight-theme-engine/common';
import { useMoney } from '@salla.sa/twilight-theme-engine/hooks/useMoney';
import { useWishlist } from '@salla.sa/twilight-theme-engine/hooks/useWishlist';
import { useTranslation } from '@salla.sa/twilight-theme-engine/i18n';
import { SallaAddProductButton } from '@salla.sa/twilight-components-react/add-product-button';
import { BrandIcon } from '../brandIcons';
import { parseProductTags, productGrade } from '../../lib/productTags';
import { GRADE_COLORS } from '../../lib/tokens';

/** A price that can be shown: a finite number (the API sends `'-'` when hidden). */
const amount = (value: unknown): number | undefined => {
  const n = typeof value === 'string' ? Number(value) : value;
  return typeof n === 'number' && Number.isFinite(n) ? n : undefined;
};

/** Discount as a whole percent, from the regular and current price. */
function discountPercent(regular?: number, now?: number): number | undefined {
  if (!regular || now === undefined || now >= regular) return undefined;
  return Math.round(((regular - now) / regular) * 100);
}

/**
 * Hudoo product card — Figma «Component · Product Card» (168 × 295).
 *
 * A surface-coloured media box (radius 18) with the grade badge at the start
 * and the wishlist heart at the end; then the name, a short meta line
 * («30 جم · للشرب سادة»), and the price row with a round deep «+» button.
 *
 * Registered as `product:card` (app/router.tsx), so every list, slider and grid
 * uses it. Data comes from the list item only (no extra requests): grade and use
 * from the product's tags (or its category name), see lib/productTags.ts.
 *
 * States: on sale (old price + discount badge), sold out (dimmed photo, a
 * «نفدت الكمية» label, no add button), products with options or bookings (the
 * «+» opens the product page, where the customer picks), and no photo (a calm
 * placeholder). The add button is Salla's own `<salla-add-product-button>`.
 */
export const HudooProductCard = memo(function HudooProductCard({
  product,
  layout = 'vertical',
  className = '',
  withoutAddButton,
  imagePriority,
  sizes,
}: ProductCardProps) {
  const { t } = useTranslation();
  const { format } = useMoney();
  const wishlist = useWishlist();

  // List responses send the id as a numeric string.
  const id = Number(product.id);
  const inWishlist = wishlist.has(id);
  const grade = productGrade(product);
  const { uses } = parseProductTags(product.tags);

  const regular = amount(product.regular_price);
  const now = product.is_on_sale ? amount(product.sale_price) ?? amount(product.price) : amount(product.price);
  const starting = amount(product.starting_price);
  const off = product.is_on_sale ? discountPercent(regular, now) : undefined;
  const soldOut = product.is_out_of_stock || product.status === 'out';

  const meta =
    product.subtitle?.trim() ||
    [product.weight, uses[0] && t(`blocks.hudoo.use.${uses[0]}`, uses[0])].filter(Boolean).join(' · ');

  // Products the customer must configure first open their page instead.
  const needsPage = product.has_options || product.type === 'booking' || product.type === 'donating';
  const showAdd = !withoutAddButton && !soldOut;
  const badge = product.promotion_title?.trim();

  return (
    <article
      className={`hd-card hd-card--${layout === 'horizontal' ? 'horizontal' : 'vertical'}${
        soldOut ? ' is-sold-out' : ''
      } ${className}`.trim()}
      style={grade ? ({ '--grade-color': GRADE_COLORS[grade] } as React.CSSProperties) : undefined}
    >
      <div className="hd-card__media">
        {/* The whole card is clickable through the name link (stretched over the card). */}
        {product.image?.url ? (
          <Image
            src={product.image.url}
            alt=""
            objectFit="cover"
            noWrapper
            priority={imagePriority}
            width={336}
            height={408}
            srcSetWidths={[240, 336, 480, 672]}
            sizes={sizes ?? '(min-width: 1024px) 240px, (min-width: 640px) 30vw, 46vw'}
            className="hd-card__img"
          />
        ) : (
          <span className="hd-card__placeholder">
            <BrandIcon name="leaf" className="h-8 w-8" />
          </span>
        )}

        {grade && (
          <span className="hd-card__grade">
            <span className="hd-card__grade-dot" aria-hidden="true" />
            {t(`blocks.hudoo.grade.${grade}`, grade)}
          </span>
        )}

        <button
          type="button"
          className={`hd-card__fav${inWishlist ? ' is-active' : ''}`}
          data-id={id}
          aria-pressed={inWishlist}
          aria-label={t('pages.wishlist.toggle', 'Add or remove to wishlist')}
          onClick={() => wishlist.toggle(id)}
        >
          <BrandIcon name="heart" className="h-4 w-4" />
        </button>

        {soldOut ? (
          <span className="hd-card__flag hd-card__flag--out">
            {t('blocks.hudoo.sold_out', 'Sold out')}
          </span>
        ) : (
          (badge || off) && (
            <span className="hd-card__flag">{badge || `${t('blocks.hudoo.discount', 'Off')} ${off}%`}</span>
          )
        )}
      </div>

      <div className="hd-card__body">
        <h3 className="hd-card__name">
          <Link to={product.url}>{product.name}</Link>
        </h3>
        {meta && <p className="hd-card__meta">{meta}</p>}

        <div className="hd-card__row">
          <p className="hd-card__price">
            {starting !== undefined && !product.is_on_sale ? (
              <>
                <span className="hd-card__from">{t('blocks.hudoo.from', 'From')}</span>
                <span className="hd-card__now">{format(starting)}</span>
              </>
            ) : (
              now !== undefined && (
                <>
                  <span className={`hd-card__now${product.is_on_sale ? ' is-sale' : ''}`}>{format(now)}</span>
                  {product.is_on_sale && regular !== undefined && (
                    <s className="hd-card__was">{format(regular)}</s>
                  )}
                </>
              )
            )}
          </p>

          {showAdd &&
            (needsPage ? (
              <Link
                to={product.url}
                className="hd-card__add"
                aria-label={`${t('blocks.hudoo.choose_options', 'Choose options')}: ${product.name}`}
              >
                <BrandIcon name="plus" className="h-4 w-4" />
              </Link>
            ) : (
              <SallaAddProductButton
                className="hd-card__add-wrap"
                productId={id}
                productStatus="sale"
                productType={product.type}
                aria-label={`${t('blocks.hudoo.add_to_cart', 'Add to cart')}: ${product.name}`}
              >
                <BrandIcon name="plus" className="h-4 w-4" />
                <span className="sr-only">{t('blocks.hudoo.add_to_cart', 'Add to cart')}</span>
              </SallaAddProductButton>
            ))}
        </div>
      </div>
    </article>
  );
});
