/**
 * The theme's product card. Every list, slider and grid in the theme imports
 * `ProductCard` from here (or from `../product`), and the engine's own lists
 * use the same component through the `product:card` registry override
 * (app/router.tsx). The design lives in `HudooProductCard`.
 */
export { HudooProductCard as ProductCard } from './HudooProductCard';
