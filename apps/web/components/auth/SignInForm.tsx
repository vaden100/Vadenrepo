'use client';

import { useCallback, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { OtpCode, parseOtpTarget, type OtpTarget } from '@rmmm/api';
import { Button, en, StatusMessage, TextField } from '@rmmm/ui/web';
import { publicEnv } from '@/lib/env';
import { supabaseBrowser } from '@/lib/supabase/browser';
import { Turnstile } from './Turnstile';

/** Email or phone one-time code (no passwords to store, reset or leak). */
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

  if (!supabase) return <StatusMessage tone="warning" title={en.auth.notConfigured} />;

  async function sendCode(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
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
    if (err) return setError(err.status === 429 ? en.forms.rateLimited : en.common.tryAgain);
    setTarget(t);
  }

  async function verify(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
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
      <form className="stack form" onSubmit={verify} noValidate>
        <StatusMessage
          tone="info"
          title={en.auth.codeSentTo(target.kind === 'email' ? target.email : target.phone)}
        />
        <TextField
          label={en.auth.codeLabel}
          className="mono"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
          error={error}
          autoFocus
        />
        <div className="row">
          <Button type="submit" loading={busy} loadingLabel={en.auth.verifying}>
            {en.auth.verify}
          </Button>
          <Button
            variant="text"
            onClick={() => {
              setTarget(null);
              setCode('');
              setError(null);
            }}
          >
            {en.auth.useDifferent}
          </Button>
        </div>
      </form>
    );
  }

  return (
    <form className="stack form" onSubmit={sendCode} noValidate>
      <TextField
        label={en.auth.contactLabel}
        description={en.auth.contactHint}
        autoComplete="username"
        autoCapitalize="none"
        spellCheck={false}
        value={contact}
        onChange={(e) => setContact(e.target.value)}
        error={error}
      />
      <Turnstile siteKey={publicEnv.turnstileSiteKey} onToken={onToken} />
      <div>
        <Button
          type="submit"
          loading={busy}
          loadingLabel={en.auth.sending}
          disabled={!!publicEnv.turnstileSiteKey && !captcha}
        >
          {en.auth.sendCode}
        </Button>
      </div>
    </form>
  );
}
