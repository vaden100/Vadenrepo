import { transcribeKey } from './config.js';

/**
 * OCR on screenshots and flyers (tesseract.js, loaded only when OCR_ENABLED=1; it downloads
 * its language data on first use, or reads TESSDATA_PREFIX when set).
 */
export async function ocr(image: Uint8Array): Promise<string | null> {
  const { createWorker } = await import('tesseract.js');
  const worker = await createWorker(
    'eng',
    1,
    process.env.TESSDATA_PREFIX ? { langPath: process.env.TESSDATA_PREFIX, gzip: false } : {},
  );
  try {
    const { data } = await worker.recognize(Buffer.from(image));
    return data.text.trim().slice(0, 20_000) || null;
  } finally {
    await worker.terminate();
  }
}

/**
 * Voice-note transcription through an OpenAI-compatible /audio/transcriptions endpoint
 * (TRANSCRIBE_API_URL + TRANSCRIBE_API_KEY). Off when not configured. Listed in
 * /legal/subprocessors before it is turned on.
 */
export async function transcribe(
  audio: Uint8Array,
  mime: string,
  target: { url: string; model: string },
): Promise<string | null> {
  const form = new FormData();
  form.append('model', target.model);
  form.append('file', new Blob([audio], { type: mime }), `voice.${mime.split('/')[1] ?? 'bin'}`);
  const res = await fetch(target.url, {
    method: 'POST',
    headers: { authorization: `Bearer ${transcribeKey()}` },
    body: form,
    signal: AbortSignal.timeout(120_000),
  });
  if (!res.ok) throw new Error(`transcribe ${res.status}`);
  const body = (await res.json()) as { text?: string };
  return body.text?.trim().slice(0, 20_000) || null;
}
