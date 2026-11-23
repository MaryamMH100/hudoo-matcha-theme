import { useState } from 'react';
import { Image } from '@salla.sa/twilight-theme-engine/common';
import { useTranslation } from '@salla.sa/twilight-theme-engine/i18n';
import { ShoppingBagIcon } from '../../icons';
import { blockImage, blockLink, blockProductIds, blockText } from '../../../lib/blockData';
import recipeDemo from '../../../assets/demo/recipe.webp';
import { SectionHead, SmartLink, type BlockProps } from './shared';

/**
 * Recipe card — Figma «Recipe»: section title «وصفة الأسبوع», then a surface
 * card with a tall photo, the recipe name in Amiri, a meta line
 * (5 دقائق · 3 مكونات · بريميوم) and an outline button.
 *
 * The button adds the recipe's products to the cart, one after another, through
 * the Salla SDK (it shows its own messages and opens the options picker for a
 * product that needs one). With no products picked it links to the full recipe.
 *
 * Fields (`home.hd-recipe`): section_title, image, title, meta, products,
 * button_text, link.
 */
export function HudooRecipe({ data }: BlockProps) {
  const { locale, t } = useTranslation();
  const [busy, setBusy] = useState(false);
  const productIds = blockProductIds(data.products);
  const link = blockLink(data.link);
  const title = blockText(data.title, locale);
  const meta = blockText(data.meta, locale);
  const buttonText =
    blockText(data.button_text, locale) ||
    (productIds.length
      ? t('blocks.hudoo.add_recipe', 'Add the ingredients to cart')
      : t('blocks.hudoo.read_recipe', 'Read the recipe'));
  if (!title) return null;

  const addAll = async () => {
    const cart = window.salla?.cart;
    if (!cart || busy) return;
    setBusy(true);
    try {
      for (const id of productIds) {
        // Sequential, so the cart is created once and each add sees the last.
        await cart.addItem({ id });
      }
    } catch {
      // The SDK already told the customer what went wrong.
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="hd-recipe">
      <div className="hd-container">
        <SectionHead title={blockText(data.section_title, locale)} />
        <article className="hd-recipe__card">
          <div className="hd-recipe__photo">
            <Image
              src={blockImage(data.image) ?? recipeDemo}
              alt=""
              objectFit="cover"
              noWrapper
              width={700}
              height={600}
              className="hd-recipe__img"
            />
          </div>
          <div className="hd-recipe__body">
            <h3 className="hd-display hd-recipe__title">{title}</h3>
            {meta && <p className="hd-recipe__meta">{meta}</p>}
            {productIds.length > 0 ? (
              <button
                type="button"
                className="hd-btn hd-btn--outline hd-recipe__cta"
                onClick={addAll}
                disabled={busy}
                aria-busy={busy}
              >
                <ShoppingBagIcon className="h-4 w-4" aria-hidden="true" />
                <span>{buttonText}</span>
              </button>
            ) : (
              link && (
                <SmartLink to={link} className="hd-btn hd-btn--outline hd-recipe__cta">
                  {buttonText}
                </SmartLink>
              )
            )}
          </div>
        </article>
      </div>
    </section>
  );
}
