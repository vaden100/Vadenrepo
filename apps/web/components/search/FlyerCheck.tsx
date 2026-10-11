'use client';

import Link from 'next/link';
import { useState } from 'react';
import { FLYER_MAX_BYTES, type FlyerResponse } from '@rmmm/api';
import { EvidenceSummary, en, StatusMessage } from '@rmmm/ui/web';
import { track } from '@/components/shell/analytics';

const t = en.lookup;

/** SPEC 8.3: check a flyer or screenshot against images in reviewed reports. Not stored. */
export function FlyerCheck() {
  const [state, setState] = useState<'idle' | 'checking' | 'done' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<FlyerResponse | null>(null);

  async function check(file: File) {
    setError(null);
    if (!/^image\/(jpeg|png|webp)$/.test(file.type))
      return (setError(t.flyerType), setState('error'));
    if (file.size > FLYER_MAX_BYTES) return (setError(t.flyerTooLarge), setState('error'));
    setState('checking');
    track('search_started', { surface: 'flyer' });
    const form = new FormData();
    form.append('image', file);
    try {
      const res = await fetch('/api/search/image', { method: 'POST', body: form });
      const body = await res.json();
      if (!res.ok) throw new Error(body.message ?? t.unavailable);
      setData(body as FlyerResponse);
      setState('done');
    } catch (e) {
      setError(e instanceof Error && e.message ? e.message : t.unavailable);
      setState('error');
    }
  }

  const total = data?.results.reduce((n, r) => n + r.matchingReports, 0) ?? 0;
  return (
    <section aria-labelledby="flyer-title" className="stack">
      <h2 id="flyer-title" className="h3">
        {t.flyerTitle}
      </h2>
      <p className="muted">{t.flyerHint}</p>
      <div>
        <label className="rmmm-btn rmmm-btn--secondary dropzone__btn">
          {t.flyerChoose}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="rmmm-visually-hidden"
            data-testid="flyer-input"
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = '';
              if (f) void check(f);
            }}
          />
        </label>
      </div>
      <div aria-live="polite">
        {state === 'checking' && <p className="muted">{t.flyerChecking}</p>}
        {error && <StatusMessage tone="error" title={error} />}
        {state === 'done' && data && (
          <div className="stack">
            {data.results.length > 0 ? (
              <>
                <p className="h3">{t.flyerMatches(total)}</p>
                <ul>
                  {data.results.map((r) => (
                    <li key={r.slug}>
                      <Link href={`/entities/${r.slug}`}>{r.name}</Link>
                      {r.city ? ` (${[r.city, r.state].filter(Boolean).join(', ')})` : ''}
                    </li>
                  ))}
                </ul>
              </>
            ) : data.underReview ? (
              <EvidenceSummary state="under_review" />
            ) : (
              <p>{t.flyerNone}</p>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
