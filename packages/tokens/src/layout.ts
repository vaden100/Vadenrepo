/** 4 px base grid. */
export const space = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
} as const;

export type SpaceToken = keyof typeof space;

/** Square-cornered paper (SPEC 13): every size is 2px on purpose. */
export const radius = { none: 0, paper: 2, sm: 2, md: 2, lg: 2 } as const;

/** No drop shadows anywhere (SPEC 13). Tokens exist so components never hardcode one. */
export const shadow = { none: 'none', sm: 'none', md: 'none' } as const;

/** Stacking order. Never use a raw z-index. */
export const zIndex = {
  base: 0,
  sticky: 10,
  header: 20,
  dropdown: 30,
  banner: 40,
  modal: 50,
  toast: 60,
  skipLink: 70,
} as const;

export const borderWidth = { hairline: 1, stroke: 2 } as const;

/** Minimum touch target (one-handed, cracked phone). */
export const touchTarget = 48;

/** Named durations/easings (WBS 15). Only transform and opacity animate. */
export const duration = { fast: 120, normal: 150, slow: 240 } as const;
export const easing = {
  standard: 'cubic-bezier(0.2, 0, 0, 1)',
  emphasized: 'cubic-bezier(0.3, 0, 0, 1.2)',
  enter: 'cubic-bezier(0, 0, 0, 1)',
  exit: 'cubic-bezier(0.3, 0, 1, 1)',
} as const;

export const motion = {
  /** Stamp slam: scale 1.15 to 1. */
  stampSlam: { durationMs: 120, fromScale: 1.15, toScale: 1 },
  fade: { durationMs: 150 },
  receiptSlide: { durationMs: 180, distance: 12 },
  easing: 'cubic-bezier(0.2, 0, 0, 1)',
} as const;

export const breakpoints = { sm: 480, md: 768, lg: 1024, xl: 1280 } as const;
