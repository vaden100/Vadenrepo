import { describe, expect, it } from 'vitest';
import { explainPath } from './notfound';

describe('explainPath', () => {
  it('keeps the parts that exist and suggests the closest page', () => {
    const r = explainPath('/resources/paymnt-disputes');
    expect(r.parts.map((p) => [p.label, p.exists])).toEqual([
      ['resources', true],
      ['paymnt-disputes', false],
    ]);
    expect(r.suggestions[0]?.href).toBe('/resources/payment-disputes');
  });
  it('handles junk safely', () => {
    expect(explainPath('/%E0%A4%A').parts.length).toBe(1);
    expect(explainPath('/').parts).toEqual([]);
  });
});
