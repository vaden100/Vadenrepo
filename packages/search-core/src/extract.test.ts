import { describe, expect, it } from 'vitest';
import { extractIdentifiers } from './extract';

describe('extractIdentifiers (flyer OCR, SPEC 8.3)', () => {
  const flyer = `BOOKS OPEN!!! Lashes by Tee
  $50 deposit to $TeeLaces (non refundable)
  DM @laced.by.tee_ or text (404) 555-0123
  Zelle tee.laces@gmail.com  www.lacedbytee.com/book   Full set $1,250.00`;

  it('finds every identifier and amount', () => {
    const r = extractIdentifiers(flyer);
    expect(r.cashtags).toEqual(['teelaces']);
    expect(r.handles).toEqual([{ norm: 'laced.by.tee', loose: 'lacedbytee' }]);
    expect(r.phones).toEqual(['+14045550123']);
    expect(r.emails).toEqual(['teelaces@gmail.com']);
    expect(r.domains).toEqual(['lacedbytee.com']);
    expect(r.amounts).toEqual([5000, 125000]);
  });

  it('does not treat amounts as cashtags or emails as handles', () => {
    const r = extractIdentifiers('Pay $75 now, email me at book@nailz.com');
    expect(r.cashtags).toEqual([]);
    expect(r.handles).toEqual([]);
    expect(r.amounts).toEqual([7500]);
  });

  it('de-duplicates and survives junk', () => {
    const r = extractIdentifiers('$Tee $tee @a @a ' + '!'.repeat(100));
    expect(r.cashtags).toEqual(['tee']);
    expect(extractIdentifiers('')).toEqual({
      cashtags: [],
      handles: [],
      phones: [],
      emails: [],
      domains: [],
      amounts: [],
    });
  });
});
