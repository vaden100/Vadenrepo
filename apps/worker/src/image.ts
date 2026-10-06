import sharp from 'sharp';

/** Fractions of the (upright) image: 0..1. */
export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface CleanImage {
  data: Buffer;
  mime: string;
  width: number;
  height: number;
  hadMetadata: boolean;
}

/**
 * Re-encodes the image from pixels, which drops EXIF, GPS, XMP, IPTC and maker notes
 * (SPEC 6, 11). Orientation is applied first so the picture still looks right.
 * HEIC/HEIF becomes JPEG so every browser can show it to moderators.
 */
export async function cleanImage(
  input: Uint8Array,
  mime: string,
  boxes: Box[] = [],
): Promise<CleanImage> {
  const meta = await sharp(input).metadata();
  const hadMetadata = Boolean(meta.exif || meta.xmp || meta.iptc);
  let pipeline = sharp(input, { limitInputPixels: 80_000_000 }).rotate();
  if (boxes.length) {
    // Paint the reporter's boxes solid black on the upright pixels; only this version is kept.
    const upright = await pipeline.raw().toBuffer({ resolveWithObject: true });
    const { width, height, channels } = upright.info;
    const clamp = (v: number, max: number) => Math.min(Math.max(Math.round(v), 0), max);
    const rects = boxes
      .map((b) => {
        const left = clamp(b.x * width, width - 1);
        const top = clamp(b.y * height, height - 1);
        return {
          left,
          top,
          w: clamp(b.w * width, width - left),
          h: clamp(b.h * height, height - top),
        };
      })
      .filter((r) => r.w > 0 && r.h > 0);
    pipeline = sharp(upright.data, { raw: { width, height, channels } }).composite(
      rects.map((r) => ({
        input: {
          create: {
            width: r.w,
            height: r.h,
            channels: 4 as const,
            background: { r: 0, g: 0, b: 0, alpha: 1 },
          },
        },
        left: r.left,
        top: r.top,
      })),
    );
  }
  let outMime = mime;
  if (mime === 'image/png') pipeline = pipeline.png({ compressionLevel: 9 });
  else if (mime === 'image/webp') pipeline = pipeline.webp({ quality: 90 });
  else {
    pipeline = pipeline.jpeg({ quality: 90, mozjpeg: true });
    outMime = 'image/jpeg';
  }
  const { data, info } = await pipeline.toBuffer({ resolveWithObject: true });
  return { data, mime: outMime, width: info.width, height: info.height, hadMetadata };
}
