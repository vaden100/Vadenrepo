'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import type { ReportStatusView } from '@rmmm/api';
import { Button, en, SkeletonBlock, StatusMessage, TextField } from '@rmmm/ui/web';
import { requestJson } from '@/components/forms/submit';

const t = en.report.status;
const CODE = /^RMMM-\d{2}-\d{4,}$/;
const CLAIM = /^[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$/;

/** Anonymous reporters check on a report with case code + claim code (SPEC 4.1). */
export function ClaimStatus() {
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<ReportStatusView | null>(null);
  const [code, setCode] = useState('');
  const [claim, setClaim] = useState('');
  const [errors, setErrors] = useState<{ code?: string; claim?: string }>({});
  const [failure, setFailure] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const resultRef = useRef<HTMLHeadingElement>(null);

  // A claim saved in this browser (after submitting here) shows straight away.
  useEffect(() => {
    let alive = true;
    requestJson<{ report: ReportStatusView | null }>('GET', '/api/reports/claim').then((r) => {
      if (!alive) return;
      if (r.ok && r.data.report) setView(r.data.report);
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (view && !loading) resultRef.current?.focus();
  }, [view, loading]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    const c = code.trim().toUpperCase();
    const k = claim.trim().toUpperCase();
    const errs = {
      ...(CODE.test(c) ? {} : { code: t.formatError }),
      ...(CLAIM.test(k) ? {} : { claim: t.formatError }),
    };
    setErrors(errs);
    if (Object.keys(errs).length) return setFailure(en.forms.fixErrors(Object.keys(errs).length));
    setBusy(true);
    setFailure(null);
    const r = await requestJson<ReportStatusView>('POST', '/api/reports/claim', {
      code: c,
      claim: k,
    });
    setBusy(false);
    if (r.ok) return setView(r.data);
    setFailure(r.kind === 'not_found' || r.kind === 'invalid' ? t.notFound : r.message);
  }

  if (loading) return <SkeletonBlock height={200} />;

  return (
    <div className="stack-lg">
      {view && (
        <section className="claim-result stack" aria-labelledby="claim-result">
          <h2 id="claim-result" ref={resultRef} tabIndex={-1} className="mono">
            {view.code}
          </h2>
          <p>{t.states[view.status] ?? view.status}</p>
          <p className="muted">
            {t.files(view.files)}
            {view.filesProcessing > 0 ? `. ${t.processing(view.filesProcessing)}` : ''}
          </p>
        </section>
      )}
      <form className="stack form" onSubmit={submit} noValidate>
        {failure && <StatusMessage tone="error" title={failure} />}
        <TextField
          name="code"
          label={t.code}
          description={t.codeHint}
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          error={errors.code}
          maxLength={20}
          required
        />
        <TextField
          name="claim"
          label={t.claim}
          description={t.claimHint}
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          value={claim}
          onChange={(e) => setClaim(e.target.value)}
          error={errors.claim}
          maxLength={20}
          required
        />
        <div>
          <Button type="submit" loading={busy} loadingLabel={en.forms.sending}>
            {t.submit}
          </Button>
        </div>
      </form>
    </div>
  );
}
