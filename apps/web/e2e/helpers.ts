import AxeBuilder from '@axe-core/playwright';
import { expect, type Page } from '@playwright/test';

/** Every public page (keep in sync with app/sitemap.ts once it exists). */
export const PAGES = ['/', '/styleguide'];

export const MODES = {
  light: { colorScheme: 'light' },
  dark: { colorScheme: 'dark' },
  lightContrast: { colorScheme: 'light', contrast: 'more' },
  darkContrast: { colorScheme: 'dark', contrast: 'more' },
  forcedColors: { colorScheme: 'light', forcedColors: 'active' },
} as const;

export function watchConsole(page: Page) {
  const problems: string[] = [];
  page.on('console', (m) => {
    if (m.type() === 'error') problems.push(m.text());
  });
  page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));
  return problems;
}

/** axe with WCAG 2.2 AA plus AAA text contrast (SPEC 11: body text 7:1). */
export async function expectNoAxeViolations(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'])
    .withRules(['color-contrast-enhanced'])
    .analyze();
  const summary = results.violations.map(
    (v) => `${v.id}: ${v.help}\n    ${v.nodes.map((n) => n.target.join(' ')).join('\n    ')}`,
  );
  expect(summary, summary.join('\n')).toEqual([]);
}

export async function noHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow, 'horizontal overflow in px').toBeLessThanOrEqual(0);
}

/** Sets reading settings in storage before the page loads. */
export async function presetReading(page: Page, settings: Record<string, unknown>) {
  await page.addInitScript((s) => {
    localStorage.setItem('ns1-reading', JSON.stringify(s));
  }, settings);
}
