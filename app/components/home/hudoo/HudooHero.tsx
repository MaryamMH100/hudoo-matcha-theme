import { Image } from '@salla.sa/twilight-theme-engine/common';
import { useTranslation } from '@salla.sa/twilight-theme-engine/i18n';
import { BrandIcon } from '../../brandIcons';
import { blockImage, blockLink, blockText } from '../../../lib/blockData';
import heroDemo from '../../../assets/demo/hero.webp';
import { SmartLink, type BlockProps } from './shared';

/**
 * Hero — Figma «01 · Home → Hero» (390 × 600): full-bleed photo with a dark
 * gradient at the bottom, a highlight badge, a big Amiri headline, a short line
 * and two pill buttons. Desktop: the same, as a split layout (text · photo).
 *
 * Fields (twilight.json `home.hd-hero`): image, badge, title, text,
 * primary_text / primary_link (filled), secondary_text / secondary_link (outline).
 * Clearing a button's text hides it.
 */
export function HudooHero({ data }: BlockProps) {
  const { locale, t } = useTranslation();
  const image = blockImage(data.image) ?? heroDemo;
  const badge = blockText(data.badge, locale);
  const title = blockText(data.title, locale);
  const text = blockText(data.text, locale);
  const primaryText = blockText(data.primary_text, locale);
  // Sensible defaults until the merchant picks links: all products, and the
  // Grade Finder further down the page.
  const primaryLink = blockLink(data.primary_link) ?? '/products';
  const secondaryText = blockText(data.secondary_text, locale);
  const secondaryLink = blockLink(data.secondary_link) ?? '#grade-finder';
  // The first block is the page's largest paint: load its photo first.
  const priority = data.priority === true || data.position === 1;

  return (
    <section className="hd-hero" aria-label={title || t('blocks.hudoo.hero', 'Hero')}>
      <div className="hd-hero__media">
        <Image
          src={image}
          alt=""
          priority={priority}
          objectFit="cover"
          noWrapper
          className="hd-hero__img"
          sizes="(min-width: 1024px) 50vw, 100vw"
          width={720}
          height={1080}
        />
        <div className="hd-hero__shade" aria-hidden="true" />
      </div>

      <div className="hd-hero__content">
        {badge && <p className="hd-hero__badge">{badge}</p>}
        {title && <h2 className="hd-display hd-hero__title">{title}</h2>}
        {text && <p className="hd-hero__text">{text}</p>}
        {((secondaryText && secondaryLink) || (primaryText && primaryLink)) && (
          <div className="hd-hero__actions">
            {secondaryText && secondaryLink && (
              <SmartLink to={secondaryLink} className="hd-btn hd-btn--ghost-light">
                {secondaryText}
              </SmartLink>
            )}
            {primaryText && primaryLink && (
              <SmartLink to={primaryLink} className="hd-btn hd-btn--light">
                <span>{primaryText}</span>
                <BrandIcon name="forward" className="h-4 w-4" />
              </SmartLink>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
