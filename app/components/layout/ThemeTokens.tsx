import { useTwilight } from '@salla.sa/twilight-theme-engine/providers';
import { buildTokenCss, presetId } from '../../lib/tokens';

/**
 * Writes the theme's colour and font variables (`--hd-*`) for the current
 * settings: the chosen preset (Matcha / Hojicha) plus any colour the merchant
 * changed. Rendered once by `ThemeLayout`, on the server too, so the first paint
 * already has the right colours. Values are checked in `lib/tokens.ts`, so no
 * setting text reaches the CSS unchecked.
 */
export function ThemeTokens() {
  const { theme } = useTwilight();
  const settings = theme?.settings as Record<string, unknown> | undefined;
  return (
    // Plain text child, built only from validated hex colours and fixed strings.
    <style data-hd-tokens={presetId(settings?.color_preset)}>{buildTokenCss(settings)}</style>
  );
}
