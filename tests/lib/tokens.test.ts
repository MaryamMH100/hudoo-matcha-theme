import { describe, expect, it } from 'vitest';
import { buildTokenCss, cleanHex, resolveColors, PRESETS } from '../../app/lib/tokens';

describe('tokens', () => {
  it('uses the Matcha preset by default', () => {
    expect(resolveColors({})).toEqual(PRESETS.matcha);
    expect(resolveColors(undefined).primary).toBe('#3F6B2A');
  });

  it('switches to Hojicha (string or [{ value }])', () => {
    expect(resolveColors({ color_preset: 'hojicha' }).primary).toBe('#7A4A2E');
    expect(resolveColors({ color_preset: [{ value: 'hojicha' }] }).bg).toBe('#F1E9DF');
  });

  it('lets valid merchant colours win, and ignores anything else', () => {
    const colors = resolveColors({ color_primary: '#abc', color_bg: 'red;}body{x', color_accent: '' });
    expect(colors.primary).toBe('#AABBCC');
    expect(colors.bg).toBe(PRESETS.matcha.bg);
    expect(colors.accent).toBe(PRESETS.matcha.accent);
  });

  it('cleanHex only accepts hex colours', () => {
    expect(cleanHex(' #3f6b2a ')).toBe('#3F6B2A');
    expect(cleanHex('url(x)')).toBeNull();
    expect(cleanHex(42)).toBeNull();
  });

  it('builds a body block with Salla component colours and brand fonts', () => {
    const css = buildTokenCss({});
    expect(css.startsWith('body{')).toBe(true);
    expect(css).toContain('--hd-primary:#3F6B2A');
    expect(css).toContain('--color-primary:#3F6B2A');
    expect(css).toContain('--hd-font-ui:Readex Pro');
    expect(css).not.toMatch(/[<>"']/);
  });

  it('follows the store colour and font when the merchant asks', () => {
    const css = buildTokenCss({ use_store_primary: true, use_brand_fonts: false });
    expect(css).toContain('--hd-primary:var(--color-primary)');
    expect(css).not.toContain('--color-primary:#');
    expect(css).not.toContain('--hd-font-ui');
  });
});
