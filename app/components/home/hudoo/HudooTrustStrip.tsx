import { useTranslation } from '@salla.sa/twilight-theme-engine/i18n';
import { BRAND_ICON_NAMES, BrandIcon } from '../../brandIcons';
import { blockChoice, blockItems, blockText } from '../../../lib/blockData';
import type { BlockProps } from './shared';

/**
 * Trust strip — Figma «Trust strip» (390 × 54): three short promises, each with
 * a line icon, on the page background, a hairline under it.
 * Fields: `items` collection of { icon, text }.
 */
export function HudooTrustStrip({ data }: BlockProps) {
  const { locale, t } = useTranslation();
  const items = blockItems<{ icon?: unknown; text?: unknown }>(data.items)
    .map((item) => ({
      icon: blockChoice(item.icon, BRAND_ICON_NAMES) ?? 'leaf',
      text: blockText(item.text, locale),
    }))
    .filter((item) => item.text);
  if (!items.length) return null;

  return (
    <section className="hd-trust" aria-label={t('blocks.hudoo.trust', 'Why shop with us')}>
      <ul className="hd-trust__list">
        {items.map((item) => (
          <li key={item.text} className="hd-trust__item">
            <BrandIcon name={item.icon} className="hd-trust__icon" />
            <span>{item.text}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
