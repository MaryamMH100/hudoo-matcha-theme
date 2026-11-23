import type { SVGProps } from 'react';

/**
 * Hudoo brand icons, taken from the Figma file (03 · Theme – Mobile): trust strip,
 * brew guide and the "forward" arrow. Line icons, 1.6 stroke, `currentColor`, so
 * they follow the text colour. Each shape keeps its Figma geometry and is centred
 * in a square box; size them with CSS (`h-5 w-5`) or `width` / `height`.
 */

type Shape = { d: string };
/** `w` × `h`: the shape's own size; `box`: the Figma icon frame it sits in (so the
 *  1.6 stroke keeps its weight at the frame's size). */
type IconDef = { w: number; h: number; box: number; paths: Shape[] };

const ICONS = {
  snow: {
    w: 13.3003,
    h: 15.1,
    box: 18,
    paths: [{ d: 'M6.65013 0.8V14.3M0.800134 4.175L12.5001 10.925M0.800134 10.925L12.5001 4.175' }],
  },
  mill: {
    w: 13.6,
    h: 13.6,
    box: 18,
    paths: [
      {
        d: 'M12.8 6.8C12.8 10.1137 10.1137 12.8 6.8 12.8C3.48629 12.8 0.8 10.1137 0.8 6.8C0.8 3.48629 3.48629 0.8 6.8 0.8C10.1137 0.8 12.8 3.48629 12.8 6.8Z',
      },
      {
        d: 'M8.675 6.8C8.675 7.83553 7.83553 8.675 6.8 8.675C5.76447 8.675 4.925 7.83553 4.925 6.8C4.925 5.76447 5.76447 4.925 6.8 4.925C7.83553 4.925 8.675 5.76447 8.675 6.8Z',
      },
    ],
  },
  leaf: {
    w: 12.1,
    h: 12.1,
    box: 18,
    paths: [
      { d: 'M0.8 11.3C0.8 5.30001 4.55 1.55001 11.3 0.800005C10.55 7.55001 6.8 11.3 0.8 11.3Z' },
      { d: 'M0.8 11.3L6.8 5.30001' },
    ],
  },
  whisk: {
    w: 8.26667,
    h: 16.6,
    box: 20,
    paths: [
      { d: 'M4.13334 15.8V10.8' },
      {
        d: 'M0.800004 10.8H7.46667L6.63334 3.3C6.63334 2.63696 6.36995 2.00107 5.9011 1.53223C5.43226 1.06339 4.79638 0.8 4.13334 0.8C3.4703 0.8 2.83441 1.06339 2.36557 1.53223C1.89673 2.00107 1.63334 2.63696 1.63334 3.3L0.800004 10.8Z',
      },
      { d: 'M2.88334 10.8L2.46667 3.3M5.38334 10.8L5.8 3.3M4.13334 10.8V2.46667' },
    ],
  },
  thermo: {
    w: 8.26667,
    h: 17.6534,
    box: 20,
    paths: [
      {
        d: 'M5.8 10.6333V2.46667C5.8 2.02464 5.62441 1.60072 5.31185 1.28816C4.99929 0.975595 4.57536 0.8 4.13334 0.8C3.69131 0.8 3.26738 0.975595 2.95482 1.28816C2.64226 1.60072 2.46667 2.02464 2.46667 2.46667V10.6333C1.8312 11.0002 1.33454 11.5665 1.05374 12.2445C0.772931 12.9224 0.723666 13.674 0.913582 14.3828C1.1035 15.0916 1.52198 15.7179 2.10413 16.1646C2.68628 16.6113 3.39955 16.8534 4.13334 16.8534C4.86712 16.8534 5.58039 16.6113 6.16254 16.1646C6.74469 15.7179 7.16317 15.0916 7.35309 14.3828C7.543 13.674 7.49374 12.9224 7.21293 12.2445C6.93213 11.5665 6.43547 11.0002 5.8 10.6333Z',
      },
    ],
  },
  drop: {
    w: 11.6,
    h: 15.35,
    box: 20,
    paths: [
      {
        d: 'M5.8 0.8C5.8 0.8 10.8 6.05 10.8 9.55C10.8 10.8761 10.2732 12.1479 9.33553 13.0855C8.39785 14.0232 7.12608 14.55 5.8 14.55C4.47392 14.55 3.20215 14.0232 2.26447 13.0855C1.32678 12.1479 0.8 10.8761 0.8 9.55C0.8 6.05 5.8 0.8 5.8 0.8Z',
      },
    ],
  },
  spoon: {
    w: 14.9334,
    h: 14.9334,
    box: 20,
    paths: [
      {
        d: 'M6.21667 7.46667L14.1333 14.1333M4.13333 0.8C6.21667 0.8 7.46667 2.46667 7.46667 4.55C7.46667 6.63333 6.21667 8.3 4.13333 8.3C2.05 8.3 0.8 6.63333 0.8 4.55C0.8 2.46667 2.05 0.8 4.13333 0.8Z',
      },
    ],
  },
  heart: {
    w: 11.0334,
    h: 11.003,
    box: 16,
    paths: [
      {
        d: 'M5.51667 10.153C5.51667 10.153 0.85 7.2197 0.85 3.48636C0.856127 2.9473 1.02549 2.42276 1.33576 1.9819C1.64603 1.54104 2.08264 1.20457 2.588 1.01687C3.09336 0.829161 3.64374 0.799032 4.16658 0.930453C4.68941 1.06187 5.16013 1.34867 5.51667 1.75303C5.8732 1.34867 6.34393 1.06187 6.86676 0.930453C7.38959 0.799032 7.93997 0.829161 8.44534 1.01687C8.9507 1.20457 9.3873 1.54104 9.69757 1.9819C10.0078 2.42276 10.1772 2.9473 10.1833 3.48636C10.1833 7.2197 5.51667 10.153 5.51667 10.153Z',
      },
    ],
  },
  plus: {
    w: 11.0333,
    h: 11.0333,
    box: 16,
    paths: [{ d: 'M5.51667 0.85V10.1833M0.85 5.51667H10.1833' }],
  },
  sort: {
    w: 13.6,
    h: 13.6,
    box: 18,
    paths: [{ d: 'M3.05 0.8V12.8M5.3 10.55L3.05 12.8L0.8 10.55M10.55 12.8V0.8M12.8 3.05L10.55 0.8L8.3 3.05' }],
  },
  /** Figma `icon/arrowL`: points left, i.e. "forward" in Arabic. Flipped in LTR by `.hd-icon--forward`. */
  forward: {
    w: 10.9333,
    h: 9.6,
    box: 16,
    paths: [{ d: 'M10.1333 4.8H0.8M4.8 8.8L0.8 4.8L4.8 0.8' }],
  },
} satisfies Record<string, IconDef>;

export type BrandIconName = keyof typeof ICONS;
export const BRAND_ICON_NAMES = Object.keys(ICONS) as BrandIconName[];

export function isBrandIcon(name: unknown): name is BrandIconName {
  return typeof name === 'string' && name in ICONS;
}

export function BrandIcon({
  name,
  className = '',
  ...props
}: { name: BrandIconName } & SVGProps<SVGSVGElement>) {
  const { w, h, box, paths } = ICONS[name];
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${box} ${box}`}
      width={20}
      height={20}
      fill="none"
      aria-hidden="true"
      focusable="false"
      className={`hd-icon${name === 'forward' ? ' hd-icon--forward' : ''} ${className}`.trim()}
      {...props}
    >
      <g transform={`translate(${(box - w) / 2} ${(box - h) / 2})`}>
        {paths.map((p) => (
          <path
            key={p.d}
            d={p.d}
            stroke="currentColor"
            strokeWidth={1.6}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}
      </g>
    </svg>
  );
}
