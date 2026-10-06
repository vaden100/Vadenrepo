import { createHash } from 'node:crypto';
import sharp from 'sharp';

export const sha256 = (data: Uint8Array) => createHash('sha256').update(data).digest('hex');

/** 64 bits -> signed bigint string (Postgres bigint), so hashes compare with bit ops. */
export function toSigned64(bits: boolean[]): string {
  let v = 0n;
  for (const b of bits) v = (v << 1n) | (b ? 1n : 0n);
  return BigInt.asIntN(64, v).toString();
}

export function hamming(a: string, b: string): number {
  let x = BigInt.asUintN(64, BigInt(a) ^ BigInt(b));
  let n = 0;
  while (x) {
    n += Number(x & 1n);
    x >>= 1n;
  }
  return n;
}

/** dHash: 9x8 grayscale, compare horizontal neighbours. */
export async function dhash(img: Uint8Array): Promise<string> {
  const px = await sharp(img).rotate().greyscale().resize(9, 8, { fit: 'fill' }).raw().toBuffer();
  const bits: boolean[] = [];
  for (let y = 0; y < 8; y++)
    for (let x = 0; x < 8; x++) bits.push(px[y * 9 + x]! > px[y * 9 + x + 1]!);
  return toSigned64(bits);
}

/** pHash: 32x32 grayscale, 2D DCT, top-left 8x8 (minus DC) against its median. */
export async function phash(img: Uint8Array): Promise<string> {
  const N = 32;
  const px = await sharp(img).rotate().greyscale().resize(N, N, { fit: 'fill' }).raw().toBuffer();
  const cos: number[][] = [];
  for (let k = 0; k < 8; k++) {
    cos[k] = [];
    for (let n = 0; n < N; n++) cos[k]![n] = Math.cos(((2 * n + 1) * k * Math.PI) / (2 * N));
  }
  const coeff: number[] = [];
  for (let u = 0; u < 8; u++) {
    for (let v = 0; v < 8; v++) {
      let s = 0;
      for (let y = 0; y < N; y++)
        for (let x = 0; x < N; x++) s += px[y * N + x]! * cos[u]![y]! * cos[v]![x]!;
      coeff.push(s);
    }
  }
  const ac = coeff.slice(1);
  const median = [...ac].sort((a, b) => a - b)[Math.floor(ac.length / 2)]!;
  return toSigned64(coeff.map((c) => c > median));
}
