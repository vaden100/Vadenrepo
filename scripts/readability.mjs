#!/usr/bin/env node
/** Reading level (SPEC 6.1): grade 8 or lower for public prose, grade 6 for Get help. */
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

if (problems.length) {
  console.error(`Readability check failed:\n  ${problems.join('\n  ')}`);
  process.exit(1);
}
console.log(`readability: ok (${checked} strings)`);
