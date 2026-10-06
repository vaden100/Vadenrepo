'use client';

import { useState } from 'react';
import { Button, en, StatusMessage } from '@rmmm/ui/web';
import { RedactionEditor } from '@/components/report/RedactionEditor';
import { useAdminAction } from './useAdminAction';

const t = en.admin.report;

export interface EvidenceItem {
  id: string;
  kind: 'image' | 'pdf' | 'audio' | 'video';
  status: string;
  rejectReason: string | null;
  voiceNote: boolean;
  covered: boolean;
  ocr: string | null;
  transcript: string | null;
  scan: string;
}

/** Evidence viewer (SPEC 5 admin): files stream from private storage to staff only. */
export function EvidencePanel({
  items,
  canModerate,
}: {
  items: EvidenceItem[];
  canModerate: boolean;
}) {
  const { run, error, done } = useAdminAction();
  const [editing, setEditing] = useState<{ id: string; blob: Blob } | null>(null);
  const [shown, setShown] = useState<Record<string, 'original' | 'covered'>>({});

  const openEditor = async (id: string) => {
    const res = await fetch(`/api/admin/media/${id}`);
    if (res.ok) setEditing({ id, blob: await res.blob() });
  };

  return (
    <div className="stack">
      {error && <StatusMessage tone="error" title={error} />}
      {done && <StatusMessage tone="success" title={done} />}
      <ul className="evidence">
        {items.map((m, i) => {
          const view = shown[m.id] ?? (m.covered ? 'covered' : 'original');
          const src = `/api/admin/media/${m.id}${view === 'covered' ? '?copy=covered' : ''}`;
          const label = `${m.voiceNote ? en.report.story.voiceTitle : m.kind} ${i + 1}`;
          const ready = m.status === 'ready';
          return (
            <li key={m.id} className="evidence__item">
              <p className="mono">
                {label}. {t.fileStatus(en.report.receipts[m.status as 'ready'] ?? m.status)}
                {m.rejectReason
                  ? ` (${en.report.receipts.rejectReasons[m.rejectReason] ?? m.rejectReason})`
                  : ''}
                {m.scan === 'unscanned' ? `. ${en.admin.signals.unscanned}` : ''}
              </p>
              {ready && m.kind === 'image' && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={src} alt={label} className="evidence__img" loading="lazy" />
              )}
              {ready && m.kind === 'audio' && (
                <audio controls preload="none" src={src} aria-label={label} />
              )}
              {ready && m.kind === 'video' && (
                <video
                  controls
                  preload="none"
                  src={src}
                  aria-label={label}
                  className="evidence__img"
                />
              )}
              {ready && m.kind === 'pdf' && (
                <a href={src} target="_blank" rel="noopener noreferrer">
                  {t.openFile('PDF')}
                </a>
              )}
              {ready && m.kind === 'image' && (
                <div className="row">
                  {m.covered && (
                    <Button
                      variant="text"
                      aria-pressed={view === 'covered'}
                      onClick={() =>
                        setShown((s) => ({
                          ...s,
                          [m.id]: view === 'covered' ? 'original' : 'covered',
                        }))
                      }
                    >
                      {view === 'covered' ? t.original : t.covered}
                    </Button>
                  )}
                  {canModerate && (
                    <Button variant="secondary" onClick={() => openEditor(m.id)}>
                      {t.cover}
                    </Button>
                  )}
                </div>
              )}
              {m.ocr && (
                <details>
                  <summary>{t.ocr}</summary>
                  <p className="pre">{m.ocr}</p>
                </details>
              )}
              {m.transcript && (
                <details>
                  <summary>{t.transcript}</summary>
                  <p className="pre">{m.transcript}</p>
                </details>
              )}
            </li>
          );
        })}
      </ul>
      <RedactionEditor
        file={editing?.blob ?? null}
        open={editing !== null}
        onClose={() => setEditing(null)}
        onApply={async (_blob, boxes) => {
          const id = editing!.id;
          setEditing(null);
          await run('POST', `/api/admin/media/${id}/redact`, { boxes }, t.coverSaved);
          setShown((s) => ({ ...s, [id]: 'covered' }));
        }}
      />
    </div>
  );
}
