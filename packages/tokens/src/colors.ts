/**
 * Color tokens (SPEC 6.4). One source of truth for every theme.
 *
 * Mapped from the colors on the current site (docs/discovery.md, brand inventory): black ink,
 * whiteboard white and the red of the S.O.S (Stack Over Shine) star. Adjustments for contrast are recorded in
 * docs/decisions.md. Every pair used in the UI is tested in contrast.test.ts.
 */
export const colorTokenNames = [
  'background',
  'surface',
  'text',
  'textSecondary',
  'border',
  'borderStrong',
  'accent',
  'onAccent',
  'give',
  'onGive',
  'help',
  'onHelp',
  'danger',
  'success',
  'focus',
] as const;

export type ColorToken = (typeof colorTokenNames)[number];
export type Palette = Record<ColorToken, string>;
export type ThemeName = 'light' | 'dark' | 'lightContrast' | 'darkContrast';

export const themes: Record<ThemeName, Palette> = {
  light: {
    background: '#FAFAF8', // whiteboard
    surface: '#F1F0EC',
    text: '#121212', // marker black
    textSecondary: '#3B3B3B',
    border: '#D4D2CC', // decorative dividers only, never the only boundary of a control
    borderStrong: '#6B6B6B', // form controls (3:1)
    accent: '#9E0019', // S.O.S star red, darkened from the screen red for 7:1
    onAccent: '#FFFFFF',
    give: '#9E0019',
    onGive: '#FFFFFF',
    help: '#0B3D91', // whiteboard blue marker
    onHelp: '#FFFFFF',
    danger: '#8A1500',
    success: '#17521B',
    focus: '#0B3D91',
  },
  dark: {
    background: '#111111',
    surface: '#1C1C1C',
    text: '#F4F3EF',
    textSecondary: '#CFCCC4',
    border: '#3A3A3A',
    borderStrong: '#8F8F8F',
    accent: '#FF8C94',
    onAccent: '#1A0003',
    give: '#FF8C94',
    onGive: '#1A0003',
    help: '#9DB8FF',
    onHelp: '#0B1A3D',
    danger: '#FF9B85',
    success: '#8FD694',
    focus: '#9DB8FF',
  },
  lightContrast: {
    background: '#FFFFFF',
    surface: '#FFFFFF',
    text: '#000000',
    textSecondary: '#000000',
    border: '#000000',
    borderStrong: '#000000',
    accent: '#7A0012',
    onAccent: '#FFFFFF',
    give: '#7A0012',
    onGive: '#FFFFFF',
    help: '#00236B',
    onHelp: '#FFFFFF',
    danger: '#6B1000',
    success: '#0E3B12',
    focus: '#000000',
  },
  darkContrast: {
    background: '#000000',
    surface: '#000000',
    text: '#FFFFFF',
    textSecondary: '#FFFFFF',
    border: '#FFFFFF',
    borderStrong: '#FFFFFF',
    accent: '#FFC2C6',
    onAccent: '#000000',
    give: '#FFC2C6',
    onGive: '#000000',
    help: '#C7D6FF',
    onHelp: '#000000',
    danger: '#FFC0B3',
    success: '#B9F0BC',
    focus: '#FFFFFF',
  },
};

/**
 * Pairs the UI actually uses, with the minimum ratio each needs (SPEC 6.4 and 11):
 * 7 for body text (AAA), 4.5 for UI text, 3 for control boundaries and the focus ring.
 */
export const requiredPairs: ReadonlyArray<[fg: ColorToken, bg: ColorToken, min: number]> = [
  ['text', 'background', 7],
  ['text', 'surface', 7],
  ['textSecondary', 'background', 7],
  ['textSecondary', 'surface', 7],
  ['accent', 'background', 7], // links inside body text
  ['accent', 'surface', 7],
  ['danger', 'background', 7], // error messages are read as body text
  ['danger', 'surface', 7],
  ['success', 'background', 4.5],
  ['success', 'surface', 4.5],
  ['onAccent', 'accent', 4.5],
  ['onGive', 'give', 4.5],
  ['onHelp', 'help', 4.5],
  ['help', 'background', 4.5],
  ['borderStrong', 'background', 3],
  ['borderStrong', 'surface', 3],
  ['focus', 'background', 3],
  ['focus', 'surface', 3],
];
