import { useTranslation } from '@salla.sa/twilight-theme-engine/i18n';
import { BRAND_ICON_NAMES, BrandIcon } from '../../brandIcons';
import { blockChoice, blockItems, blockText } from '../../../lib/blockData';
import { SectionHead, type BlockProps } from './shared';

/**
 * Brew guide — Figma «Brew guide»: eyebrow «الطريقة», an Amiri title, then four
 * small cards (2 g · 70 ml · 80° · 15 s), each an icon in a circle, a big value
 * and a label. Fields (`home.hd-brew-guide`): eyebrow, title, `steps` collection
 * of { icon, value, label }.
 */
export function HudooBrewGuide({ data }: BlockProps) {
  const { locale } = useTranslation();
  const steps = blockItems(data.steps)
    .map((step) => ({
      icon: blockChoice(step.icon, BRAND_ICON_NAMES) ?? 'leaf',
      value: blockText(step.value, locale),
      label: blockText(step.label, locale),
    }))
    .filter((step) => step.value || step.label);
  if (!steps.length) return null;

  return (
    <section className="hd-brew">
      <div className="hd-container">
        <SectionHead eyebrow={blockText(data.eyebrow, locale)} title={blockText(data.title, locale)} />
        <ol className="hd-brew__steps">
          {steps.map((step, index) => (
            <li key={`${step.value}-${index}`} className="hd-brew__step">
              <span className="hd-brew__icon">
                <BrandIcon name={step.icon} className="h-5 w-5" />
              </span>
              {step.value && <span className="hd-brew__value">{step.value}</span>}
              {step.label && <span className="hd-brew__label">{step.label}</span>}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
