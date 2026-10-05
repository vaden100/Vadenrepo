/** Color tokens from SPEC.md section 13. Never add a color here without updating the spec. */
export const colors = {
  ink: '#111111',
  graphite: '#2A2A2A',
  smoke: '#3A3A38',
  paper: '#F2EEE6',
  paperInk: '#1C1B19',
  mute: '#8A8A85',
  stampRed: '#C8202B',
  caution: '#F5C518',
  manila: '#CFA86A',
  statusVerifying: '#B8860B',
  statusContacted: '#2E5E8C',
  statusResolved: '#2F7D4A',
  /**
   * NOT in SPEC 13. Paper text on statusResolved is 4.37:1 (fails AA), so text-bearing
   * fills (stamps) use this slightly deeper green. statusResolved stays for non-text use.
   */
  statusResolvedText: '#2C7646',
  statusClosed: '#5A5A57',
} as const;

export type ColorToken = keyof typeof colors;

/** Semantic roles. Components use these, not raw palette names. */
export const themes = {
  dark: {
    background: colors.ink,
    surface: colors.graphite,
    border: colors.smoke,
    text: colors.paper,
    textMuted: colors.mute,
    primary: colors.stampRed,
    onPrimary: colors.paper,
    focus: colors.caution,
    highlight: colors.caution,
  },
  light: {
    background: colors.paper,
    surface: '#E6E0D4',
    border: '#CFC8BA',
    text: colors.paperInk,
    textMuted: '#5E5D58',
    primary: colors.stampRed,
    onPrimary: colors.paper,
    focus: colors.paperInk,
    highlight: colors.caution,
  },
} as const;

export type ThemeName = keyof typeof themes;
export type ThemeRole = keyof (typeof themes)['dark'];
