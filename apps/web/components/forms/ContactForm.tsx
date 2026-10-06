'use client';

import { useCallback, useRef, useState, type FormEvent } from 'react';
import { CONTACT_REASONS, ContactInput } from '@rmmm/api';
import { Button, en, SelectField, StatusMessage, TextArea, TextField } from '@rmmm/ui/web';
import { Turnstile } from '@/components/auth/Turnstile';
import { track } from '@/components/shell/analytics';
import { publicEnv } from '@/lib/env';
import { postJson } from './submit';

type Field = 'reason' | 'name' | 'email' | 'message';
const fieldMessage: Record<Field, string> = {
  reason: en.contact.errReason,
  name: en.contact.errName,
  email: en.contact.errEmail,
  message: en.contact.errMessage,
};
const ORDER: Field[] = ['reason', 'name', 'email', 'message'];

/**
 * Contact form (WBS 19, 59, 105). Client validation for fast feedback; the server validates
 * again. Errors are listed at the top and focus moves to the first invalid field.
 */
export function ContactForm({ defaultEmail = '' }: { defaultEmail?: string }) {
  const [values, setValues] = useState({
    reason: '',
    name: '',
    email: defaultEmail,
    message: '',
    website: '',
  });
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<Field, boolean>>>({});
  const [status, setStatus] = useState<'idle' | 'sending' | 'error' | 'done'>('idle');
  const [failure, setFailure] = useState<string | null>(null);
  const [ref, setRef] = useState<string | null>(null);
  const [captcha, setCaptcha] = useState<string | null>(null);
  const started = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);
  const onToken = useCallback((t: string | null) => setCaptcha(t), []);

  const validate = (v = values) => {
    const r = ContactInput.safeParse({ ...v, website: '' });
    const errs: Partial<Record<Field, string>> = {};
    if (!r.success)
      for (const i of r.error.issues) {
        const k = i.path[0] as Field;
        if (k in fieldMessage) errs[k] ??= fieldMessage[k];
      }
    return errs;
  };

  const set = (k: keyof typeof values) => (v: string) => {
    if (!started.current) {
      started.current = true;
      track('form_started', { form: 'contact' });
    }
    const next = { ...values, [k]: v };
    setValues(next);
    if (touched[k as Field]) setErrors(validate(next));
  };

  const focusFirst = (errs: Partial<Record<Field, string>>) => {
    const first = ORDER.find((f) => errs[f]);
    if (first) formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
  };

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (status === 'sending') return; // no double submission (Enter on a busy button)
    const errs = validate();
    setErrors(errs);
    setTouched({ reason: true, name: true, email: true, message: true });
    if (Object.keys(errs).length) {
      setStatus('error');
      setFailure(null);
      return focusFirst(errs);
    }

    setStatus('sending');
    setFailure(null);
    const r = await postJson<{ ref: string }>('/api/contact', {
      ...values,
      turnstileToken: captcha ?? undefined,
    });
    if (r.ok) {
      setRef(r.data.ref);
      setStatus('done');
      track('form_submitted', { form: 'contact', reason: values.reason });
      return;
    }
    track('form_failed', { form: 'contact', kind: r.kind });
    setStatus('error');
    if (r.kind === 'invalid') {
      const server: Partial<Record<Field, string>> = {};
      for (const k of Object.keys(r.fields))
        if (k in fieldMessage) server[k as Field] = fieldMessage[k as Field];
      setErrors(server);
      setFailure(
        r.fields.turnstileToken ? r.message : en.forms.fixErrors(Object.keys(server).length || 1),
      );
      focusFirst(server);
    } else {
      setFailure(r.message);
    }
  }

  if (status === 'done' && ref) {
    return (
      <div className="stack">
        <StatusMessage tone="success" title={en.contact.successTitle}>
          <p>{en.contact.successBody(ref)}</p>
        </StatusMessage>
        <Button
          variant="secondary"
          onClick={() => {
            setValues({
              reason: '',
              name: values.name,
              email: values.email,
              message: '',
              website: '',
            });
            setTouched({});
            setErrors({});
            setRef(null);
            setStatus('idle');
          }}
        >
          {en.contact.sendAnother}
        </Button>
      </div>
    );
  }

  const errCount = Object.keys(errors).length;
  const blur = (k: Field) => () => {
    setTouched((t) => ({ ...t, [k]: true }));
    setErrors(validate());
  };

  return (
    <form
      ref={formRef}
      className="stack form"
      onSubmit={submit}
      noValidate
      aria-describedby="contact-required"
    >
      <p id="contact-required" className="muted">
        {en.forms.allRequired}
      </p>
      {(failure || (status === 'error' && errCount > 0)) && (
        <StatusMessage tone="error" title={failure ?? en.forms.fixErrors(errCount)} />
      )}
      <SelectField
        name="reason"
        label={en.contact.reason}
        value={values.reason}
        onChange={(e) => set('reason')(e.target.value)}
        onBlur={blur('reason')}
        error={touched.reason ? errors.reason : null}
        placeholder={en.forms.chooseOne}
        options={CONTACT_REASONS.map((r) => ({ value: r, label: en.contact.reasons[r] }))}
        required
      />
      {values.reason === 'safety' && <StatusMessage tone="warning" title={en.contact.safetyNote} />}
      <TextField
        name="name"
        label={en.contact.name}
        autoComplete="name"
        value={values.name}
        onChange={(e) => set('name')(e.target.value)}
        onBlur={blur('name')}
        error={touched.name ? errors.name : null}
        valid={touched.name && !errors.name && values.name.trim().length > 0}
        maxLength={120}
        required
      />
      <TextField
        name="email"
        type="email"
        inputMode="email"
        label={en.contact.email}
        description={en.contact.emailHint}
        autoComplete="email"
        value={values.email}
        onChange={(e) => set('email')(e.target.value)}
        onBlur={blur('email')}
        error={touched.email ? errors.email : null}
        valid={touched.email && !errors.email && values.email.includes('@')}
        maxLength={254}
        required
      />
      <TextArea
        name="message"
        label={en.contact.message}
        description={en.contact.messageHint}
        value={values.message}
        onChange={(e) => set('message')(e.target.value)}
        onBlur={blur('message')}
        error={touched.message ? errors.message : null}
        maxLength={4000}
        showCount
        rows={7}
        required
      />
      {/* Honeypot: hidden from people and assistive tech; bots fill it. */}
      <div className="hp" aria-hidden="true">
        <label htmlFor="contact-website">Website</label>
        <input
          id="contact-website"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          value={values.website}
          onChange={(e) => set('website')(e.target.value)}
        />
      </div>
      <Turnstile siteKey={publicEnv.turnstileSiteKey} onToken={onToken} />
      <div>
        <Button
          type="submit"
          loading={status === 'sending'}
          loadingLabel={en.forms.sending}
          disabled={!!publicEnv.turnstileSiteKey && !captcha}
        >
          {en.contact.submit}
        </Button>
      </div>
    </form>
  );
}
