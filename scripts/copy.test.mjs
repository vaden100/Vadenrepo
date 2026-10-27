import { describe, expect, it } from 'vitest';
import { copyProblems, gradeLevel, isProse, maxGradeFor, syllables } from './lib/copy.mjs';

describe('copy rules', () => {
  it('flags em dashes, emojis and symbols', () => {
    expect(copyProblems('x', 'a — b')).toContain('em dash');
    expect(copyProblems('x', 'hi \u{1F600}')).toContain('emoji or symbol');
    expect(copyProblems('x', '© 2026')).toContain('emoji or symbol');
    expect(copyProblems('x', 'Next ↗')).toContain('emoji or symbol');
  });
  it('flags banned phrases but not similar words', () => {
    expect(copyProblems('x', 'We empower the less fortunate')).toHaveLength(2);
    expect(copyProblems('x', 'Save my spot')).toEqual([]);
    expect(copyProblems('x', 'Save settings')).toEqual([]);
  });
  it('flags "!" only in headings and buttons', () => {
    expect(copyProblems('home.heading', 'Hello!')).toHaveLength(1);
    expect(copyProblems('sample.actions.primary', 'Go!')).toHaveLength(1);
    expect(copyProblems('home.prose', 'See you there!')).toEqual([]);
  });
});

describe('readability', () => {
  it('counts syllables roughly', () => {
    expect(syllables('cat')).toBe(1);
    expect(syllables('conversation')).toBe(4);
  });
  it('scores simple text low and dense text high', () => {
    expect(gradeLevel('We meet twice a month. Come and talk.')).toBeLessThan(4);
    expect(
      gradeLevel(
        'Organizational accountability necessitates comprehensive institutional documentation of programmatic expenditures.',
      ),
    ).toBeGreaterThan(14);
  });
  it('treats S.A.F.E as one short word', () => {
    expect(gradeLevel('S.A.F.E Sessions are here.')).toBeLessThan(6);
  });
  it('sets limits and picks prose keys', () => {
    expect(maxGradeFor('help.intro.prose')).toBe(6);
    expect(maxGradeFor('home.prose')).toBe(8);
    expect(isProse('home.prose')).toBe(true);
    expect(isProse('reading.textSize')).toBe(false);
  });
});
