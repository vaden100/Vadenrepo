/** Font families (all SIL OFL, self-hosted). */
export const fontFamilies = {
  headline: 'Archivo',
  body: 'IBM Plex Sans',
  mono: 'IBM Plex Mono',
} as const;

export type FontRole = keyof typeof fontFamilies;

/** Type scale in px. Line heights are absolute px so RN and CSS agree. */
export const typeScale = {
  display: { size: 48, lineHeight: 48, weight: 900, family: 'headline', condensed: true },
  h1: { size: 34, lineHeight: 38, weight: 900, family: 'headline', condensed: true },
  h2: { size: 26, lineHeight: 30, weight: 800, family: 'headline', condensed: false },
  h3: { size: 20, lineHeight: 26, weight: 800, family: 'headline', condensed: false },
  body: { size: 16, lineHeight: 24, weight: 400, family: 'body', condensed: false },
  bodyStrong: { size: 16, lineHeight: 24, weight: 600, family: 'body', condensed: false },
  small: { size: 14, lineHeight: 20, weight: 400, family: 'body', condensed: false },
  label: { size: 13, lineHeight: 16, weight: 600, family: 'body', condensed: false },
  mono: { size: 14, lineHeight: 20, weight: 400, family: 'mono', condensed: false },
  monoStrong: { size: 14, lineHeight: 20, weight: 600, family: 'mono', condensed: false },
} as const satisfies Record<
  string,
  { size: number; lineHeight: number; weight: number; family: FontRole; condensed: boolean }
>;

export type TypeStyle = keyof typeof typeScale;

/** Fluid sizes for big type (WBS 4). Body text stays fixed for readability. */
export const fluidType = {
  display: 'clamp(2.5rem, 1.6rem + 4.5vw, 5.5rem)',
  h1: 'clamp(2rem, 1.5rem + 2.2vw, 3rem)',
  h2: 'clamp(1.5rem, 1.3rem + 0.9vw, 2rem)',
  h3: 'clamp(1.125rem, 1.05rem + 0.4vw, 1.375rem)',
} as const;
