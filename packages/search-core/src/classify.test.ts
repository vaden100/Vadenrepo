import { describe, expect, it } from 'vitest';
import { classify } from './classify';
import { looseHandle, normalizeName } from './normalize';

// One block per SPEC 8.1 row.
describe('cashtag: $ + letters -> lowercase, strip $ and spaces', () => {
  it.each([
    ['$TeeLaces', 'teelaces'],
    ['$Tee Laces', 'teelaces'],
    ['  $teelaces ', 'teelaces'],
  ])('%j', (input, norm) => expect(classify(input)).toMatchObject({ kind: 'cashtag', norm }));
});

describe('handle: @handle or IG/TikTok/FB/X URL', () => {
  it.each([
    ['@Nailz2', 'nailz2', 'nailz', undefined],
    ['@laced.by.tee_', 'laced.by.tee', 'lacedbytee', undefined],
    ['https://www.instagram.com/laced.by.tee_/', 'laced.by.tee', 'lacedbytee', 'ig'],
    ['instagram.com/Nailz2?igsh=abc', 'nailz2', 'nailz', 'ig'],
    ['https://www.tiktok.com/@kashkings', 'kashkings', 'kashkings', 'tiktok'],
    ['https://x.com/SomePage', 'somepage', 'somepage', 'x'],
    ['https://m.facebook.com/nailz.atl', 'nailz.atl', 'nailzatl', 'fb'],
  ])('%j', (input, norm, normLoose, platform) =>
    expect(classify(input)).toMatchObject({ kind: 'handle', norm, normLoose, platform }),
  );

  it('SPEC examples for norm_loose', () => {
    expect(looseHandle('nailz2')).toBe('nailz');
    expect(looseHandle('laced.by.tee')).toBe('lacedbytee');
  });

  it('a post URL is not a profile handle', () => {
    expect(classify('https://www.instagram.com/p/Cx123/')?.kind).toBe('domain');
  });
});

describe('phone: 10+ digits -> E.164 (default US)', () => {
  // Phase 4 acceptance: "phone in 4 formats resolves to one entity".
  it.each(['(404) 555-0123', '404-555-0123', '404.555.0123', '+1 404 555 0123', '14045550123'])(
    '%j',
    (input) => expect(classify(input)).toMatchObject({ kind: 'phone', norm: '+14045550123' }),
  );
  it('international with +', () =>
    expect(classify('+44 20 7946 0958')).toMatchObject({ kind: 'phone', norm: '+442079460958' }));
  it('too short is not a phone', () => expect(classify('555-0123')?.kind).toBe('name'));
});

describe('email: contains @ and a dot -> lowercase, Gmail dots and +tags removed', () => {
  it.each([
    ['Tee.Laces+deposits@Gmail.com', 'teelaces@gmail.com'],
    ['t.e.e@googlemail.com', 'tee@gmail.com'],
    ['Book.Me+x@Yahoo.com', 'book.me+x@yahoo.com'],
  ])('%j', (input, norm) => expect(classify(input)).toMatchObject({ kind: 'email', norm }));
});

describe('domain: URL/domain -> registrable domain, lowercase, no www', () => {
  it.each([
    ['https://www.NailzByTee.com/book?x=1', 'nailzbytee.com'],
    ['shop.nailz.co.uk', 'nailz.co.uk'],
    ['nailz.square.site', 'nailz.square.site'],
    ['http://linktr.ee/nailz', 'linktr.ee'],
  ])('%j', (input, norm) => expect(classify(input)).toMatchObject({ kind: 'domain', norm }));
});

describe('name: anything else -> unaccent, lowercase, collapse spaces, strip filler/emoji/punctuation', () => {
  it.each([
    ['Nailz Studio LLC', 'nailz'],
    ['Café  Lashes, Inc.', 'cafe lashes'],
    ['Laced by Tee 💅✨', 'laced tee'],
    ['Kash Kings FX!!!', 'kash kings fx'],
  ])('%j', (input, norm) => expect(classify(input)).toMatchObject({ kind: 'name', norm }));
  it('stays stable', () => expect(normalizeName(normalizeName('Nailz Studio LLC'))).toBe('nailz'));
});

describe('edge cases', () => {
  it.each(['', '   ', '!!!', '💅'])('%j -> null', (input) => expect(classify(input)).toBeNull());
  it('a bare $ amount is not a cashtag', () => expect(classify('$50')?.kind).not.toBe('cashtag'));
});
