import { execFile } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';

const run = promisify(execFile);

const EXT: Record<string, string> = {
  'audio/mpeg': 'mp3',
  'audio/mp4': 'm4a',
  'audio/x-m4a': 'm4a',
  'audio/aac': 'aac',
  'audio/webm': 'webm',
  'audio/ogg': 'ogg',
  'audio/opus': 'ogg',
  'audio/wav': 'wav',
  'audio/x-wav': 'wav',
  'audio/vnd.wave': 'wav',
  'video/mp4': 'mp4',
  'video/quicktime': 'mov',
  'video/webm': 'webm',
};

export interface CleanAv {
  data: Buffer;
  durationMs: number | null;
  width: number | null;
  height: number | null;
}

/**
 * Strips container metadata (GPS in phone videos, device, creation time) and drops data
 * and subtitle streams, without re-encoding (SPEC 6). Uses ffprobe for duration and size.
 */
export async function cleanAv(
  input: Uint8Array,
  mime: string,
  ffmpeg: string,
  ffprobe: string,
): Promise<CleanAv> {
  const ext = EXT[mime] ?? 'bin';
  const dir = await mkdtemp(path.join(tmpdir(), 'rmmm-av-'));
  const src = path.join(dir, `in.${ext}`);
  const out = path.join(dir, `out.${ext}`);
  try {
    await writeFile(src, input);
    const probe = await run(
      ffprobe,
      ['-v', 'error', '-print_format', 'json', '-show_format', '-show_streams', src],
      { timeout: 60_000, maxBuffer: 4 * 1024 * 1024 },
    );
    const info = JSON.parse(probe.stdout) as {
      format?: { duration?: string };
      streams?: { codec_type?: string; width?: number; height?: number; duration?: string }[];
    };
    const video = info.streams?.find((s) => s.codec_type === 'video');
    const seconds = Number(
      info.format?.duration ?? info.streams?.find((s) => s.duration)?.duration,
    );
    await run(
      ffmpeg,
      [
        '-v',
        'error',
        '-y',
        '-i',
        src,
        '-map',
        '0:v?',
        '-map',
        '0:a?',
        '-map_metadata',
        '-1',
        '-map_chapters',
        '-1',
        '-c',
        'copy',
        ...(ext === 'mp4' || ext === 'm4a' || ext === 'mov' ? ['-movflags', '+faststart'] : []),
        out,
      ],
      { timeout: 180_000 },
    );
    return {
      data: await readFile(out),
      durationMs: Number.isFinite(seconds) ? Math.round(seconds * 1000) : null,
      width: video?.width ?? null,
      height: video?.height ?? null,
    };
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

/** Duration only (used for WebM from MediaRecorder, which often has no duration header). */
export async function decodeDurationMs(
  input: Uint8Array,
  mime: string,
  ffmpeg: string,
): Promise<number | null> {
  const dir = await mkdtemp(path.join(tmpdir(), 'rmmm-dur-'));
  const src = path.join(dir, `in.${EXT[mime] ?? 'bin'}`);
  try {
    await writeFile(src, input);
    const { stderr } = await run(ffmpeg, ['-v', 'info', '-i', src, '-f', 'null', '-'], {
      timeout: 120_000,
      maxBuffer: 16 * 1024 * 1024,
    });
    const times = [...stderr.matchAll(/time=(\d+):(\d+):(\d+(?:\.\d+)?)/g)];
    const last = times.at(-1);
    if (!last) return null;
    return Math.round((Number(last[1]) * 3600 + Number(last[2]) * 60 + Number(last[3])) * 1000);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}
