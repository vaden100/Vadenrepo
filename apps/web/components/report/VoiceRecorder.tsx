'use client';

import { useEffect, useRef, useState } from 'react';
import { VOICE_NOTE_MAX_SECONDS } from '@rmmm/api';
import { Button, en, StatusMessage } from '@rmmm/ui/web';

const t = en.report.story;

function pickMime(): string | undefined {
  if (typeof MediaRecorder === 'undefined') return undefined;
  return ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus'].find((m) =>
    MediaRecorder.isTypeSupported(m),
  );
}

/**
 * 60-second voice note (SPEC 4.1 step 5). Stops itself at the limit. The recording stays on
 * the device until the reporter keeps it.
 */
export function VoiceRecorder({
  onRecorded,
  disabled,
}: {
  onRecorded: (blob: Blob, mime: string, seconds: number) => void;
  disabled?: boolean;
}) {
  const [state, setState] = useState<'idle' | 'recording' | 'denied' | 'unsupported'>('idle');
  const [seconds, setSeconds] = useState(0);
  const rec = useRef<MediaRecorder | null>(null);
  const timer = useRef<number | null>(null);
  const startedAt = useRef(0);

  useEffect(
    () => () => {
      if (timer.current) window.clearInterval(timer.current);
      rec.current?.stream.getTracks().forEach((tr) => tr.stop());
    },
    [],
  );

  const stop = () => rec.current?.state === 'recording' && rec.current.stop();

  const start = async () => {
    const mime = pickMime();
    if (!mime || !navigator.mediaDevices?.getUserMedia) return setState('unsupported');
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      return setState('denied');
    }
    const chunks: Blob[] = [];
    const r = new MediaRecorder(stream, { mimeType: mime });
    r.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    r.onstop = () => {
      stream.getTracks().forEach((tr) => tr.stop());
      if (timer.current) window.clearInterval(timer.current);
      const secs = Math.min(
        VOICE_NOTE_MAX_SECONDS,
        Math.max(1, Math.round((Date.now() - startedAt.current) / 1000)),
      );
      setState('idle');
      const base = mime.split(';')[0]!;
      onRecorded(new Blob(chunks, { type: base }), base, secs);
    };
    rec.current = r;
    startedAt.current = Date.now();
    setSeconds(0);
    r.start(1000);
    setState('recording');
    timer.current = window.setInterval(() => {
      const s = Math.floor((Date.now() - startedAt.current) / 1000);
      setSeconds(s);
      if (s >= VOICE_NOTE_MAX_SECONDS) stop();
    }, 250);
  };

  return (
    <div className="stack">
      {state === 'recording' ? (
        <div className="voice">
          <span className="voice__dot" aria-hidden="true" />
          <span role="status">{t.recording(Math.min(seconds, VOICE_NOTE_MAX_SECONDS))}</span>
          <Button variant="secondary" onClick={stop}>
            {t.stop}
          </Button>
        </div>
      ) : (
        <div>
          <Button variant="secondary" onClick={start} disabled={disabled}>
            {t.record}
          </Button>
        </div>
      )}
      {state === 'denied' && <StatusMessage tone="warning" title={t.micDenied} />}
      {state === 'unsupported' && <StatusMessage tone="info" title={t.micUnsupported} />}
    </div>
  );
}
