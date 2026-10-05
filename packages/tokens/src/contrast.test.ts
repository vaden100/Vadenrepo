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
    ['paper on status-resolved', colors.paper, colors.statusResolved, AA_NORMAL],
    ['paper on status-closed', colors.paper, colors.statusClosed, AA_NORMAL],
    ['ink on status-verifying', colors.ink, colors.statusVerifying, AA_NORMAL],
    // mute on ink is approved for >= 16px only (SPEC 13); hold it to the large-text bar.
    ['mute on ink (>= 16px only)', colors.mute, colors.ink, AA_LARGE],
    ['light theme muted text', themes.light.textMuted, themes.light.background, AA_NORMAL],
    ['light theme text on surface', themes.light.text, themes.light.surface, AA_NORMAL],
  ])('%s', (_label, fg, bg, min) => {
    expect(contrastRatio(fg, bg)).toBeGreaterThanOrEqual(min);
  });

  it('caution focus ring is visible on ink (non-text 3:1)', () => {
    expect(contrastRatio(colors.caution, colors.ink)).toBeGreaterThanOrEqual(AA_LARGE);
  });
});
