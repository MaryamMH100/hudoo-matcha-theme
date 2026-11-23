import { useQuery } from '@tanstack/react-query';
import { useTranslation } from '@salla.sa/twilight-theme-engine/i18n';
import { product, type ProductsListSource } from '@salla.sa/twilight-theme-engine/api/product';
import { ProductsListSkeleton } from '@salla.sa/twilight-components-react';
import { ProductCard } from '../../product';
import { blockChoice, blockLink, blockNumber, blockProductIds, blockText } from '../../../lib/blockData';
import { SectionHead, ViewAllLink, type BlockProps } from './shared';

const SOURCES = ['best_selling', 'latest', 'offers', 'top-rated', 'selected'] as const;

/**
 * Best sellers — Figma «Best sellers»: Amiri title with «عرض الكل ←», then a
 * horizontal rail of product cards that scrolls with the finger (CSS scroll
 * snap, no slider library). One list request for the whole rail.
 *
 * Fields (`home.hd-products-rail`): title, source (best selling / latest /
 * offers / top rated / picked products), products (when picked), limit,
 * display_all_url.
 */
export function HudooProductsRail({ data }: BlockProps) {
  const { locale, t } = useTranslation();
  const ids = blockProductIds(data.products);
  const chosen = blockChoice(data.source, SOURCES) ?? (ids.length ? 'selected' : 'best_selling');
  const source: ProductsListSource = chosen === 'selected' && !ids.length ? 'best_selling' : chosen;
  const limit = blockNumber(data.limit, 2, 16) ?? 8;
  const title = blockText(data.title, locale);
  const viewAll = blockLink(data.display_all_url);

  const { data: result, isSuccess, isError } = useQuery(
    product.queries.list({
      source,
      sourceValue: source === 'selected' ? ids : undefined,
      perPage: limit,
    })
  );
  const items = result?.items?.slice(0, limit) ?? [];
  if (isError || (isSuccess && !items.length)) return null;

  return (
    <section className="hd-rail" aria-label={title || undefined}>
      <div className="hd-container">
        <SectionHead
          title={title}
          action={viewAll ? <ViewAllLink to={viewAll} label={t('blocks.home.display_all', 'View all')} /> : null}
        />
      </div>
      {!isSuccess ? (
        <div className="hd-container">
          <ProductsListSkeleton />
        </div>
      ) : (
        <ul className="hd-rail__track">
          {items.map((item) => (
            <li key={item.id} className="hd-rail__slide">
              <ProductCard product={item} layout="vertical" />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
