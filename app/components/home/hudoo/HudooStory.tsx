import { Image } from '@salla.sa/twilight-theme-engine/common';
import { useTranslation } from '@salla.sa/twilight-theme-engine/i18n';
import { BrandIcon } from '../../brandIcons';
import { blockImage, blockLink, blockText } from '../../../lib/blockData';
import storyDemo from '../../../assets/demo/story.webp';
import { SmartLink, type BlockProps } from './shared';

/**
 * Story — Figma «Story» (390 × 460): a full-bleed photo with a dark gradient,
 * eyebrow «قصتنا», an Amiri title and a short paragraph at the bottom, an
 * optional link. Fields (`home.hd-story`): image, eyebrow, title, text,
 * link_text, link.
 */
export function HudooStory({ data }: BlockProps) {
  const { locale } = useTranslation();
  const title = blockText(data.title, locale);
  const text = blockText(data.text, locale);
  const linkText = blockText(data.link_text, locale);
  const link = blockLink(data.link);
  if (!title && !text) return null;

  return (
    <section className="hd-story">
      <Image
        src={blockImage(data.image) ?? storyDemo}
        alt=""
        objectFit="cover"
        noWrapper
        width={1200}
        height={800}
        sizes="100vw"
        className="hd-story__img"
      />
      <div className="hd-story__shade" aria-hidden="true" />
      <div className="hd-container hd-story__content">
        {blockText(data.eyebrow, locale) && (
          <p className="hd-eyebrow hd-eyebrow--light">{blockText(data.eyebrow, locale)}</p>
        )}
        {title && <h2 className="hd-display hd-story__title">{title}</h2>}
        {text && <p className="hd-story__text">{text}</p>}
        {linkText && link && (
          <SmartLink to={link} className="hd-btn hd-btn--ghost-light hd-story__link">
            <span>{linkText}</span>
            <BrandIcon name="forward" className="h-4 w-4" />
          </SmartLink>
        )}
      </div>
    </section>
  );
}
