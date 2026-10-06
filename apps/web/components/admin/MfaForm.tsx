'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { Button, en, SkeletonBlock, StatusMessage, TextField } from '@rmmm/ui/web';
import { supabaseBrowser } from '@/lib/supabase/browser';

const t = en.admin.mfa;

/** Staff 2FA (SPEC 11): enroll a TOTP app once, then verify a code each sign-in (aal2). */
export function MfaForm({ next }: { next: string }) {
  const [factorId, setFactorId] = useState<string | null>(null);
  const [qr, setQr] = useState<{ svg: string; secret: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [ok, setOk] = useState(false);
  const sb = supabaseBrowser();

  useEffect(() => {
    if (!sb) return;
    sb.auth.mfa
      .listFactors()
      .then(({ data }: { data: { totp: { id: string; status: string }[] } | null }) => {
        const verified = data?.totp.find(
          (f: { id: string; status: string }) => f.status === 'verified',
        );
        if (verified) setFactorId(verified.id);
        setLoading(false);
      });
  }, [sb]);

  if (!sb) return <StatusMessage tone="warning" title={t.unavailable} />;
  if (loading) return <SkeletonBlock height={160} />;

  async function enroll() {
    setError(null);
    const { data, error: e } = await sb!.auth.mfa.enroll({ factorType: 'totp' });
    if (e || !data) return setError(en.admin.errors.generic);
    setFactorId(data.id);
    setQr({ svg: data.totp.qr_code, secret: data.totp.secret });
  }

  async function verify(e: FormEvent) {
    e.preventDefault();
    if (!factorId || busy) return;
    if (!/^\d{6}$/.test(code.trim())) return setError(t.wrongCode);
    setBusy(true);
    setError(null);
    const { error: err } = await sb!.auth.mfa.challengeAndVerify({ factorId, code: code.trim() });
    setBusy(false);
    if (err) return setError(t.wrongCode);
    setOk(true);
    window.location.assign(next);
  }

  if (!factorId) {
    return (
      <div>
        <Button onClick={enroll}>{t.enroll}</Button>
        {error && <StatusMessage tone="error" title={error} />}
      </div>
    );
  }

  return (
    <form className="stack form" onSubmit={verify} noValidate>
      {qr && (
        <div className="stack">
          <p>{t.scan}</p>
          {/* QR is an SVG data URL from Supabase Auth; img-src allows data:. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qr.svg} alt="" width={200} height={200} className="mfa-qr" />
          <p className="mono">
            {t.secret}: {qr.secret}
          </p>
        </div>
      )}
      {error && <StatusMessage tone="error" title={error} />}
      {ok && <StatusMessage tone="success" title={t.done} />}
      <TextField
        name="code"
        label={t.code}
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={6}
        value={code}
        onChange={(e) => setCode(e.target.value)}
        required
      />
      <div>
        <Button type="submit" loading={busy} loadingLabel={t.verifying}>
          {t.verify}
        </Button>
      </div>
    </form>
  );
}
