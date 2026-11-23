import { useQuery } from '@tanstack/react-query';
import { Image } from '@salla.sa/twilight-theme-engine/common';
import { useTranslation } from '@salla.sa/twilight-theme-engine/i18n';
import { useMoney } from '@salla.sa/twilight-theme-engine/hooks/useMoney';
import { product } from '@salla.sa/twilight-theme-engine/api/product';
import { blockImage, blockLink, blockProductIds, blockText } from '../../../lib/blockData';
import kitDemo from '../../../assets/demo/ritual-kit.webp';
import { SmartLink, type BlockProps } from './shared';

/**
 * Ritual kit banner — Figma «Ritual kit»: a primary-deep card, a photo on the
 * start side, eyebrow «طقم البداية», an Amiri title, what is inside, and the
 * price (with the old price when on sale). The whole card links to the kit.
 *
 * Fields (`home.hd-ritual-kit`): image, eyebrow, title, text, product (the kit,
 * for its price and link), link (used when no product is picked).
 */
export function HudooRitualKit({ data }: BlockProps) {
  const { locale } = useTranslation();
  const { format } = useMoney();
  const [productId] = blockProductIds(data.product);
  const { data: result } = useQuery({
    ...product.queries.list({ source: 'selected', sourceValue: productId ? [productId] : [] }),
    enabled: !!productId,
  });
  const kit = result?.items?.[0];

  const title = blockText(data.title, locale);
  const href = kit?.url || blockLink(data.link);
  const image = blockImage(data.image) ?? kit?.image?.url ?? kitDemo;
  if (!title && !kit) return null;

  const body = (
    <>
      <div className="hd-kit__body">
        {blockText(data.eyebrow, locale) && <p className="hd-kit__eyebrow">{blockText(data.eyebrow, locale)}</p>}
        <h2 className="hd-display hd-kit__title">{title || kit?.name}</h2>
        {blockText(data.text, locale) && <p className="hd-kit__text">{blockText(data.text, locale)}</p>}
        {kit && (
          <p className="hd-kit__price">
            <span className="hd-kit__now">{format(kit.is_on_sale ? kit.sale_price ?? kit.price : kit.price)}</span>
            {kit.is_on_sale && <s className="hd-kit__was">{format(kit.regular_price)}</s>}
          </p>
        )}
      </div>
      {/* After the text: the photo sits at the end side (left in Arabic), as in Figma. */}
      <div className="hd-kit__photo">
        <Image src={image} alt="" objectFit="cover" noWrapper width={360} height={480} className="hd-kit__img" />
      </div>
    </>
  );

  return (
    <section className="hd-kit">
      <div className="hd-container">
        {href ? (
          <SmartLink to={href} className="hd-kit__card" aria-label={title || kit?.name}>
            {body}
          </SmartLink>
        ) : (
          <div className="hd-kit__card">{body}</div>
        )}
      </div>
    </section>
  );
}
