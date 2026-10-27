import { describe, expect, it } from 'vitest';
import { icons, logos, seatPositions, shapes } from './index';

describe('brand assets', () => {
  it('has the logo set (SPEC 6.6)', () => {
    expect(Object.keys(logos).sort()).toEqual(['mark', 'wordmark', 'wordmark-light']);
  });
  it('has the SPEC 7.3 icons', () => {
    for (const n of ['menu', 'close', 'search', 'heart', 'hand', 'people', 'exit', 'language'])
      expect(icons).toHaveProperty(n);
  });
  it('icons sit on the 24px grid', () => {
    for (const [n, i] of Object.entries(icons)) expect(i.viewBox, n).toBe('0 0 24 24');
  });
  it('has the four primitives', () => {
    expect(Object.keys(shapes).sort()).toEqual(['bubble', 'marker-line', 'roundtable', 'star']);
  });
});

describe('seatPositions', () => {
  it('is deterministic and starts at the top', () => {
    const a = seatPositions(15);
    expect(a).toHaveLength(15);
    expect(a[0]).toEqual({ cx: 60, cy: 14 });
    expect(seatPositions(15)).toEqual(a);
  });
  it('handles bad input', () => {
    expect(seatPositions(-3)).toEqual([]);
    expect(seatPositions(2.9)).toHaveLength(2);
  });
});
