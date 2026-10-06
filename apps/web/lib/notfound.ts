import { paletteDestinations, type NavItem } from './site';

function distance(a: string, b: string): number {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [
    i,
    ...Array<number>(b.length).fill(0),
  ]);
  for (let j = 1; j <= b.length; j++) dp[0]![j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      dp[i]![j] = Math.min(
        dp[i - 1]![j]! + 1,
        dp[i]![j - 1]! + 1,
        dp[i - 1]![j - 1]! + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
  return dp[a.length]![b.length]!;
}

function safeDecode(s: string): string {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}

export interface PathPart {
  label: string;
  href: string;
  exists: boolean;
}

/** Breaks a missing URL into its segments and marks the ones that lead somewhere real. */
export function explainPath(
  pathname: string,
  known = paletteDestinations,
): { parts: PathPart[]; suggestions: NavItem[] } {
  const clean = pathname.split(/[?#]/)[0]!.replace(/\/+$/, '') || '/';
  const segs = clean.split('/').filter(Boolean).slice(0, 6);
  const hrefs = new Set(known.map((k) => k.href));
  const parts = segs.map((s, i) => {
    const href = `/${segs.slice(0, i + 1).join('/')}`;
    return { label: safeDecode(s).slice(0, 60), href, exists: hrefs.has(href) };
  });
  const suggestions = known
    .filter((k) => k.href !== '/')
    .map((k) => ({ k, d: distance(clean.toLowerCase(), k.href) }))
    .filter((x) => x.d <= Math.max(3, Math.floor(x.k.href.length / 3)))
    .sort((a, b) => a.d - b.d)
    .slice(0, 3)
    .map((x) => x.k);
  return { parts, suggestions };
}
