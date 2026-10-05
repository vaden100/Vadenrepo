#!/usr/bin/env node
/**
 * Copy rules (SPEC 12 + 14) for UI source: no em dashes, no emojis, and never "scammer" or
 * "fraudster" as a statement about a named party. Comment lines are skipped.
 */
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const dirs = [
  'apps/web/app',
  'apps/web/components',
  'apps/web/lib',
  'apps/mobile/app',
  'apps/mobile/components',
  'packages/ui/src',
];
const rules = [
  { name: 'em dash', re: /—/ },
  { name: 'emoji', re: /\p{Extended_Pictographic}/u },
  { name: 'accusatory word', re: /\b(scammers?|fraudsters?)\b/i },
];

function* walk(dir) {
  if (!fs.existsSync(dir)) return;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) yield* walk(p);
    else if (
      /\.(tsx?|css)$/.test(e.name) &&
      !/\.test\.tsx?$/.test(e.name) &&
      e.name !== 'generated.ts'
    )
      yield p;
  }
}

const problems = [];
for (const d of dirs) {
  for (const file of walk(path.join(root, d))) {
    fs.readFileSync(file, 'utf8')
      .split('\n')
      .forEach((line, i) => {
        if (/^\s*(\/\/|\*|\/\*)/.test(line)) return;
        for (const r of rules) {
          if (r.re.test(line))
            problems.push(`${path.relative(root, file)}:${i + 1} ${r.name}: ${line.trim()}`);
        }
      });
  }
}

if (problems.length) {
  console.error(`Copy check failed (SPEC 14):\n  ${problems.join('\n  ')}`);
  process.exit(1);
}
console.log('copy: ok');
