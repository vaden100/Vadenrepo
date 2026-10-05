'use client';

import { useCallback, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { OtpCode, parseOtpTarget, type OtpTarget } from '@rmmm/api';
import { Button, en } from '@rmmm/ui/web';
import { publicEnv } from '@/lib/env';
import { supabaseBrowser } from '@/lib/supabase/browser';
import { Turnstile } from './Turnstile';
import s from './forms.module.css';

export function SignInForm({ next = '/account' }: { next?: string }) {
  const router = useRouter();
  const supabase = supabaseBrowser();
  const [contact, setContact] = useState('');
  const [target, setTarget] = useState<OtpTarget | null>(null);
  const [code, setCode] = useState('');
  const [captcha, setCaptcha] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const onToken = useCallback((t: string | null) => setCaptcha(t), []);

  if (!supabase) return <p className={s.error}>{en.auth.notConfigured}</p>;

  async function sendCode(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const t = parseOtpTarget(contact);
    if (!t) return setError(en.auth.invalidContact);
    setBusy(true);
    const options = { shouldCreateUser: true, captchaToken: captcha ?? undefined };
    const { error: err } =
      t.kind === 'email'
        ? await supabase!.auth.signInWithOtp({ email: t.email, options })
        : await supabase!.auth.signInWithOtp({ phone: t.phone, options });
    setBusy(false);
    if (err) return setError(en.common.tryAgain);
    setTarget(t);
  }

  async function verify(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!target || !OtpCode.safeParse(code).success) return setError(en.auth.invalidCode);
    setBusy(true);
    const { error: err } =
      target.kind === 'email'
        ? await supabase!.auth.verifyOtp({ email: target.email, token: code, type: 'email' })
        : await supabase!.auth.verifyOtp({ phone: target.phone, token: code, type: 'sms' });
    setBusy(false);
    if (err) return setError(en.auth.invalidCode);
    router.replace(next);
    router.refresh();
  }

  if (target) {
    return (
      <form className={s.form} onSubmit={verify} noValidate>
        <p className={s.status} role="status">
          {en.auth.codeSentTo(target.kind === 'email' ? target.email : target.phone)}
        </p>
        <div className={s.field}>
          <label className={s.label} htmlFor="otp">
            {en.auth.codeLabel}
          </label>
          <input
            id="otp"
            className={`${s.input} ${s.mono}`}
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            aria-invalid={!!error}
            aria-describedby={error ? 'auth-error' : undefined}
            autoFocus
          />
        </div>
        {error && (
          <p id="auth-error" className={s.error} role="alert">
            {error}
          </p>
        )}
        <Button type="submit" loading={busy}>
          {en.auth.verify}
        </Button>
        <Button
          variant="ghost"
          onClick={() => {
            setTarget(null);
            setCode('');
          }}
        >
          {en.auth.useDifferent}
        </Button>
      </form>
    );
  }

  return (
    <form className={s.form} onSubmit={sendCode} noValidate>
      <div className={s.field}>
        <label className={s.label} htmlFor="contact">
          {en.auth.contactLabel}
        </label>
        <input
          id="contact"
          className={s.input}
          autoComplete="email tel"
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          aria-invalid={!!error}
          aria-describedby={error ? 'auth-error contact-hint' : 'contact-hint'}
        />
        <p id="contact-hint" className={s.hint}>
          {en.auth.contactHint}
        </p>
      </div>
      <Turnstile siteKey={publicEnv.turnstileSiteKey} onToken={onToken} />
      {error && (
        <p id="auth-error" className={s.error} role="alert">
          {error}
        </p>
      )}
      <Button type="submit" loading={busy} disabled={!!publicEnv.turnstileSiteKey && !captcha}>
        {en.auth.sendCode}
      </Button>
    </form>
  );
}
