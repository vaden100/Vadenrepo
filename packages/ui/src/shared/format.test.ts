import { describe, expect, it } from 'vitest';
import { evidenceFacts, FACT_SEPARATOR, formatMoney, timeAgo } from './format';
import { en } from './strings.en';
import { STAMP_KINDS, stampMeta } from './status';
import { CASE_STATUSES } from '@rmmm/api';

const now = new Date('2026-10-05T12:00:00Z');
const daysAgo = (n: number) => new Date(now.getTime() - n * 86_400_000);

describe('evidence summary copy (SPEC 4.2)', () => {
  it('matches the spec example', () => {
    const line = evidenceFacts(
      {
        reportCount: 6,
        reviewedCount: 4,
        amountLostCents: 124_000,
        lastReportAt: daysAgo(3),
        linkedPageCount: 2,
      },
      now,
    ).join(FACT_SEPARATOR);
    expect(line).toBe(
      'Reported 6 times · 4 reviewed · $1,240 reported lost · Last report 3 days ago · Linked pages: 2',
    );
  });

  it('singular and empty cases', () => {
    const facts = evidenceFacts(
      { reportCount: 1, reviewedCount: 0, amountLostCents: 0, lastReportAt: now, linkedPageCount: 0 },
      now,
    );
    expect(facts).toEqual(['Reported 1 time', '0 reviewed', 'Last report today']);
  });
});

describe('formatting', () => {
  it('money', () => {
    expect(formatMoney(5000)).toBe('$50');
    expect(formatMoney(5050)).toBe('$50.50');
  });
  it('timeAgo', () => {
    expect(timeAgo(daysAgo(1), now)).toBe('yesterday');
    expect(timeAgo(daysAgo(20), now)).toBe('2 weeks ago');
    expect(timeAgo(daysAgo(400), now)).toBe('1 year ago');
  });
});

describe('stamps', () => {
  it('cover every case status', () => {
    for (const s of CASE_STATUSES) expect(STAMP_KINDS).toContain(s);
  });
  it('have labels', () => {
    for (const k of STAMP_KINDS) expect(stampMeta[k].label.length).toBeGreaterThan(0);
  });
});

describe('copy rules (SPEC 14)', () => {
  const all: string[] = [];
  const walk = (v: unknown) => {
    if (typeof v === 'string') all.push(v);
    else if (typeof v === 'function') all.push(String(v(2, '$1')));
    else if (v && typeof v === 'object') Object.values(v).forEach(walk);
  };
  walk(en);
  it.each(all)('"%s" has no em dash, emoji, or accusatory words', (s) => {
    expect(s).not.toMatch(/—/);
    expect(s).not.toMatch(/\p{Extended_Pictographic}/u);
    expect(s.toLowerCase()).not.toMatch(/\bscammer|\bfraudster/);
  });
});
