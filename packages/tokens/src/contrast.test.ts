import { describe, expect, it } from 'vitest';
import { colors, themes } from './colors';
import { contrastRatio } from './contrast';

const AA_NORMAL = 4.5;
const AA_LARGE = 3; // >= 18.66px bold or >= 24px regular, and non-text UI

describe('WCAG AA text pairs (SPEC 13)', () => {
  it.each([
    ['paper on ink', colors.paper, colors.ink, AA_NORMAL],
    ['paper on graphite', colors.paper, colors.graphite, AA_NORMAL],
    ['paper-ink on paper', colors.paperInk, colors.paper, AA_NORMAL],
    ['paper-ink on manila', colors.paperInk, colors.manila, AA_NORMAL],
    ['ink on caution', colors.ink, colors.caution, AA_NORMAL],
    ['paper on stamp-red', colors.paper, colors.stampRed, AA_NORMAL],
    ['paper on status-contacted', colors.paper, colors.statusContacted, AA_NORMAL],
    ['paper on status-resolved-text', colors.paper, colors.statusResolvedText, AA_NORMAL],
    ['paper on status-closed', colors.paper, colors.statusClosed, AA_NORMAL],
    ['ink on status-verifying', colors.ink, colors.statusVerifying, AA_NORMAL],
    // mute on ink is approved for >= 16px only (SPEC 13); hold it to the large-text bar.
    ['mute on ink (>= 16px only)', colors.mute, colors.ink, AA_LARGE],
    ['light theme muted text', themes.light.textMuted, themes.light.background, AA_NORMAL],
    ['light theme text on surface', themes.light.text, themes.light.surface, AA_NORMAL],
    ...(['dark', 'light'] as const).flatMap((t) =>
      (
        [
          'danger',
          'success',
          'warning',
          'info',
          'textSecondary',
          'textMuted',
          'text',
          'link',
        ] as const
      ).flatMap((role) =>
        (['background', 'surface', 'surfaceElevated'] as const).map(
          (bg) =>
            [
              `${t} ${role} on ${bg}`,
              themes[t][role],
              themes[t][bg],
              role === 'textMuted' && t === 'dark' ? AA_LARGE : AA_NORMAL,
            ] as const,
        ),
      ),
    ),
    ['paper-ink on light sheet', colors.paperInk, themes.light.sheet, AA_NORMAL],
    ['paper on accent-pressed', colors.paper, themes.dark.primaryPressed, AA_NORMAL],
    ['dark danger text on ink', themes.dark.danger, themes.dark.background, AA_NORMAL],
    ['dark danger text on graphite', themes.dark.danger, themes.dark.surface, AA_NORMAL],
    ['light danger text on paper', themes.light.danger, themes.light.background, AA_NORMAL],
  ] as [string, string, string, number][])('%s', (_label, fg, bg, min) => {
    expect(contrastRatio(fg, bg)).toBeGreaterThanOrEqual(min);
  });

  it('spec status-resolved is below AA with paper text (why statusResolvedText exists)', () => {
    expect(contrastRatio(colors.paper, colors.statusResolved)).toBeLessThan(AA_NORMAL);
    expect(contrastRatio(colors.statusResolved, colors.ink)).toBeGreaterThanOrEqual(AA_LARGE);
  });

  it('caution focus ring is visible on ink (non-text 3:1)', () => {
    expect(contrastRatio(colors.caution, colors.ink)).toBeGreaterThanOrEqual(AA_LARGE);
  });
});
