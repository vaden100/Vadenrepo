/**
 * Acceptance (SPEC 18, Phase 1): swapping the logo files changes the header, favicon and social
 * images with no code edits. All three read from what syncBrand() generates, so we swap in
 * fixture logos in a temp copy and check every output carries them.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { lint, syncBrand } from './lib/brand.mjs';

const repo = path.resolve(import.meta.dirname, '..');
const colors = { light: '#111111', dark: '#EEEEEE' };

function tempRepo() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ns1-brand-'));
  fs.cpSync(path.join(repo, 'brand'), path.join(dir, 'brand'), { recursive: true });
  return dir;
}

const fixture = (marker, fill = 'currentColor') =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path fill="${fill}" d="M${marker} 0h10v10H${marker}z"/></svg>\n`;

describe('logo swap', () => {
  it('flows into header data, favicon and public files', () => {
    const dir = tempRepo();
    fs.writeFileSync(path.join(dir, 'brand/logo/wordmark.svg'), fixture(11));
    fs.writeFileSync(path.join(dir, 'brand/logo/wordmark-light.svg'), fixture(12, '#FFFFFF'));
    fs.writeFileSync(path.join(dir, 'brand/logo/mark.svg'), fixture(13));
    const res = syncBrand({ root: dir, colors });
    expect(res.errors).toEqual([]);

    const generated = fs.readFileSync(path.join(dir, 'packages/ui/src/generated/brand.ts'), 'utf8');
    expect(generated).toContain('M11 0h10v10H11z'); // header <Logo> and social image read this
    expect(generated).toContain('M13 0h10v10H13z'); // touch icon reads this
    const favicon = fs.readFileSync(path.join(dir, 'apps/web/app/icon.svg'), 'utf8');
    expect(favicon).toContain('M13 0h10v10H13z');
    expect(favicon).toContain('#111111');
    const pub = fs.readFileSync(path.join(dir, 'apps/web/public/brand/logo/wordmark.svg'), 'utf8');
    expect(pub).toContain('M11 0h10v10H11z');
  });

  it('refuses a logo set with a missing file', () => {
    const dir = tempRepo();
    fs.rmSync(path.join(dir, 'brand/logo/mark.svg'));
    expect(syncBrand({ root: dir, colors }).errors).toContain('brand/logo/mark.svg is missing');
  });

  it('check mode reports stale outputs without writing', () => {
    const dir = tempRepo();
    const res = syncBrand({ root: dir, colors, check: true });
    expect(res.stale.length).toBeGreaterThan(0);
    expect(fs.existsSync(path.join(dir, 'apps/web/app/icon.svg'))).toBe(false);
  });
});

describe('SVG rules (SPEC 7.4)', () => {
  const ok =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path stroke="currentColor" d="M0 0"/></svg>';
  it('accepts a clean icon', () => expect(lint(ok, 'x.svg')).toEqual([]));
  it.each([
    ['<svg width="24" viewBox="0 0 24 24"/>', 'fixed width/height on <svg>'],
    ['<svg><path/></svg>', 'missing viewBox'],
    ['<svg viewBox="0 0 1 1"><script>x</script></svg>', 'script'],
    ['<svg viewBox="0 0 1 1"><foreignObject/></svg>', 'foreignObject'],
    ['<svg viewBox="0 0 1 1"><image href="a.png"/></svg>', 'embedded image'],
    ['<svg viewBox="0 0 1 1"><use href="http://x/y.svg#a"/></svg>', 'external reference'],
    ['<svg viewBox="0 0 1 1"><animate/></svg>', 'SMIL animation'],
    ['<svg viewBox="0 0 1 1"><path fill="#ff0000"/></svg>', 'hard-coded color #ff0000'],
  ])('rejects %s', (src, problem) => expect(lint(src, 'x.svg')).toContain(problem));
  it('lets only the -light logo pin white', () => {
    const white = '<svg viewBox="0 0 1 1"><path fill="#FFFFFF"/></svg>';
    expect(lint(white, 'wordmark-light.svg')).toEqual([]);
    expect(lint(white, 'wordmark.svg')).toContain('hard-coded color #ffffff');
  });
});
