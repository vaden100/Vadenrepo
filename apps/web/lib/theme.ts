export const THEME_COOKIE = 'rmmm_theme';
export type ThemeChoice = 'system' | 'dark' | 'light';

export function parseTheme(v: string | undefined): ThemeChoice {
  return v === 'dark' || v === 'light' ? v : 'system';
}
