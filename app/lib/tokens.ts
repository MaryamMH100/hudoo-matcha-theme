/**
 * Hudoo design tokens.
 *
 * One place for every colour the theme uses. Two presets (Matcha, Hojicha),
 * then the merchant's own colour settings on top. The result is a small CSS
 * block of variables (`--hd-*`) that Tailwind classes such as `bg-canvas`,
 * `text-ink` or `bg-primary` read (see `tailwind.config.cjs`).
 *
 * Grade colours are fixed on purpose: they show the real colour of the matcha,
 * so a merchant cannot change them.
 */

export type PresetId = 'matcha' | 'hojicha';

/** The token names a merchant can change, and the setting id for each. */
export const COLOR_TOKENS = [
  'bg',
  'surface',
  'line',
  'text',
  'muted',
  'on-primary',
  'primary',
  'deep',
  'highlight',
  'accent',
] as const;
export type ColorToken = (typeof COLOR_TOKENS)[number];

export const PRESETS: Record<PresetId, Record<ColorToken, string>> = {
  matcha: {
    bg: '#F2EEE3',
    surface: '#FBF9F4',
    line: '#DCD6C6',
    text: '#141811',
    muted: '#6B6F63',
    'on-primary': '#FFFFFF',
    primary: '#3F6B2A',
    deep: '#1E2E17',
    highlight: '#A9C96B',
    accent: '#B9805A',
  },
  hojicha: {
    bg: '#F1E9DF',
    surface: '#FCF8F3',
    line: '#E2D6C8',
    text: '#1E1510',
    muted: '#7A6C61',
    'on-primary': '#FFFFFF',
    primary: '#7A4A2E',
    deep: '#3A2318',
    highlight: '#D9B48A',
    accent: '#6F8F45',
  },
};

/** Fixed grade colours (not merchant-editable). */
export const GRADE_COLORS = {
  ceremonial: '#7DB23A',
  premium: '#93A845',
  culinary: '#8C8B3E',
} as const;

/** `twilight.json` setting id for a colour token, e.g. `color_on_primary`. */
export const colorSettingId = (token: ColorToken) => `color_${token.replace('-', '_')}`;

const HEX = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;

/** A clean `#rrggbb` value, or `null`. Anything else is ignored, so a setting
 *  can never inject CSS into the page. */
export function cleanHex(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const value = raw.trim();
  if (!HEX.test(value)) return null;
  if (value.length === 4) {
    return `#${value[1]}${value[1]}${value[2]}${value[2]}${value[3]}${value[3]}`.toUpperCase();
  }
  return value.toUpperCase();
}

/** A dropdown setting arrives as `'x'` or `[{ value: 'x' }]`; read both. */
export function dropdownValue(raw: unknown): string | undefined {
  const first = Array.isArray(raw) ? raw[0] : raw;
  if (typeof first === 'string') return first;
  return (first as { value?: string } | undefined)?.value;
}

export function presetId(raw: unknown): PresetId {
  return dropdownValue(raw) === 'hojicha' ? 'hojicha' : 'matcha';
}

/** Final colours: the preset, then any valid merchant colour on top. */
export function resolveColors(settings: Record<string, unknown> | undefined) {
  const colors = { ...PRESETS[presetId(settings?.color_preset)] };
  for (const token of COLOR_TOKENS) {
    const custom = cleanHex(settings?.[colorSettingId(token)]);
    if (custom) colors[token] = custom;
  }
  return colors;
}

/**
 * The CSS block for `<ThemeTokens>`. Set on `body`, so it also wins over the
 * merchant's dashboard colour the engine writes on `<html>`, unless the
 * merchant turned `use_store_primary` on.
 */
export function buildTokenCss(settings: Record<string, unknown> | undefined): string {
  const colors = resolveColors(settings);
  const lines: string[] = [];
  for (const token of COLOR_TOKENS) {
    lines.push(`--hd-${token}:${colors[token]}`);
  }

  if (settings?.use_store_primary === true) {
    // Follow the main colour the merchant picked in the Salla dashboard.
    lines.push('--hd-primary:var(--color-primary)');
  } else {
    // Salla web components (buttons, modals, cart summary) read these.
    lines.push(
      `--color-primary:${colors.primary}`,
      `--color-primary-dark:${colors.deep}`,
      `--color-primary-light:${colors.highlight}`,
      `--color-primary-reverse:${colors['on-primary']}`
    );
  }

  // Brand fonts (Readex Pro for the interface) unless the merchant prefers the
  // store font they picked in the dashboard.
  if (settings?.use_brand_fonts !== false) {
    lines.push(`--hd-font-ui:Readex Pro,var(--font-main),system-ui,sans-serif`);
  }

  return `body{${lines.join(';')}}`;
}
