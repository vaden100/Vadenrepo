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

/** Square-cornered paper. No drop shadows anywhere. */
export const radius = { none: 0, paper: 2 } as const;

export const borderWidth = { hairline: 1, stroke: 2 } as const;

/** Minimum touch target (one-handed, cracked phone). */
export const touchTarget = 48;

export const motion = {
  /** Stamp slam: scale 1.15 to 1. */
  stampSlam: { durationMs: 120, fromScale: 1.15, toScale: 1 },
  fade: { durationMs: 150 },
  receiptSlide: { durationMs: 180, distance: 12 },
  easing: 'cubic-bezier(0.2, 0, 0, 1)',
} as const;

export const breakpoints = { sm: 480, md: 768, lg: 1024, xl: 1280 } as const;
