# هُدوء · Hudoo

قالب سلة هادئ لمتاجر الماتشا والشاي. الفكرة: شراء الماتشا يكون واضحاً ومريحاً.
العميل يعرف الدرجة، ويشوف الطعم، ويتعلم طريقة التحضير، ثم يشتري بثقة.

A calm Salla theme for matcha and tea stores: customers understand the grade, see
the taste, learn the ritual, then buy with confidence. Built on Salla's React theme
engine (`@salla.sa/twilight-theme-engine`, TanStack Start), starting from Theme Raed.

## التشغيل على جهازك · Run it

Node 20.19+ and pnpm 10+.

```bash
pnpm install
cp .env.example .env
pnpm dev
```

Open `http://localhost:5173/ar` (Arabic, RTL) or `/en`. To use your own demo store:
`salla theme dev --store` (needs `npm install -g @salla.sa/cli`).

## Checks

```bash
pnpm build
pnpm typecheck
pnpm test
pnpm check:manifest
```

## What's in the theme

| Area | Where |
| --- | --- |
| Colour tokens (Matcha / Hojicha presets, merchant colours, grade colours) | `app/lib/tokens.ts`, `app/styles/01-settings/tokens.scss`, `tailwind.config.cjs` |
| Header, announcement bar, footer | `app/components/layout/` |
| Home blocks (Hero, Trust strip, Grade Finder, Product rail, Ritual kit, Brew guide, Story, Recipe) | `app/components/home/hudoo/` |
| Product card (registered as `product:card`) | `app/components/product/HudooProductCard.tsx` |
| Category page (grade circles, use chips, quiz banner) | `app/components/product/HudooCatalog.tsx`, `ProductListPage.tsx` |
| Product page (badges, cost per cup, taste profile, brew steps, complete the ritual) | `app/components/product/HudooProductExtras.tsx` |
| Cart (free-shipping bar, upsell) | `app/components/cart/HudooCart.tsx` |
| Matcha data from product tags | `app/lib/productTags.ts` — merchant guide: [`docs/merchant-tags.md`](docs/merchant-tags.md) |
| Merchant settings and home blocks | `twilight.json` |
| Translations | `locales/ar.json`, `locales/en.json` |
| Styles per area | `app/styles/04-components/hudoo-*.scss` |

Engine components copied into the theme are listed in [`FORKS.md`](FORKS.md).
Before publishing, go through [`docs/pre-launch-checklist.md`](docs/pre-launch-checklist.md).

Design: Figma «Hudoo» (pages 02 · Brand Identity and 03 · Theme – Mobile).
