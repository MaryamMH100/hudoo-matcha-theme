import type { ReactNode } from 'react';
import { Link } from '@salla.sa/twilight-theme-engine/common';
import { BrandIcon } from '../../brandIcons';

/** Data every home block receives, plus its own fields. */
export interface BlockProps<T = Record<string, unknown>> {
  data: T & { position?: number; priority?: boolean; [key: string]: unknown };
}

/** Site paths use the router; full URLs (Salla product links are absolute)
 *  and in-page anchors stay plain links in the same tab. */
export function SmartLink({
  to,
  className,
  children,
  ...rest
}: {
  to: string;
  className?: string;
  children: ReactNode;
  'aria-label'?: string;
}) {
  if (to.startsWith('/')) {
    return (
      <Link to={to} className={className} {...rest}>
        {children}
      </Link>
    );
  }
  return (
    <a href={to} className={className} {...rest}>
      {children}
    </a>
  );
}

/** Eyebrow + Amiri title, the head every Hudoo section shares (Figma: «دليل الدرجات» / «الطريقة»). */
export function SectionHead({
  eyebrow,
  title,
  id,
  action,
  tone = 'light',
}: {
  eyebrow?: string;
  title?: string;
  id?: string;
  action?: ReactNode;
  tone?: 'light' | 'dark';
}) {
  if (!eyebrow && !title && !action) return null;
  return (
    <div className={`hd-section-head hd-section-head--${tone}${action ? ' has-action' : ''}`}>
      <div className="hd-section-head__text">
        {eyebrow && <p className="hd-eyebrow">{eyebrow}</p>}
        {title && (
          <h2 id={id} className="hd-display hd-section-head__title">
            {title}
          </h2>
        )}
      </div>
      {action}
    </div>
  );
}

/** «عرض الكل ←» link next to a section title. */
export function ViewAllLink({ to, label }: { to: string; label: string }) {
  return (
    <SmartLink to={to} className="hd-view-all">
      <span>{label}</span>
      <BrandIcon name="forward" className="h-3.5 w-3.5" />
    </SmartLink>
  );
}
