import { describe, expect, it } from 'vitest';
import { identifiersFromWho } from './identifiers';

describe('identifiersFromWho', () => {
  it('normalizes every field the way search will', () => {
    const rows = identifiersFromWho({
      businessName: 'Lashes by Tee LLC',
      instagram: 'https://instagram.com/Laced.By.Tee_',
      phone: '(404) 555-0123',
      website: 'https://www.LacedByTee.com/book',
      cashtag: '$Tee Laces',
      zelle: 'Tee.Laces+x@gmail.com',
      appleCash: '404.555.0199',
    });
    const by = Object.fromEntries(rows.map((r) => [r.field, [r.type, r.norm, r.norm_loose]]));
    expect(by).toEqual({
      businessName: ['name', 'lashes tee', null],
      instagram: ['handle_ig', 'laced.by.tee', 'lacedbytee'],
      phone: ['phone', '+14045550123', null],
      website: ['domain', 'lacedbytee.com', null],
      cashtag: ['cashtag', 'teelaces', null],
      zelle: ['zelle', 'teelaces@gmail.com', null],
      appleCash: ['phone', '+14045550199', null],
    });
  });
  it('skips empty fields', () => {
    expect(identifiersFromWho({ instagram: '  ', city: 'Atlanta' })).toEqual([]);
  });
});
