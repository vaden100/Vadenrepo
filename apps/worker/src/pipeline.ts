import { extractIdentifiers } from '@rmmm/search-core';
import { cleanAv, decodeDurationMs } from './av.js';
import { scan } from './clamav.js';
import type { WorkerConfig } from './config.js';
import type { Db } from './db.js';
import { dhash, phash, sha256 } from './hash.js';
import { cleanImage, type Box } from './image.js';
import { log } from './log.js';
import { cleanPdf } from './pdf.js';
import { sniff, type Kind } from './sniff.js';
import type { Storage } from './storage.js';
import { ocr, transcribe } from './text.js';

export interface MediaJob {
  id: string;
  report_id: string;
  kind: Kind;
  storage_path: string;
  mime: string | null;
  bytes: number | null;
  duration_ms: number | null;
  voice_note: boolean;
  redact_boxes: Box[] | null;
  attempts: number;
}

/** Same limits as @rmmm/api MEDIA_RULES (SPEC 11). */
const MAX_BYTES: Record<Kind, number> = {
  image: 15 * 1024 * 1024,
  pdf: 15 * 1024 * 1024,
  audio: 20 * 1024 * 1024,
  video: 200 * 1024 * 1024,
};
const MAX_SECONDS = 60; // videos and voice notes

class Rejected extends Error {
  constructor(public reason: string) {
    super(reason);
  }
}

export interface Deps {
  config: WorkerConfig;
  db: Db;
  storage: Storage;
}

/**
 * One file through the pipeline (SPEC 6): magic bytes, size, virus scan, metadata strip
 * (the cleaned file replaces the original, so the raw upload is not kept), hashes,
 * duplicate check, OCR/transcript + identifier extraction. Then the report may move to
 * triage.
 */
export async function processJob(
  job: MediaJob,
  { config, db, storage }: Deps,
): Promise<'ready' | 'rejected' | 'failed' | 'retry'> {
  const started = Date.now();
  try {
    const raw = await storage.get(job.storage_path);
    if (raw.length > MAX_BYTES[job.kind]) throw new Rejected('too_large');
    const mime = await sniff(raw, job.kind);
    if (!mime) throw new Rejected('type_mismatch');

    const scanStatus = await scan(raw, config.clamav);
    if (scanStatus === 'infected') throw new Rejected('infected');
    if (scanStatus === 'error') throw new Error('virus scan failed');

    const patch: Record<string, unknown> = { mime, scan_status: scanStatus };
    const extracted: Record<string, unknown> = {};
    let cleaned: Uint8Array;
    let outMime = mime;

    if (job.kind === 'image') {
      const img = await cleanImage(raw, mime, job.redact_boxes ?? []);
      cleaned = img.data;
      outMime = img.mime;
      Object.assign(patch, {
        width: img.width,
        height: img.height,
        phash: await phash(cleaned),
        dhash: await dhash(cleaned),
      });
      extracted.hadMetadata = img.hadMetadata;
      if (config.ocr) {
        const text = await ocr(cleaned).catch((e: unknown) => {
          log('warn', 'media.ocr_failed', { media: job.id, err: String(e) });
          return null;
        });
        patch.ocr_text = text;
        if (text) extracted.identifiers = extractIdentifiers(text);
      }
    } else if (job.kind === 'pdf') {
      const pdf = await cleanPdf(raw).catch(() => {
        throw new Rejected('unreadable');
      });
      cleaned = pdf.data;
      extracted.pages = pdf.pages;
    } else {
      const av = await cleanAv(raw, mime, config.ffmpeg, config.ffprobe).catch(() => {
        throw new Rejected('unreadable');
      });
      cleaned = av.data;
      const durationMs = av.durationMs ?? (await decodeDurationMs(cleaned, mime, config.ffmpeg));
      if (
        (job.kind === 'video' || job.voice_note) &&
        durationMs !== null &&
        durationMs > (MAX_SECONDS + 1) * 1000
      ) {
        throw new Rejected('too_long');
      }
      Object.assign(patch, { duration_ms: durationMs, width: av.width, height: av.height });
      if (job.kind === 'audio' && config.transcribe) {
        const text = await transcribe(cleaned, mime, config.transcribe).catch((e: unknown) => {
          log('warn', 'media.transcribe_failed', { media: job.id, err: String(e) });
          return null;
        });
        patch.transcript = text;
        if (text) extracted.identifiers = extractIdentifiers(text);
      }
    }

    const digest = sha256(cleaned);
    // Same file already sent with another report: a signal for moderators (SPEC 10.1).
    const dupes = await db.select<{ report_id: string }>(
      'media',
      `sha256=eq.${digest}&report_id=neq.${job.report_id}&select=report_id&limit=5`,
    );
    if (dupes.length) extracted.duplicateOf = [...new Set(dupes.map((d) => d.report_id))];

    await storage.put(job.storage_path, cleaned, outMime);
    await db.update('media', `id=eq.${job.id}`, {
      ...patch,
      mime: outMime,
      bytes: cleaned.byteLength,
      sha256: digest,
      exif_stripped: true,
      extracted,
      upload_status: 'ready',
      processed_at: new Date().toISOString(),
    });
    await db.rpc('advance_report_after_processing', { report: job.report_id });
    log('info', 'media.ready', { media: job.id, kind: job.kind, ms: Date.now() - started });
    return 'ready';
  } catch (err) {
    if (err instanceof Rejected) {
      await storage.remove(job.storage_path).catch(() => undefined);
      await db.update('media', `id=eq.${job.id}`, {
        upload_status: 'rejected',
        reject_reason: err.reason,
        scan_status: err.reason === 'infected' ? 'infected' : undefined,
        processed_at: new Date().toISOString(),
      });
      await db.rpc('advance_report_after_processing', { report: job.report_id });
      log('warn', 'media.rejected', { media: job.id, reason: err.reason });
      return 'rejected';
    }
    log('error', 'media.failed', {
      media: job.id,
      attempt: job.attempts,
      err: err instanceof Error ? err.message : String(err),
    });
    if (job.attempts >= 3) {
      await db.update('media', `id=eq.${job.id}`, {
        upload_status: 'failed',
        reject_reason: 'processing_error',
        processed_at: new Date().toISOString(),
      });
      await db.rpc('advance_report_after_processing', { report: job.report_id });
      return 'failed';
    }
    return 'retry'; // claim_media_jobs picks it up again after 10 minutes
  }
}
