import { colorTokenNames, themes, type Palette, type ThemeName } from './colors';
import { layout, space, type } from './scale';

const kebab = (s: string) => s.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);

function colorVars(p: Palette): string {
  return colorTokenNames.map((n) => `--color-${kebab(n)}: ${p[n]};`).join(' ');
}

/** Selector that applies each theme. `data-theme` / `data-contrast` come from reading settings. */
const selectors: Record<ThemeName, string> = {
  light: ':root',
  dark: ':root[data-theme="dark"]',
  lightContrast: ':root[data-contrast="more"]',
  darkContrast: ':root[data-theme="dark"][data-contrast="more"]',
};

/**
 * All design tokens as CSS custom properties. System preferences apply unless the visitor
 * picked a setting (`data-theme="light"` or `data-contrast="normal"` pin the choice).
 */
export function cssVariables(): string {
  const base = [
    ...space.map((v, i) => `--space-${i}: ${v}px;`),
    `--body-size: ${type.bodyMobile}px;`,
    `--line-height: ${type.lineHeight};`,
    `--measure: ${type.measure};`,
    `--max-width: ${layout.maxWidth}px;`,
    `--gutter: ${layout.gutter}px;`,
    `--target: ${layout.touchTarget}px;`,
    `--min-target: ${layout.minTarget}px;`,
    `--radius: ${layout.radius}px;`,
  ].join(' ');

  return [
    `:root { ${base} ${colorVars(themes.light)} }`,
    `@media (min-width: 768px) { :root { --body-size: ${type.bodyDesktop}px; } }`,
    `@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { ${colorVars(themes.dark)} } }`,
    `${selectors.dark} { ${colorVars(themes.dark)} }`,
    `@media (prefers-contrast: more) { :root:not([data-contrast="normal"]) { ${colorVars(themes.lightContrast)} } }`,
    `@media (prefers-contrast: more) and (prefers-color-scheme: dark) { :root:not([data-contrast="normal"]):not([data-theme="light"]) { ${colorVars(themes.darkContrast)} } }`,
    `${selectors.lightContrast} { ${colorVars(themes.lightContrast)} }`,
    `${selectors.darkContrast} { ${colorVars(themes.darkContrast)} }`,
    `@media (prefers-color-scheme: dark) { :root[data-contrast="more"]:not([data-theme="light"]) { ${colorVars(themes.darkContrast)} } }`,
  ].join('\n');
}
