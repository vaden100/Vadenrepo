#!/usr/bin/env node
/** Reading level (SPEC 6.1): grade 8 or lower for public prose, grade 6 for Get help. */
import fs from 'node:fs';
import path from 'node:path';
import { en } from '../packages/i18n/src/strings.en.ts';
import { gradeLevel, isProse, maxGradeFor } from './lib/copy.mjs';

function flatten(obj, prefix = '') {
  if (typeof obj === 'string') return [[prefix, obj]];
  return Object.entries(obj).flatMap(([k, v]) => flatten(v, prefix ? `${prefix}.${k}` : k));
}

const problems = [];
let checked = 0;
for (const [key, text] of flatten(en)) {
  if (!isProse(key)) continue;
  checked++;
  const grade = gradeLevel(text);
  const max = maxGradeFor(key);
  if (grade > max) problems.push(`${key}: grade ${grade.toFixed(1)} > ${max}: ${text}`);
}

// Long-form content: every paragraph and list item of the Markdown pages, grade 8 or lower.
const contentDir = path.resolve(import.meta.dirname, '../apps/web/content/legal');
for (const f of fs.readdirSync(contentDir).filter((x) => x.endsWith('.md'))) {
  const blocks = fs
    .readFileSync(path.join(contentDir, f), 'utf8')
    .split(/\n\s*\n|\n- /)
    .map((b) =>
      b
        .replace(/^#+ .*$/gm, '')
        .replace(/[*`]|\[([^\]]+)\]\([^)]+\)/g, '$1')
        .trim(),
    )
    .filter((b) => b.split(/\s+/).length >= 8);
  for (const b of blocks) {
    checked++;
    const grade = gradeLevel(b);
    if (grade > 8) problems.push(`content/legal/${f}: grade ${grade.toFixed(1)} > 8: ${b}`);
  }
}

if (problems.length) {
  console.error(`Readability check failed:\n  ${problems.join('\n  ')}`);
  process.exit(1);
}
console.log(`readability: ok (${checked} strings)`);
