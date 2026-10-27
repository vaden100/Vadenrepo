#!/usr/bin/env node
/** `pnpm brand:sync` writes; `pnpm brand:check` (CI) fails if anything is stale or breaks a rule. */
import path from 'node:path';
import { themes } from '../packages/tokens/src/colors.ts';
import { syncBrand } from './lib/brand.mjs';

const root = path.resolve(import.meta.dirname, '..');
const check = process.argv.includes('--check');
const { ok, errors, stale } = syncBrand({
  root,
  check,
  colors: { light: themes.light.text, dark: themes.dark.text },
});

if (!ok) {
  console.error(`Brand rules (SPEC 7.4) failed:\n  ${errors.join('\n  ')}`);
  process.exit(1);
}
if (stale.length) {
  console.error(`Brand files out of date. Run \`pnpm brand:sync\`.\n  ${stale.join('\n  ')}`);
  process.exit(1);
}
console.log(check ? 'brand: up to date' : 'brand: synced');
