'use client';

import { kindForMime, MEDIA_RULES, type MediaView } from '@rmmm/api';
import { requestJson } from '@/components/forms/submit';

export interface SignedUpload {
  url: string;
  method: 'PUT';
  headers: Record<string, string>;
}

/** Browsers report some types loosely; fall back to the file extension. */
export function mimeOf(file: File): string {
  if (file.type) return file.type === 'audio/x-m4a' ? 'audio/mp4' : file.type;
  const ext = file.name.split('.').pop()?.toLowerCase();
  const byExt: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
    heic: 'image/heic',
    heif: 'image/heif',
    pdf: 'application/pdf',
    mp3: 'audio/mpeg',
    m4a: 'audio/mp4',
    wav: 'audio/wav',
    mp4: 'video/mp4',
    mov: 'video/quicktime',
    webm: 'video/webm',
  };
  return (ext && byExt[ext]) || 'application/octet-stream';
}

export function checkFile(file: File): 'type' | 'size' | null {
  const kind = kindForMime(mimeOf(file));
  if (!kind) return 'type';
  return file.size > MEDIA_RULES[kind].maxBytes ? 'size' : null;
}

/**
 * Removes EXIF/GPS on the device by redrawing the pixels (SPEC 4.1 step 4). Only for types
 * the browser can decode; everything is cleaned again on the server regardless.
 */
export async function stripOnDevice(file: Blob, mime: string): Promise<Blob> {
  if (
    !['image/jpeg', 'image/png', 'image/webp'].includes(mime) ||
    typeof createImageBitmap !== 'function'
  )
    return file;
  try {
    const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' });
    const canvas = document.createElement('canvas');
    canvas.width = bmp.width;
    canvas.height = bmp.height;
    canvas.getContext('2d')!.drawImage(bmp, 0, 0);
    bmp.close();
    const out = await new Promise<Blob | null>((r) =>
      canvas.toBlob(r, mime === 'image/png' ? 'image/png' : 'image/jpeg', 0.92),
    );
    return out ?? file;
  } catch {
    return file;
  }
}

/** PUT with progress (fetch has no upload progress). */
function put(
  upload: SignedUpload,
  body: Blob,
  onProgress: (pct: number) => void,
): Promise<boolean> {
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    xhr.open(upload.method, upload.url);
    for (const [k, v] of Object.entries(upload.headers)) xhr.setRequestHeader(k, v);
    xhr.upload.onprogress = (e) =>
      e.lengthComputable && onProgress(Math.round((e.loaded / e.total) * 100));
    xhr.onload = () => resolve(xhr.status >= 200 && xhr.status < 300);
    xhr.onerror = () => resolve(false);
    xhr.ontimeout = () => resolve(false);
    xhr.timeout = 10 * 60_000;
    xhr.send(body);
  });
}

export type UploadOutcome = { ok: true; media: MediaView } | { ok: false; message: string };

/** Reserve a slot, upload straight to storage, then confirm. */
export async function uploadEvidence(
  reportId: string,
  body: Blob,
  mime: string,
  opts: { voiceNote?: boolean; redacted?: boolean; durationSeconds?: number },
  onProgress: (pct: number) => void,
): Promise<UploadOutcome> {
  const slot = await requestJson<{ media: MediaView; upload: SignedUpload }>(
    'POST',
    `/api/reports/${reportId}/media`,
    {
      mime,
      bytes: body.size,
      ...opts,
    },
  );
  if (!slot.ok) return { ok: false, message: slot.message };
  onProgress(0);
  const sent = await put(slot.data.upload, body, onProgress);
  if (!sent) {
    await requestJson('DELETE', `/api/reports/${reportId}/media/${slot.data.media.id}`);
    return { ok: false, message: '' };
  }
  const done = await requestJson<{ media: MediaView }>(
    'POST',
    `/api/reports/${reportId}/media/${slot.data.media.id}/complete`,
    {},
  );
  if (!done.ok) return { ok: false, message: done.message };
  return { ok: true, media: done.data.media };
}
