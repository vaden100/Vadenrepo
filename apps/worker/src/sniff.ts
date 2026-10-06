import { fileTypeFromBuffer } from 'file-type';

export type Kind = 'image' | 'pdf' | 'audio' | 'video';

/** Magic-byte types we accept, by kind. The declared MIME type is never trusted (SPEC 11). */
const ACCEPT: Record<Kind, readonly string[]> = {
  image: ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'],
  pdf: ['application/pdf'],
  audio: [
    'audio/mpeg',
    'audio/mp4',
    'audio/x-m4a',
    'audio/aac',
    'audio/webm',
    'audio/ogg',
    'audio/wav',
    'audio/x-wav',
    'audio/vnd.wave',
    'audio/opus',
  ],
  video: ['video/mp4', 'video/quicktime', 'video/webm'],
};

/** WebM and MP4 containers hold audio or video; the sniffer can't always tell which. */
const CONTAINER_ALIASES: Record<string, Partial<Record<Kind, string>>> = {
  'video/webm': { audio: 'audio/webm' },
  'audio/webm': { video: 'video/webm' },
  'video/mp4': { audio: 'audio/mp4' },
  'audio/mp4': { video: 'video/mp4' },
  'audio/x-m4a': { video: 'video/mp4' },
  'video/x-m4v': { video: 'video/mp4' },
  'audio/ogg': {},
};

export async function sniff(data: Uint8Array, kind: Kind): Promise<string | null> {
  const found = await fileTypeFromBuffer(data);
  if (!found) return null;
  const mime = CONTAINER_ALIASES[found.mime]?.[kind] ?? found.mime;
  return ACCEPT[kind].includes(mime) ? mime : null;
}
