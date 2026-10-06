import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { PDFDocument } from 'pdf-lib';
import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
import { cleanAv } from './av.js';
import { dhash, hamming, phash, toSigned64 } from './hash.js';
import { cleanImage } from './image.js';
import { cleanPdf } from './pdf.js';
import { sniff } from './sniff.js';

async function photoWithGps() {
  const base = sharp({
    create: { width: 64, height: 48, channels: 3, background: '#d23c8c' },
  }).composite([
    {
      input: Buffer.from(
        '<svg width="64" height="48"><rect x="8" y="8" width="20" height="20" fill="#000"/></svg>',
      ),
    },
  ]);
  return base
    .withExif({
      IFD0: { Make: 'PhoneCo', Model: 'Test 12', Artist: 'Reporter Name' },
      IFD3: {
        GPSLatitudeRef: 'N',
        GPSLatitude: '33/1 45/1 0/1',
        GPSLongitudeRef: 'W',
        GPSLongitude: '84/1 23/1 0/1',
      },
    })
    .jpeg()
    .toBuffer();
}

describe('images', () => {
  it('re-encoding removes EXIF and GPS', async () => {
    const input = await photoWithGps();
    const before = await sharp(input).metadata();
    expect(before.exif).toBeDefined();
    expect(input.includes(Buffer.from('PhoneCo'))).toBe(true);

    const out = await cleanImage(input, 'image/jpeg');
    const after = await sharp(out.data).metadata();
    expect(out.hadMetadata).toBe(true);
    expect(after.exif).toBeUndefined();
    expect(after.xmp).toBeUndefined();
    expect(out.data.includes(Buffer.from('PhoneCo'))).toBe(false);
    expect(out.data.includes(Buffer.from('Reporter Name'))).toBe(false);
    expect([out.width, out.height]).toEqual([64, 48]);
  });

  it('perceptual hashes survive resizing and recompression', async () => {
    const a = await photoWithGps();
    const b = await sharp(a).resize(200).jpeg({ quality: 40 }).toBuffer();
    const other = await sharp({
      create: { width: 64, height: 48, channels: 3, background: '#000' },
    })
      .composite([
        {
          input: Buffer.from(
            '<svg width="64" height="48"><circle cx="48" cy="30" r="12" fill="#fff"/></svg>',
          ),
        },
      ])
      .png()
      .toBuffer();
    expect(hamming(await phash(a), await phash(b))).toBeLessThanOrEqual(6);
    expect(hamming(await dhash(a), await dhash(b))).toBeLessThanOrEqual(6);
    expect(hamming(await phash(a), await phash(other))).toBeGreaterThan(10);
  });

  it('hashes fit a signed Postgres bigint', () => {
    expect(toSigned64(Array(64).fill(true))).toBe('-1');
    expect(toSigned64([false, ...Array(63).fill(true)])).toBe('9223372036854775807');
  });
});

describe('magic bytes', () => {
  it('trusts content, not the declared type', async () => {
    const png = await sharp({ create: { width: 2, height: 2, channels: 3, background: '#fff' } })
      .png()
      .toBuffer();
    expect(await sniff(png, 'image')).toBe('image/png');
    expect(await sniff(png, 'pdf')).toBeNull();
    expect(await sniff(Buffer.from('<html><script>alert(1)</script></html>'), 'image')).toBeNull();
  });
});

describe('pdf', () => {
  it('drops author, creator, producer and XMP', async () => {
    const doc = await PDFDocument.create();
    doc.addPage([200, 200]);
    doc.setAuthor('Reporter Name');
    doc.setCreator('Scanner App');
    doc.setTitle('bank statement');
    const out = await cleanPdf(await doc.save({ useObjectStreams: false }));
    const text = Buffer.from(out.data).toString('latin1');
    expect(text).not.toContain('Reporter Name');
    expect(text).not.toContain('Scanner App');
    expect(out.pages).toBe(1);
  });
});

const hasFfmpeg = (() => {
  try {
    execFileSync('ffmpeg', ['-version'], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
})();

describe.skipIf(!hasFfmpeg)('audio and video', () => {
  it('strips container metadata and reports duration', async () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'rmmm-test-'));
    const file = path.join(dir, 'tagged.m4a');
    execFileSync('ffmpeg', [
      '-v',
      'error',
      '-f',
      'lavfi',
      '-i',
      'sine=frequency=440:duration=2',
      '-metadata',
      'artist=Reporter Name',
      '-metadata',
      'location=+33.7490-084.3880/',
      '-c:a',
      'aac',
      file,
    ]);
    const input = readFileSync(file);
    expect(input.includes(Buffer.from('Reporter Name'))).toBe(true);
    const out = await cleanAv(input, 'audio/mp4', 'ffmpeg', 'ffprobe');
    expect(out.data.includes(Buffer.from('Reporter Name'))).toBe(false);
    expect(out.data.includes(Buffer.from('+33.7490'))).toBe(false);
    expect(out.durationMs).toBeGreaterThan(1500);
    expect(out.durationMs).toBeLessThan(2600);
  });
});
