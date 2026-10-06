import { colors, themes } from './colors';
import { fluidType, typeScale, type fontFamilies } from './type';
import {
  borderWidth,
  breakpoints,
  duration,
  easing,
  motion,
  radius,
  shadow,
  space,
  zIndex,
} from './layout';

const kebab = (s: string) => s.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);

const fallbacks = {
  headline: "'Archivo Variable', 'Archivo', 'Arial Narrow', system-ui, sans-serif",
  body: "'IBM Plex Sans', system-ui, -apple-system, 'Segoe UI', sans-serif",
  mono: "'IBM Plex Mono', ui-monospace, 'SFMono-Regular', Menlo, monospace",
} as const satisfies Record<keyof typeof fontFamilies, string>;

function block(selector: string, vars: Record<string, string | number>, extra = ''): string {
  const body = Object.entries(vars)
    .map(([k, v]) => `  --${k}: ${v};`)
    .join('\n');
  return `${selector} {\n${extra}${body}\n}`;
}

/** Theme roles plus the WBS 3 semantic aliases, so either naming works. */
function themeVars(name: keyof typeof themes): Record<string, string> {
  const t = themes[name];
  return {
    ...Object.fromEntries(Object.entries(t).map(([k, v]) => [`color-${kebab(k)}`, v])),
    'color-text-primary': t.text,
    'color-accent': t.primary,
    'color-accent-hover': t.primaryPressed,
    'color-error': t.danger,
  };
}

const themeBlock = (selector: string, name: keyof typeof themes) =>
  block(selector, themeVars(name), `  color-scheme: ${name};\n`);

/**
 * All tokens as CSS custom properties.
 * Dark is the default; with no explicit choice the OS preference wins ("system");
 * `data-theme="light" | "dark"` on <html> (set server-side from a cookie, so no flash) wins over both.
 */
export function cssVariables(): string {
  const root: Record<string, string | number> = {};
  for (const [k, v] of Object.entries(colors)) root[`rmmm-${kebab(k)}`] = v;
  for (const [k, v] of Object.entries(space)) root[`space-${k}`] = `${v}px`;
  for (const [k, v] of Object.entries(radius)) root[`radius-${k}`] = `${v}px`;
  for (const [k, v] of Object.entries(borderWidth)) root[`border-${k}`] = `${v}px`;
  for (const [k, v] of Object.entries(fallbacks)) root[`font-${k}`] = v;
  for (const [k, v] of Object.entries(typeScale)) {
    root[`text-${kebab(k)}-size`] = `${v.size}px`;
    root[`text-${kebab(k)}-line`] = `${v.lineHeight}px`;
    root[`text-${kebab(k)}-weight`] = v.weight;
  }
  for (const [k, v] of Object.entries(fluidType)) root[`text-fluid-${k}`] = v;
  for (const [k, v] of Object.entries(duration)) root[`duration-${k}`] = `${v}ms`;
  for (const [k, v] of Object.entries(easing)) root[`ease-${k}`] = v;
  for (const [k, v] of Object.entries(zIndex)) root[`z-${kebab(k)}`] = v;
  for (const [k, v] of Object.entries(shadow)) root[`shadow-${k}`] = v;
  for (const [k, v] of Object.entries(breakpoints)) root[`bp-${k}`] = `${v}px`;
  root['motion-stamp-slam'] = `${motion.stampSlam.durationMs}ms`;
  root['motion-fade'] = `${motion.fade.durationMs}ms`;
  root['motion-receipt-slide'] = `${motion.receiptSlide.durationMs}ms`;
  root['motion-easing'] = motion.easing;

  const lightSystem = themeBlock(':root:not([data-theme="dark"])', 'light')
    .split('\n')
    .map((l) => `  ${l}`)
    .join('\n');

  return [
    block(':root', root),
    themeBlock(':root, [data-theme="dark"]', 'dark'),
    `@media (prefers-color-scheme: light) {\n${lightSystem}\n}`,
    themeBlock('[data-theme="light"]', 'light'),
    [
      '@media (prefers-reduced-motion: reduce) {',
      '  :root {',
      ...[
        'motion-stamp-slam',
        'motion-fade',
        'motion-receipt-slide',
        'duration-fast',
        'duration-normal',
        'duration-slow',
      ].map((k) => `    --${k}: 0ms;`),
      '  }',
      '}',
    ].join('\n'),
  ].join('\n\n');
}
