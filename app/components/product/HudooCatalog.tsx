import { useMemo } from 'react';
import { Link } from '@salla.sa/twilight-theme-engine/common';
import { useTranslation } from '@salla.sa/twilight-theme-engine/i18n';
import { useTwilight } from '@salla.sa/twilight-theme-engine/providers';
import type { Category, Product } from '@salla.sa/twilight-theme-engine/types';
import { BrandIcon } from '../brandIcons';
import { detectGrade, parseProductTags, productGrade, type Grade, type Use } from '../../lib/productTags';
import { isOn, localizedText, safeUrl } from '../../lib/settings';

/**
 * Category page pieces — Figma «02 · Category»: the title and count, the grade
 * colour filter, the use chips and the «not sure which grade?» banner.
 * Wired into `ProductListPage.tsx`. Styling: `04-components/hudoo-catalog.scss`.
 */

export const GRADE_ORDER: Grade[] = ['ceremonial', 'premium', 'culinary'];
const USE_ORDER: Use[] = ['drink', 'latte', 'baking'];

export type GradeFilterValue = Grade | 'all';

/** Title (Amiri), product count and an optional line under it. */
export function CatalogHeader({ title, category }: { title: string; category?: Category }) {
  const { t, locale } = useTranslation();
  const { theme } = useTwilight();
  const subtitle = localizedText(
    (theme?.settings as Record<string, unknown> | undefined)?.catalog_subtitle,
    locale
  );
  const count = category?.products_count;
  // Shown as plain text: tags the dashboard may add are dropped.
  const description = category?.description?.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  const parts = [
    typeof count === 'number' && count > 0
      ? t('blocks.hudoo.products_count', '{count} products').replace('{count}', String(count))
      : '',
    subtitle,
  ].filter(Boolean);

  return (
    <header className="hd-catalog-head">
      {category?.image && (
        <img
          src={category.image}
          alt=""
          className="hd-catalog-head__img"
          loading="lazy"
          decoding="async"
          width={96}
          height={96}
        />
      )}
      <div className="hd-catalog-head__text">
        <h1 className="hd-display hd-catalog-head__title" id="page-main-title">
          {title}
        </h1>
        {parts.length > 0 && <p className="hd-catalog-head__meta">{parts.join(' · ')}</p>}
        {description && <p className="hd-catalog-head__desc">{description}</p>}
      </div>
    </header>
  );
}

export interface GradeLink {
  grade: Grade;
  url: string;
}

/**
 * Sub-categories named after a grade («سيريمونيال», «Premium matcha»…). When a
 * category has at least two, the colour circles link to them (server-side
 * lists, exact counts). Otherwise they filter the loaded products.
 */
export function gradeSubcategories(category?: Category): GradeLink[] {
  const links: GradeLink[] = [];
  for (const sub of category?.sub_categories ?? category?.items ?? []) {
    const grade = detectGrade(sub.name);
    if (grade && sub.url && !links.some((l) => l.grade === grade)) links.push({ grade, url: sub.url });
  }
  return links.length >= 2 ? links.sort((a, b) => GRADE_ORDER.indexOf(a.grade) - GRADE_ORDER.indexOf(b.grade)) : [];
}

/** Grades and uses present in a list of products, in display order. */
export function presentFacets(products: Product[]) {
  const grades = new Set<Grade>();
  const uses = new Set<Use>();
  for (const p of products) {
    const grade = productGrade(p);
    if (grade) grades.add(grade);
    for (const use of parseProductTags(p.tags).uses) uses.add(use);
  }
  return {
    grades: GRADE_ORDER.filter((g) => grades.has(g)),
    uses: USE_ORDER.filter((u) => uses.has(u)),
  };
}

/** Whether a product passes the chosen grade / use. */
export function matchesFacets(product: Product, grade: GradeFilterValue, use: Use | null) {
  if (grade !== 'all' && productGrade(product) !== grade) return false;
  if (use && !parseProductTags(product.tags).uses.includes(use)) return false;
  return true;
}

function Swatch({ grade }: { grade: GradeFilterValue }) {
  return <span className={`hd-swatch hd-swatch--${grade}`} aria-hidden="true" />;
}

/**
 * The colour filter: «الكل» + one circle per grade. Links to grade
 * sub-categories when there are some, otherwise buttons that filter in place.
 */
export function GradeFilter({
  links,
  grades,
  value,
  onChange,
}: {
  links: GradeLink[];
  grades: Grade[];
  value: GradeFilterValue;
  onChange: (value: GradeFilterValue) => void;
}) {
  const { t } = useTranslation();
  const label = (g: GradeFilterValue) =>
    g === 'all' ? t('blocks.hudoo.all', 'All') : t(`blocks.hudoo.grade.${g}`, g);

  if (links.length) {
    return (
      <nav className="hd-grade-filter" aria-label={t('blocks.hudoo.filter_by_grade', 'Filter by grade')}>
        <span className="hd-grade-filter__item is-active" aria-current="page">
          <Swatch grade="all" />
          <span className="hd-grade-filter__label">{label('all')}</span>
        </span>
        {links.map((link) => (
          <Link key={link.grade} to={link.url} className="hd-grade-filter__item">
            <Swatch grade={link.grade} />
            <span className="hd-grade-filter__label">{label(link.grade)}</span>
          </Link>
        ))}
      </nav>
    );
  }

  if (grades.length < 2) return null;
  return (
    <div className="hd-grade-filter" role="group" aria-label={t('blocks.hudoo.filter_by_grade', 'Filter by grade')}>
      {(['all', ...grades] as GradeFilterValue[]).map((g) => (
        <button
          key={g}
          type="button"
          className={`hd-grade-filter__item${value === g ? ' is-active' : ''}`}
          aria-pressed={value === g}
          onClick={() => onChange(g)}
        >
          <Swatch grade={g} />
          <span className="hd-grade-filter__label">{label(g)}</span>
        </button>
      ))}
    </div>
  );
}

/** Use chips («للشرب سادة» · «للاتيه» · «للحلويات»). Tap the active one again to clear it. */
export function UseChips({
  uses,
  value,
  onChange,
}: {
  uses: Use[];
  value: Use | null;
  onChange: (value: Use | null) => void;
}) {
  const { t } = useTranslation();
  if (!uses.length) return null;
  return (
    <div className="hd-chips" role="group" aria-label={t('blocks.hudoo.filter_by_use', 'Filter by use')}>
      {uses.map((use) => (
        <button
          key={use}
          type="button"
          className={`hd-chips__chip${value === use ? ' is-active' : ''}`}
          aria-pressed={value === use}
          onClick={() => onChange(value === use ? null : use)}
        >
          {t(`blocks.hudoo.use.${use}`, use)}
        </button>
      ))}
    </div>
  );
}

/** «محتار بين الدرجات؟» — a highlight banner inside the grid (theme settings `quiz_banner_*`). */
export function QuizBanner() {
  const { t, locale } = useTranslation();
  const { theme } = useTwilight();
  const settings = (theme?.settings ?? {}) as Record<string, unknown>;
  const enabled = isOn(settings.quiz_banner_enabled);
  const title =
    localizedText(settings.quiz_banner_title, locale) || t('blocks.hudoo.quiz_title', 'Not sure which grade?');
  const text =
    localizedText(settings.quiz_banner_text, locale) ||
    t('blocks.hudoo.quiz_text', 'A quick guide to the grade that suits you');
  const raw = typeof settings.quiz_banner_link === 'string' ? settings.quiz_banner_link.trim() : '';
  const href = safeUrl(raw) ?? '/#grade-finder';

  const content = useMemo(
    () => (
      <>
        <span className="hd-quiz__text">
          <span className="hd-display hd-quiz__title">{title}</span>
          <span className="hd-quiz__sub">{text}</span>
        </span>
        <span className="hd-quiz__go" aria-hidden="true">
          <BrandIcon name="forward" className="h-[18px] w-[18px]" />
        </span>
      </>
    ),
    [title, text]
  );

  if (!enabled) return null;
  return href.startsWith('/') && !href.includes('#') ? (
    <Link to={href} className="hd-quiz">
      {content}
    </Link>
  ) : (
    <a href={href} className="hd-quiz">
      {content}
    </a>
  );
}
