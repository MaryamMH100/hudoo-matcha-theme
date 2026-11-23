import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { HudooGradeFinder } from '../../../../app/components/home/hudoo/HudooGradeFinder';

// English strings from locales/en.json, as the engine would serve them.
vi.mock('@salla.sa/twilight-theme-engine/i18n', async () => {
  const en = (await import('../../../../locales/en.json')).default as Record<string, string>;
  return {
    useTranslation: () => ({ t: (k: string, fb?: string) => en[k] ?? fb ?? k, locale: 'en', isRTL: false }),
  };
});

vi.mock('@salla.sa/twilight-theme-engine/common', () => ({
  Link: ({ to, children, className }: { to: string; children?: unknown; className?: string }) => (
    <a href={to} className={className}>
      {children as never}
    </a>
  ),
  Image: ({ alt, src, className }: Record<string, unknown>) => (
    <img alt={String(alt ?? '')} src={String(src ?? '')} className={String(className ?? '')} />
  ),
}));

const grades = [
  { grade: 'ceremonial', description: 'Smooth', umami: 5, sweetness: 4, bitterness: 1, link: '/c/1', link_text: 'Shop ceremonial' },
  { grade: 'premium', description: 'Balanced', umami: 4, sweetness: 3, bitterness: 2 },
  { grade: 'culinary', description: 'Bold', umami: 2 },
];

describe('HudooGradeFinder', () => {
  it('renders one tab per grade and the first grade’s card', () => {
    render(<HudooGradeFinder data={{ title: 'Grades', grades }} />);
    const tabs = screen.getAllByRole('tab');
    expect(tabs).toHaveLength(3);
    expect(tabs[0].getAttribute('aria-selected')).toBe('true');
    expect(screen.getByText('Smooth')).toBeTruthy();
    expect(screen.getByRole('link', { name: /Shop ceremonial/ }).getAttribute('href')).toBe('/c/1');
  });

  it('switches the card on click and with the arrow keys', () => {
    render(<HudooGradeFinder data={{ grades }} />);
    fireEvent.click(screen.getByRole('tab', { name: 'Premium' }));
    expect(screen.getByText('Balanced')).toBeTruthy();

    fireEvent.keyDown(screen.getByRole('tablist'), { key: 'ArrowRight' });
    expect(screen.getByText('Bold')).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'Culinary' }).getAttribute('aria-selected')).toBe('true');

    fireEvent.keyDown(screen.getByRole('tablist'), { key: 'Home' });
    expect(screen.getByText('Smooth')).toBeTruthy();
  });

  it('shows only the taste values the merchant filled, and falls back to all products', () => {
    render(<HudooGradeFinder data={{ grades }} />);
    fireEvent.click(screen.getByRole('tab', { name: 'Culinary' }));
    expect(screen.getByText('Umami')).toBeTruthy();
    expect(screen.queryByText('Bitterness')).toBeNull();
    expect(screen.getByRole('link', { name: /Shop/ }).getAttribute('href')).toBe('/products');
  });

  it('skips unknown or repeated grades and renders nothing without any', () => {
    const { container, rerender } = render(
      <HudooGradeFinder data={{ grades: [{ grade: 'gold' }, { grade: 'premium' }, { grade: 'premium' }] }} />
    );
    expect(screen.queryAllByRole('tab')).toHaveLength(0); // one grade: no tab bar
    expect(screen.getByRole('heading', { name: 'Premium' })).toBeTruthy();
    rerender(<HudooGradeFinder data={{ grades: [] }} />);
    expect(container.innerHTML).toBe('');
  });
});
