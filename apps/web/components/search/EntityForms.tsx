'use client';

import { useCallback, useState, type FormEvent } from 'react';
import { Button, en, StatusMessage, TextArea, TextField } from '@rmmm/ui/web';
import { Turnstile } from '@/components/auth/Turnstile';
import { postJson } from '@/components/forms/submit';
import { publicEnv } from '@/lib/env';

const t = en.entity;

/** A business answers with its own evidence (SPEC 10.6). Reviewed within 7 days. */
export function EntityDisputeForm({ slug }: { slug: string }) {
  const [v, setV] = useState({ name: '', email: '', body: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [failure, setFailure] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [ref, setRef] = useState<string | null>(null);
  const [captcha, setCaptcha] = useState<string | null>(null);
  const onToken = useCallback((x: string | null) => setCaptcha(x), []);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    const errs: Record<string, string> = {};
    if (!v.name.trim()) errs.name = en.contact.errName;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email)) errs.email = en.contact.errEmail;
    if (v.body.trim().length < 20) errs.body = t.disputeErrBody;
    setErrors(errs);
    if (Object.keys(errs).length) return setFailure(en.forms.fixErrors(Object.keys(errs).length));
    setBusy(true);
    setFailure(null);
    const r = await postJson<{ ref: string }>('/api/disputes', {
      entitySlug: slug,
      ...v,
      ...(captcha ? { turnstileToken: captcha } : {}),
    });
    setBusy(false);
    if (r.ok) return setRef(r.data.ref);
    setFailure(r.message || en.forms.serverError);
  }

  if (ref) return <StatusMessage tone="success" title={t.disputeSent(ref)} />;
  return (
    <form className="stack" onSubmit={submit} noValidate>
      {failure && <StatusMessage tone="error" title={failure} />}
      <TextField
        name="name"
        label={t.disputeName}
        autoComplete="name"
        value={v.name}
        onChange={(e) => setV({ ...v, name: e.target.value })}
        error={errors.name}
        maxLength={120}
        required
      />
      <TextField
        name="email"
        type="email"
        label={t.disputeEmail}
        autoComplete="email"
        value={v.email}
        onChange={(e) => setV({ ...v, email: e.target.value })}
        error={errors.email}
        maxLength={254}
        required
      />
      <TextArea
        name="body"
        label={t.disputeBody}
        value={v.body}
        onChange={(e) => setV({ ...v, body: e.target.value })}
        error={errors.body}
        maxLength={8000}
        rows={5}
        required
      />
      <Turnstile siteKey={publicEnv.turnstileSiteKey} onToken={onToken} />
      <div>
        <Button
          type="submit"
          loading={busy}
          loadingLabel={en.forms.sending}
          disabled={!!publicEnv.turnstileSiteKey && !captcha}
        >
          {t.disputeSend}
        </Button>
      </div>
    </form>
  );
}

/** The verified business (claimed by staff) posts its public statement. */
export function EntityReplyForm({ slug, initial }: { slug: string; initial: string }) {
  const [text, setText] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);
  return (
    <form
      className="stack"
      noValidate
      onSubmit={async (e) => {
        e.preventDefault();
        if (busy) return;
        setBusy(true);
        const r = await postJson(`/api/entities/${slug}/reply`, { statement: text });
        setBusy(false);
        setMsg(
          r.ok
            ? { tone: 'success', text: t.replySaved }
            : { tone: 'error', text: r.message || en.forms.serverError },
        );
        if (r.ok) window.location.reload();
      }}
    >
      {msg && <StatusMessage tone={msg.tone} title={msg.text} />}
      <TextArea
        name="statement"
        label={t.replyFormLabel}
        description={t.replyFormHint}
        value={text}
        onChange={(e) => setText(e.target.value)}
        maxLength={2000}
        showCount
        rows={5}
      />
      <div>
        <Button type="submit" loading={busy} loadingLabel={en.forms.sending}>
          {t.replySend}
        </Button>
      </div>
    </form>
  );
}
