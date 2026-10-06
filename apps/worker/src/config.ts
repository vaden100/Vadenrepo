import { tmpdir } from 'node:os';
import { join } from 'node:path';

/** Worker env. The service-role key lives ONLY here and in server functions (SPEC 11). */
export interface WorkerConfig {
  port: number;
  supabaseUrl: string | undefined;
  hasServiceRole: boolean;
  storageDriver: 'supabase' | 'local';
  storageLocalDir: string;
  pollMs: number;
  batch: number;
  clamav: { host: string; port: number } | null;
  ocr: boolean;
  transcribe: { url: string; model: string } | null;
  ffmpeg: string;
  ffprobe: string;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): WorkerConfig {
  const hasServiceRole = Boolean(env.SUPABASE_SERVICE_ROLE_KEY);
  return {
    port: Number(env.PORT ?? 8787),
    supabaseUrl: env.SUPABASE_URL,
    hasServiceRole,
    storageDriver:
      env.STORAGE_DRIVER === 'local' || env.STORAGE_DRIVER === 'supabase'
        ? env.STORAGE_DRIVER
        : hasServiceRole
          ? 'supabase'
          : 'local',
    storageLocalDir: env.STORAGE_LOCAL_DIR || join(tmpdir(), 'rmmm-storage'),
    pollMs: Math.max(250, Number(env.POLL_MS ?? 3000)),
    batch: Math.min(20, Math.max(1, Number(env.BATCH ?? 4))),
    clamav: env.CLAMAV_HOST
      ? { host: env.CLAMAV_HOST, port: Number(env.CLAMAV_PORT ?? 3310) }
      : null,
    ocr: env.OCR_ENABLED === '1',
    transcribe:
      env.TRANSCRIBE_API_URL && env.TRANSCRIBE_API_KEY
        ? { url: env.TRANSCRIBE_API_URL, model: env.TRANSCRIBE_MODEL || 'whisper-1' }
        : null,
    ffmpeg: env.FFMPEG_PATH || 'ffmpeg',
    ffprobe: env.FFPROBE_PATH || 'ffprobe',
  };
}

/** Secrets are read at the call site, never copied into config objects or logs. */
export const serviceRoleKey = () => process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
export const transcribeKey = () => process.env.TRANSCRIBE_API_KEY ?? '';
