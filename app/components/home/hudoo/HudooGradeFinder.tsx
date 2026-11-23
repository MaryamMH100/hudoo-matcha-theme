import { useId, useRef, useState, type KeyboardEvent } from 'react';
import { Image } from '@salla.sa/twilight-theme-engine/common';
import { useTranslation } from '@salla.sa/twilight-theme-engine/i18n';
import { BrandIcon } from '../../brandIcons';
import {
  blockChoice,
  blockImage,
  blockItems,
  blockLink,
  blockNumber,
  blockText,
} from '../../../lib/blockData';
import type { Grade } from '../../../lib/productTags';
import { GRADE_COLORS } from '../../../lib/tokens';
import ceremonialDemo from '../../../assets/demo/grade-ceremonial.webp';
import premiumDemo from '../../../assets/demo/grade-premium.webp';
import culinaryDemo from '../../../assets/demo/grade-culinary.webp';
import { SectionHead, SmartLink, type BlockProps } from './shared';

const GRADES = ['ceremonial', 'premium', 'culinary'] as const;

const DEMO_IMAGES: Record<Grade, string> = {
  ceremonial: ceremonialDemo,
  premium: premiumDemo,
  culinary: culinaryDemo,
};

/** Where each grade sits on the colour scale, from the vivid start (0) to the olive end (100). */
const SPECTRUM: Record<Grade, number> = { ceremonial: 6, premium: 50, culinary: 94 };

const TASTES = ['umami', 'sweetness', 'bitterness'] as const;
type Taste = (typeof TASTES)[number];

interface GradeTab {
  grade: Grade;
  image: string;
  badge: string;
  description: string;
  taste: Record<Taste, number | undefined>;
  link: string;
  linkText: string;
}

/** Five dots, `value` of them filled. */
function TasteDots({ value }: { value: number }) {
  return (
    <span className="hd-dots" aria-hidden="true">
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className={`hd-dots__dot${n <= value ? ' is-on' : ''}`} />
      ))}
    </span>
  );
}

/**
 * Grade Finder — the theme's signature block. Figma «01 · Home → Grade Finder».
 *
 * A segmented control (ceremonial / premium / culinary) switches one card: the
 * grade's photo, name and description, a colour scale with a marker at the
 * grade's colour, taste dots (umami / sweetness / bitterness, 1–5) and a button
 * to the grade's category. Built as accessible tabs (arrow keys, Home / End).
 * Only React state, no library. The section has `id="grade-finder"`, so the
 * hero's "Learn the grades" button can jump here.
 *
 * Fields (`home.hd-grade-finder`): eyebrow, title, and a `grades` collection of
 * { grade, image, badge, description, umami, sweetness, bitterness, link, link_text }.
 */
export function HudooGradeFinder({ data }: BlockProps) {
  const { locale, t, isRTL } = useTranslation();
  const uid = useId();
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const tabs: GradeTab[] = [];
  for (const item of blockItems(data.grades)) {
    const grade = blockChoice(item.grade, GRADES);
    if (!grade || tabs.some((tab) => tab.grade === grade)) continue;
    tabs.push({
      grade,
      image: blockImage(item.image) ?? DEMO_IMAGES[grade],
      badge: blockText(item.badge, locale),
      description: blockText(item.description, locale),
      taste: {
        umami: blockNumber(item.umami, 1, 5),
        sweetness: blockNumber(item.sweetness, 1, 5),
        bitterness: blockNumber(item.bitterness, 1, 5),
      },
      link: blockLink(item.link) ?? '/products',
      linkText: blockText(item.link_text, locale),
    });
  }

  const [active, setActive] = useState(0);
  if (!tabs.length) return null;
  const current = tabs[Math.min(active, tabs.length - 1)];

  const gradeName = (grade: Grade) => t(`blocks.hudoo.grade.${grade}`, grade);
  const tasteName = (taste: Taste) => t(`blocks.hudoo.taste.${taste}`, taste);

  const focusTab = (index: number) => {
    const next = (index + tabs.length) % tabs.length;
    setActive(next);
    tabRefs.current[next]?.focus();
  };

  // Arrow keys follow the reading direction: in Arabic, ← moves forward.
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const keys: Record<string, number> = {
      ArrowRight: isRTL ? -1 : 1,
      ArrowLeft: isRTL ? 1 : -1,
    };
    if (event.key in keys) focusTab(active + keys[event.key]);
    else if (event.key === 'Home') focusTab(0);
    else if (event.key === 'End') focusTab(tabs.length - 1);
    else return;
    event.preventDefault();
  };

  const titleId = `${uid}-title`;
  const tastes = TASTES.filter((taste) => current.taste[taste] !== undefined);

  return (
    <section id="grade-finder" className="hd-grade" aria-labelledby={titleId}>
      <div className="hd-container hd-grade__inner">
        <div className="hd-grade__intro">
          <SectionHead
            id={titleId}
            eyebrow={blockText(data.eyebrow, locale)}
            title={blockText(data.title, locale) || t('blocks.hudoo.grade_finder', 'Grade finder')}
          />

          {tabs.length > 1 && (
            <div
              className="hd-segmented"
              role="tablist"
              aria-label={t('blocks.hudoo.choose_grade', 'Choose a grade')}
              onKeyDown={onKeyDown}
            >
              {tabs.map((tab, index) => {
                const selected = tab === current;
                return (
                  <button
                    key={tab.grade}
                    ref={(el) => {
                      tabRefs.current[index] = el;
                    }}
                    type="button"
                    role="tab"
                    id={`${uid}-tab-${tab.grade}`}
                    aria-selected={selected}
                    aria-controls={`${uid}-panel`}
                    tabIndex={selected ? 0 : -1}
                    className={`hd-segmented__tab${selected ? ' is-active' : ''}`}
                    onClick={() => setActive(index)}
                  >
                    {gradeName(tab.grade)}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div
          id={`${uid}-panel`}
          role={tabs.length > 1 ? 'tabpanel' : undefined}
          aria-labelledby={tabs.length > 1 ? `${uid}-tab-${current.grade}` : undefined}
          className="hd-grade__card"
          style={{ '--grade-color': GRADE_COLORS[current.grade] } as React.CSSProperties}
        >
          <div className="hd-grade__photo">
            {/* All photos stay mounted and cross-fade; only the visible one loads eagerly. */}
            {tabs.map((tab) => (
              <Image
                key={tab.grade}
                src={tab.image}
                alt={tab === current ? gradeName(tab.grade) : ''}
                aria-hidden={tab === current ? undefined : true}
                objectFit="cover"
                noWrapper
                width={640}
                height={460}
                className={`hd-grade__img${tab === current ? ' is-active' : ''}`}
              />
            ))}
            {current.badge && (
              <span className="hd-grade__badge">
                <span className="hd-grade__badge-dot" aria-hidden="true" />
                {current.badge}
              </span>
            )}
          </div>

          <div className="hd-grade__body" aria-live="polite">
            <div>
              <h3 className="hd-display hd-grade__name">{gradeName(current.grade)}</h3>
              {current.description && <p className="hd-grade__desc">{current.description}</p>}
            </div>

            <div className="hd-spectrum">
              <p className="hd-spectrum__label">{t('blocks.hudoo.color_scale', 'Colour scale')}</p>
              <div
                className="hd-spectrum__track"
                role="img"
                aria-label={`${t('blocks.hudoo.color_scale', 'Colour scale')}: ${gradeName(current.grade)}`}
              >
                <span
                  className="hd-spectrum__marker"
                  style={{ insetInlineStart: `${SPECTRUM[current.grade]}%` }}
                />
              </div>
              <div className="hd-spectrum__ends" aria-hidden="true">
                <span>{t('blocks.hudoo.spectrum_vivid', 'Vivid green · drinking')}</span>
                <span>{t('blocks.hudoo.spectrum_olive', 'Olive · baking')}</span>
              </div>
            </div>

            {tastes.length > 0 && (
              <dl className="hd-grade__tastes">
                {tastes.map((taste) => (
                  <div key={taste} className="hd-grade__taste">
                    <dt>{tasteName(taste)}</dt>
                    <dd>
                      <TasteDots value={current.taste[taste]!} />
                      <span className="sr-only">
                        {t('blocks.hudoo.out_of_five', '{value} of 5').replace(
                          '{value}',
                          String(current.taste[taste])
                        )}
                      </span>
                    </dd>
                  </div>
                ))}
              </dl>
            )}

            <SmartLink to={current.link} className="hd-btn hd-btn--deep hd-grade__cta">
              <span>
                {current.linkText ||
                  t('blocks.hudoo.shop_grade', 'Shop {grade}').replace(
                    '{grade}',
                    gradeName(current.grade)
                  )}
              </span>
              <BrandIcon name="forward" className="h-4 w-4" />
            </SmartLink>
          </div>
        </div>
      </div>
    </section>
  );
}
