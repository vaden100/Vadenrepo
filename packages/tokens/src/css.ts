import { colors, themes } from './colors';
import { typeScale, type fontFamilies } from './type';
import { borderWidth, motion, radius, space } from './layout';

const kebab = (s: string) => s.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);

const fallbacks = {
  headline: "'Archivo Variable', 'Archivo', 'Arial Narrow', system-ui, sans-serif",
  body: "'IBM Plex Sans', system-ui, -apple-system, 'Segoe UI', sans-serif",
  mono: "'IBM Plex Mono', ui-monospace, 'SFMono-Regular', Menlo, monospace",
} as const satisfies Record<keyof typeof fontFamilies, string>;

function block(selector: string, vars: Record<string, string | number>): string {
  const body = Object.entries(vars)
    .map(([k, v]) => `  --${k}: ${v};`)
    .join('\n');
  return `${selector} {\n${body}\n}`;
}

function themeVars(name: keyof typeof themes): Record<string, string> {
  return Object.fromEntries(Object.entries(themes[name]).map(([k, v]) => [`color-${kebab(k)}`, v]));
}

/** All tokens as CSS custom properties. Dark is the default; `[data-theme="light"]` opts in. */
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
  root['motion-stamp-slam'] = `${motion.stampSlam.durationMs}ms`;
  root['motion-fade'] = `${motion.fade.durationMs}ms`;
  root['motion-receipt-slide'] = `${motion.receiptSlide.durationMs}ms`;
  root['motion-easing'] = motion.easing;

  return [
    block(':root', { ...root, ...themeVars('dark') }),
    block('[data-theme="light"]', themeVars('light')),
    '@media (prefers-reduced-motion: reduce) {\n  :root {\n    --motion-stamp-slam: 0ms;\n    --motion-fade: 0ms;\n    --motion-receipt-slide: 0ms;\n  }\n}',
  ].join('\n\n');
}
