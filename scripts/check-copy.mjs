#!/usr/bin/env node
/**
 * Copy rules (SPEC 6.2) on every visible string and on component source:
 * no em dashes, no emojis or symbols, no banned phrases, no "!" in headings or buttons,
 * and no hardcoded copy in components (text belongs in packages/i18n).
 */
import fs from 'node:fs';
import path from 'node:path';
import { en } from '../packages/i18n/src/strings.en.ts';
import { copyProblems } from './lib/copy.mjs';

const root = path.resolve(import.meta.dirname, '..');
const problems = [];

function flatten(obj, prefix = '') {
  if (typeof obj === 'string') return [[prefix, obj]];
  return Object.entries(obj).flatMap(([k, v]) => flatten(v, prefix ? `${prefix}.${k}` : k));
}

for (const [key, text] of flatten(en))
  for (const p of copyProblems(key, text)) problems.push(`strings.en ${key}: ${p}: ${text}`);

function* walk(dir) {
  if (!fs.existsSync(dir)) return;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (!['node_modules', 'generated', '.next'].includes(e.name)) yield* walk(p);
    } else if (/\.(tsx?|css|md)$/.test(e.name) && !/\.test\.tsx?$/.test(e.name)) yield p;
  }
}

const dirs = [
  'apps/web/app',
  'apps/web/components',
  'apps/web/lib',
  'apps/web/content',
  'packages/ui/src',
];
for (const d of dirs) {
  for (const file of walk(path.join(root, d))) {
    const rel = path.relative(root, file);
    fs.readFileSync(file, 'utf8')
      .split('\n')
      .forEach((line, i) => {
        if (/^\s*(\/\/|\*|\/\*|\{\/\*)/.test(line)) return;
        for (const p of copyProblems('', line))
          problems.push(`${rel}:${i + 1} ${p}: ${line.trim()}`);
        // JSX text between tags: copy must come from the strings file.
        if (file.endsWith('.tsx')) {
          for (const m of line.matchAll(/>([^<>{}]*[A-Za-z]{2,}[^<>{}]*)<\//g))
            problems.push(`${rel}:${i + 1} hardcoded copy "${m[1].trim()}" (use packages/i18n)`);
        }
      });
  }
}

if (problems.length) {
  console.error(`Copy check failed (SPEC 6.2):\n  ${problems.join('\n  ')}`);
  process.exit(1);
}
console.log('copy: ok');
