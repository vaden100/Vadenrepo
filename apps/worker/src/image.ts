import sharp from 'sharp';

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
export async function cleanImage(input: Uint8Array, mime: string): Promise<CleanImage> {
  const meta = await sharp(input).metadata();
  const hadMetadata = Boolean(meta.exif || meta.xmp || meta.iptc);
  let pipeline = sharp(input, { limitInputPixels: 80_000_000 }).rotate();
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
