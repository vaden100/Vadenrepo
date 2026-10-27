/** Spacing, type and shape (SPEC 6.3, 6.5). */
export const space = [0, 4, 8, 12, 16, 24, 32, 48, 64, 96] as const;

export const font = {
  text: "'Atkinson Hyperlegible Next Variable', system-ui, sans-serif",
  display: "'Fraunces Variable', Georgia, serif",
} as const;

export const type = {
  bodyDesktop: 18,
  bodyMobile: 17,
  lineHeight: 1.6,
  measure: '68ch',
  /** Display sizes in px; clamp()ed in CSS. */
  h1: 48,
  h2: 34,
  h3: 26,
  small: 15,
} as const;

export const layout = {
  maxWidth: 1200,
  columns: 12,
  gutter: 16,
  touchTarget: 48,
  minTarget: 24,
  radius: 4,
} as const;

export const motion = {
  fast: 150,
  draw: 600,
} as const;
