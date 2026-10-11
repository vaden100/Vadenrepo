import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
import { dhash, hamming, phash, toSigned64 } from './index';

describe('media hashes', () => {
  it('are stable and tolerate recompression', async () => {
    // A flyer-like image: blocks of text and a price, re-shared smaller and recompressed.
    const svg = `<svg width="640" height="800"><rect width="640" height="800" fill="#f5c518"/>
      <rect x="40" y="40" width="560" height="160" fill="#111"/><circle cx="480" cy="520" r="120" fill="#c8202b"/>
      <text x="60" y="140" font-size="72" fill="#fff">BOOK NOW</text><text x="60" y="420" font-size="64">$50 DEPOSIT</text></svg>`;
    const img = await sharp(Buffer.from(svg)).png().toBuffer();
    const smaller = await sharp(img).resize(320).jpeg({ quality: 60 }).toBuffer();
    expect(await phash(img)).toBe(await phash(img));
    expect(hamming(await phash(img), await phash(smaller))).toBeLessThanOrEqual(6);
    expect(hamming(await dhash(img), await dhash(smaller))).toBeLessThanOrEqual(6);
  });
  it('fit a signed bigint', () => expect(toSigned64(Array(64).fill(true))).toBe('-1'));
});
