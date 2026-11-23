import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HudooHero } from '../../../../app/components/home/hudoo/HudooHero';

vi.mock('@salla.sa/twilight-theme-engine/i18n', () => ({
  useTranslation: () => ({ t: (_k: string, fb?: string) => fb ?? _k, locale: 'ar' }),
}));

vi.mock('@salla.sa/twilight-theme-engine/common', () => ({
  Link: ({ to, children, className }: { to: string; children?: unknown; className?: string }) => (
    <a href={to} className={className}>
      {children as never}
    </a>
  ),
  Image: ({ src, priority }: Record<string, unknown>) => (
    <img alt="" src={String(src)} data-priority={String(!!priority)} />
  ),
}));

describe('HudooHero', () => {
  it('renders the copy and both buttons with their default links', () => {
    render(
      <HudooHero
        data={{
          position: 1,
          badge: 'الحصاد الأول',
          title: 'طقوس هادئة',
          primary_text: 'تسوّق',
          secondary_text: 'اعرف الدرجات',
        }}
      />
    );
    expect(screen.getByRole('heading', { name: 'طقوس هادئة' })).toBeTruthy();
    expect(screen.getByRole('link', { name: /تسوّق/ }).getAttribute('href')).toBe('/products');
    expect(screen.getByRole('link', { name: 'اعرف الدرجات' }).getAttribute('href')).toBe('#grade-finder');
    // First block on the page: its photo loads first.
    expect(document.querySelector('img')?.getAttribute('data-priority')).toBe('true');
  });

  it('hides a button whose text was cleared, and uses the merchant photo', () => {
    render(<HudooHero data={{ title: 'x', image: 'https://cdn.salla.sa/h.jpg', primary_text: '', secondary_text: '' }} />);
    expect(screen.queryAllByRole('link')).toHaveLength(0);
    expect(document.querySelector('img')?.getAttribute('src')).toBe('https://cdn.salla.sa/h.jpg');
  });
});
