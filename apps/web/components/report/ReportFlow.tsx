'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import {
  CATEGORIES,
  hasIdentifier,
  MAX_FILES_PER_REPORT,
  MEDIA_RULES,
  ON_CAMERA,
  PAY_RAILS,
  STORY_MAX,
  STORY_MIN,
  kindForMime,
  type CurrentDraft,
  type MediaView,
  type MoneyStep,
  type ReportDraftView,
  type SubmitResult as SubmitOk,
  type WhoStep,
} from '@rmmm/api';
import {
  Button,
  Checkbox,
  en,
  RadioGroup,
  SelectField,
  SkeletonBlock,
  StatusMessage,
  TextArea,
  TextField,
} from '@rmmm/ui/web';
import { Turnstile } from '@/components/auth/Turnstile';
import { requestJson } from '@/components/forms/submit';
import { track } from '@/components/shell/analytics';
import { publicEnv } from '@/lib/env';
import { ReportDone } from './ReportDone';
import { RedactionEditor } from './RedactionEditor';
import { checkFile, mimeOf, stripOnDevice, uploadEvidence } from './upload';
import { VoiceRecorder } from './VoiceRecorder';

const t = en.report;
const TOTAL = 6;
type Step = 1 | 2 | 3 | 4 | 5 | 6 | 7;
type Money = Partial<Record<keyof MoneyStep, string>>;
type Who = Partial<Record<keyof WhoStep, string>>;
type SaveState = 'idle' | 'saving' | 'saved' | 'error';

interface LocalFile {
  key: string;
  name: string;
  status: 'queued' | 'uploading' | 'error';
  pct: number;
  error?: string;
}

const WHO_GROUPS: {
  legend: string;
  fields: { k: keyof WhoStep; label: string; type?: string; hint?: string }[];
}[] = [
  {
    legend: t.who.groupSocial,
    fields: [
      { k: 'businessName', label: t.who.businessName },
      { k: 'instagram', label: t.who.instagram, hint: t.who.handleHint },
      { k: 'tiktok', label: t.who.tiktok, hint: t.who.handleHint },
      { k: 'facebook', label: t.who.facebook },
      { k: 'x', label: t.who.x, hint: t.who.handleHint },
      { k: 'phone', label: t.who.phone, type: 'tel' },
      { k: 'website', label: t.who.website, type: 'url' },
    ],
  },
  {
    legend: t.who.groupPayment,
    fields: [
      { k: 'cashtag', label: t.who.cashtag },
      { k: 'zelle', label: t.who.zelle },
      { k: 'venmo', label: t.who.venmo },
      { k: 'paypal', label: t.who.paypal },
      { k: 'appleCash', label: t.who.appleCash },
    ],
  },
  {
    legend: t.who.groupPlace,
    fields: [
      { k: 'city', label: t.who.city },
      { k: 'state', label: t.who.state },
    ],
  },
];

const today = () => new Date().toISOString().slice(0, 10);
const clean = <T extends Record<string, string | undefined>>(o: T) =>
  Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined && v.trim() !== '')) as T;

function quickExit() {
  // Replace, so Back does not return here (SPEC 1: people may be reporting someone close to them).
  window.location.replace('https://www.google.com/search?q=weather');
}

/**
 * Submit a story (SPEC 4.1): six steps and a review, saved to the server as you go. Nothing
 * is shown as saved until the server confirms (WBS 147).
 */
export function ReportFlow({ member }: { member: { name: string } | null }) {
  const [loading, setLoading] = useState(true);
  const [available, setAvailable] = useState(true);
  const [resumed, setResumed] = useState(false);
  const [draft, setDraft] = useState<ReportDraftView | null>(null);
  const [step, setStep] = useState<Step>(1);
  const [category, setCategory] = useState('');
  const [who, setWho] = useState<Who>({});
  const [money, setMoney] = useState<Money>({ currency: 'USD' });
  const [story, setStory] = useState('');
  const [media, setMedia] = useState<MediaView[]>([]);
  const [locals, setLocals] = useState<LocalFile[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [consent, setConsent] = useState({
    age: false,
    truth: false,
    terms: false,
    contact: false,
    onCamera: '',
  });
  const [captcha, setCaptcha] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [failure, setFailure] = useState<string | null>(null);
  const [save, setSave] = useState<SaveState>('idle');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<(SubmitOk & { rail?: string }) | null>(null);
  const [redacting, setRedacting] = useState<File | null>(null);
  const [fileNote, setFileNote] = useState<string | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const dirty = useRef(false);
  const draftRef = useRef<ReportDraftView | null>(null);
  useEffect(() => {
    draftRef.current = draft;
  }, [draft]);

  const load = useCallback((d: ReportDraftView) => {
    setDraft(d);
    setCategory(d.category ?? '');
    setWho(d.who as Who);
    setMoney({ currency: 'USD', ...(d.money as Money) });
    setStory(d.story);
    setMedia(d.media);
  }, []);

  // Resume a draft from this device (cookie) or the member's account.
  useEffect(() => {
    let alive = true;
    requestJson<CurrentDraft>('GET', '/api/reports/current').then((r) => {
      if (!alive) return;
      if (r.ok && r.data.draft) {
        load(r.data.draft);
        setStep(Math.min(Math.max(r.data.draft.step, 1), 7) as Step);
        setResumed(true);
      }
      setAvailable(r.ok ? r.data.available : true);
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, [load]);

  // Focus the step heading after moving, so screen readers start at the top of the step.
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    headingRef.current?.focus();
  }, [step, done]);

  const ensureDraft = useCallback(async (): Promise<ReportDraftView | null> => {
    if (draftRef.current) return draftRef.current;
    const r = await requestJson<ReportDraftView>(
      'POST',
      '/api/reports',
      category ? { category } : {},
    );
    if (!r.ok) {
      setFailure(r.message || en.forms.serverError);
      return null;
    }
    track('form_started', { form: 'report' });
    draftRef.current = r.data;
    setDraft(r.data);
    return r.data;
  }, [category]);

  const payload = useCallback(
    () => ({
      ...(category ? { category } : {}),
      who: clean(who),
      money: { ...clean(money), currency: (money.currency as MoneyStep['currency']) ?? 'USD' },
      story,
    }),
    [category, who, money, story],
  );

  const persist = useCallback(
    async (nextStep?: Step): Promise<boolean> => {
      const d = await ensureDraft();
      if (!d) return false;
      setSave('saving');
      dirty.current = false;
      const r = await requestJson<ReportDraftView>('PATCH', `/api/reports/${d.id}`, {
        ...payload(),
        ...(nextStep ? { step: nextStep } : {}),
      });
      if (!r.ok) {
        setSave('error');
        if (r.kind === 'conflict') setFailure(r.message);
        return false;
      }
      setSave('saved');
      setMedia(r.data.media);
      return true;
    },
    [ensureDraft, payload],
  );

  // Autosave typing after a pause, only once a draft exists.
  useEffect(() => {
    if (!draft || !dirty.current) return;
    const id = window.setTimeout(() => void persist(), 1500);
    return () => window.clearTimeout(id);
  }, [draft, who, money, story, persist]);

  const edit =
    <T,>(setter: (fn: (v: T) => T) => void) =>
    (fn: (v: T) => T) => {
      dirty.current = true;
      setter(fn);
    };
  const editWho = edit<Who>(setWho);
  const editMoney = edit<Money>(setMoney);

  // Poll while the worker cleans files.
  const pending = media.some(
    (m) => m.uploadStatus === 'uploaded' || m.uploadStatus === 'processing',
  );
  useEffect(() => {
    if (!draft || !pending) return;
    const id = window.setInterval(async () => {
      const r = await requestJson<{ media: MediaView[] }>('GET', `/api/reports/${draft.id}/media`);
      if (r.ok) setMedia(r.data.media);
    }, 2500);
    return () => window.clearInterval(id);
  }, [draft, pending]);

  // ---------- validation ----------

  const voiceNote = media.find((m) => m.voiceNote && m.uploadStatus !== 'rejected');
  const uploading = locals.some((l) => l.status !== 'error');

  function validate(s: Step): Record<string, string> {
    const e: Record<string, string> = {};
    if (s === 1 && !category) e.category = t.category.error;
    if (s === 2 && !hasIdentifier(who as Partial<WhoStep>)) e.who = t.who.error;
    if (s === 3) {
      if (money.amount && !/^\d{1,7}(\.\d{1,2})?$/.test(money.amount.trim()))
        e.amount = t.money.amountError;
      if (money.paidOn && money.paidOn > today()) e.paidOn = t.money.paidOnError;
    }
    if (s === 4 && uploading) e.files = t.receipts.waitForUploads;
    if (s === 5 && story.trim().length < STORY_MIN && !voiceNote) e.story = t.story.error;
    if (s === 6) {
      if (!member && !consent.age) e.age = t.you.ageError;
      if (!consent.truth) e.truth = t.you.truthError;
      if (!consent.terms) e.terms = t.you.termsError;
    }
    return e;
  }

  const showErrors = (e: Record<string, string>) => {
    setErrors(e);
    setFailure(null);
    const first = Object.keys(e)[0];
    if (first)
      document
        .querySelector<HTMLElement>(
          `[data-field="${first}"] input, [data-field="${first}"] textarea, [data-field="${first}"] button`,
        )
        ?.focus();
  };

  async function next(e?: FormEvent) {
    e?.preventDefault();
    if (busy) return;
    const errs = validate(step);
    if (Object.keys(errs).length) return showErrors(errs);
    setErrors({});
    setFailure(null);
    const to = Math.min(step + 1, 7) as Step;
    setBusy(true);
    const ok = step === 6 ? true : await persist(to);
    setBusy(false);
    if (ok) setStep(to);
    else setFailure((f) => f ?? en.forms.networkError);
  }

  async function back() {
    setErrors({});
    setFailure(null);
    if (draft && dirty.current) await persist();
    setStep((s) => Math.max(1, s - 1) as Step);
  }

  async function goTo(s: Step) {
    setErrors({});
    setStep(s);
  }

  async function submit() {
    if (busy || !draft) return;
    for (const s of [1, 2, 3, 4, 5, 6] as Step[]) {
      const errs = validate(s);
      if (Object.keys(errs).length) {
        setStep(s);
        setFailure(t.review.incomplete);
        setErrors(errs);
        return;
      }
    }
    setBusy(true);
    setFailure(null);
    if (dirty.current && !(await persist())) {
      setBusy(false);
      setFailure(en.forms.networkError);
      return;
    }
    const r = await requestJson<SubmitOk>('POST', `/api/reports/${draft.id}/submit`, {
      consentTruth: consent.truth,
      consentTerms: consent.terms,
      ageConfirmed: member ? true : consent.age,
      consentContact: consent.contact,
      ...(consent.onCamera ? { onCamera: consent.onCamera } : {}),
      ...(captcha ? { turnstileToken: captcha } : {}),
    });
    setBusy(false);
    if (r.ok) {
      track('form_submitted', { form: 'report', category });
      setDone({ ...r.data, rail: money.rail });
      return;
    }
    track('form_failed', { form: 'report', kind: r.kind });
    setFailure(
      r.kind === 'invalid' ? r.message || t.review.incomplete : r.message || en.forms.serverError,
    );
  }

  // ---------- files ----------

  async function addFiles(list: File[]) {
    setFileNote(null);
    const d = await ensureDraft();
    if (!d) return;
    const room =
      MAX_FILES_PER_REPORT -
      media.filter((m) => m.uploadStatus !== 'rejected').length -
      locals.length;
    if (list.length > room) setFileNote(t.receipts.countError);
    for (const file of list.slice(0, Math.max(0, room))) {
      const problem = checkFile(file);
      if (problem) {
        const kind = kindForMime(mimeOf(file));
        setFileNote(
          problem === 'type'
            ? t.receipts.typeError(file.name)
            : t.receipts.sizeError(
                file.name,
                Math.round((kind ? MEDIA_RULES[kind].maxBytes : 0) / 1024 / 1024),
              ),
        );
        continue;
      }
      void sendFile(d.id, file, file.name, {});
    }
  }

  async function sendFile(
    reportId: string,
    blob: Blob,
    name: string,
    opts: { voiceNote?: boolean; redacted?: boolean; durationSeconds?: number },
    mimeOverride?: string,
  ) {
    const key = `${Date.now()}-${Math.random()}`;
    setLocals((l) => [...l, { key, name, status: 'queued', pct: 0 }]);
    const mime = mimeOverride ?? (blob instanceof File ? mimeOf(blob) : blob.type);
    const body = opts.redacted || opts.voiceNote ? blob : await stripOnDevice(blob, mime);
    const sendMime = body === blob ? mime : body.type || mime;
    const r = await uploadEvidence(reportId, body, sendMime, opts, (pct) =>
      setLocals((l) => l.map((x) => (x.key === key ? { ...x, status: 'uploading', pct } : x))),
    );
    if (r.ok) {
      setLocals((l) => l.filter((x) => x.key !== key));
      setMedia((m) => [...m, r.media]);
      setNames((n) => ({ ...n, [r.media.id]: name }));
    } else {
      setLocals((l) =>
        l.map((x) =>
          x.key === key ? { ...x, status: 'error', error: r.message || t.receipts.failed } : x,
        ),
      );
    }
  }

  async function removeMedia(id: string) {
    if (!draft) return;
    const r = await requestJson('DELETE', `/api/reports/${draft.id}/media/${id}`);
    if (r.ok) setMedia((m) => m.filter((x) => x.id !== id));
  }

  // ---------- render ----------

  if (loading) {
    return (
      <div className="report" aria-busy="true">
        <p className="muted" role="status">
          {t.loadingDraft}
        </p>
        <SkeletonBlock height={320} />
      </div>
    );
  }

  if (done) {
    return <ReportDone result={done} member={Boolean(member)} headingRef={headingRef} />;
  }

  const err = (k: string) => errors[k] ?? null;
  const stepName = t.steps[step - 1]!;
  const errCount = Object.keys(errors).length;

  const nav = (
    <div className="report__nav">
      {step > 1 && (
        <Button variant="secondary" onClick={back} disabled={busy}>
          {t.back}
        </Button>
      )}
      {step < 7 && (
        <Button type="submit" loading={busy} loadingLabel={t.saving}>
          {t.next}
        </Button>
      )}
    </div>
  );

  let body: ReactNode;
  switch (step) {
    case 1:
      body = (
        <div data-field="category">
          <RadioGroup
            legend={t.category.legend}
            description={t.category.hint}
            name="category"
            value={category}
            onChange={(v) => {
              dirty.current = true;
              setCategory(v);
            }}
            error={err('category')}
            options={CATEGORIES.map((c) => ({ value: c, label: t.category.options[c] }))}
          />
        </div>
      );
      break;
    case 2:
      body = (
        <div className="stack" data-field="who">
          <p className="muted">{t.who.hint}</p>
          {errors.who && <StatusMessage tone="error" title={errors.who} />}
          {WHO_GROUPS.map((g) => (
            <fieldset key={g.legend} className="report__group">
              <legend className="report__legend">{g.legend}</legend>
              <div className="report__grid">
                {g.fields.map((f) => (
                  <TextField
                    key={f.k}
                    name={f.k}
                    label={f.label}
                    description={f.hint}
                    type={f.type ?? 'text'}
                    inputMode={f.type === 'tel' ? 'tel' : f.type === 'url' ? 'url' : undefined}
                    autoComplete="off"
                    spellCheck={false}
                    value={who[f.k] ?? ''}
                    onChange={(e) => editWho((w) => ({ ...w, [f.k]: e.target.value }))}
                    maxLength={f.k === 'website' ? 300 : f.k === 'facebook' ? 200 : 120}
                    optional
                    optionalLabel={en.forms.optional}
                  />
                ))}
              </div>
            </fieldset>
          ))}
        </div>
      );
      break;
    case 3:
      body = (
        <div className="stack">
          <p className="muted">{t.money.hint}</p>
          <div className="report__grid">
            <div data-field="amount">
              <TextField
                name="amount"
                label={t.money.amount}
                inputMode="decimal"
                value={money.amount ?? ''}
                onChange={(e) => editMoney((m) => ({ ...m, amount: e.target.value }))}
                error={err('amount')}
                optional
                optionalLabel={en.forms.optional}
              />
            </div>
            <SelectField
              name="currency"
              label={t.money.currency}
              value={money.currency ?? 'USD'}
              onChange={(e) => editMoney((m) => ({ ...m, currency: e.target.value }))}
              options={['USD', 'CAD', 'GBP', 'EUR'].map((c) => ({ value: c, label: c }))}
            />
            <div data-field="paidOn">
              <TextField
                name="paidOn"
                type="date"
                label={t.money.paidOn}
                max={today()}
                value={money.paidOn ?? ''}
                onChange={(e) => editMoney((m) => ({ ...m, paidOn: e.target.value }))}
                error={err('paidOn')}
                optional
                optionalLabel={en.forms.optional}
              />
            </div>
            <SelectField
              name="rail"
              label={t.money.rail}
              value={money.rail ?? ''}
              onChange={(e) => editMoney((m) => ({ ...m, rail: e.target.value }))}
              placeholder={en.forms.chooseOne}
              options={PAY_RAILS.map((r) => ({ value: r, label: t.money.rails[r] }))}
              optional
              optionalLabel={en.forms.optional}
            />
          </div>
          <RadioGroup
            legend={t.money.wasDeposit}
            name="wasDeposit"
            value={money.wasDeposit ?? ''}
            onChange={(v) => editMoney((m) => ({ ...m, wasDeposit: v }))}
            options={[
              { value: 'yes', label: t.money.yes },
              { value: 'no', label: t.money.no },
            ]}
          />
          <RadioGroup
            legend={t.money.refundRequested}
            name="refundRequested"
            value={money.refundRequested ?? ''}
            onChange={(v) => editMoney((m) => ({ ...m, refundRequested: v }))}
            options={[
              { value: 'yes', label: t.money.yes },
              { value: 'no', label: t.money.no },
            ]}
          />
          {money.refundRequested === 'yes' && (
            <TextArea
              name="refundResponse"
              label={t.money.refundResponse}
              value={money.refundResponse ?? ''}
              onChange={(e) => editMoney((m) => ({ ...m, refundResponse: e.target.value }))}
              maxLength={500}
              showCount
              rows={3}
              optional
              optionalLabel={en.forms.optional}
            />
          )}
        </div>
      );
      break;
    case 4: {
      const receipts = media.filter((m) => !m.voiceNote);
      body = (
        <div className="stack" data-field="files">
          <p className="muted">{t.receipts.hint}</p>
          <p className="muted">{t.receipts.metadataNote}</p>
          <div
            className="dropzone"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (e.dataTransfer.files.length) void addFiles(Array.from(e.dataTransfer.files));
            }}
          >
            <label className="rmmm-btn rmmm-btn--secondary dropzone__btn">
              {t.receipts.choose}
              <input
                type="file"
                className="rmmm-visually-hidden"
                multiple
                accept={
                  Object.values(MEDIA_RULES)
                    .flatMap((r) => r.mimes)
                    .join(',') + ',.m4a,.heic,.heif,.mov'
                }
                onChange={(e) => {
                  if (e.target.files?.length) void addFiles(Array.from(e.target.files));
                  e.target.value = '';
                }}
                data-testid="evidence-input"
              />
            </label>
            <span className="muted">{t.receipts.dropHint}</span>
          </div>
          <div className="redact-pick">
            <label className="rmmm-btn rmmm-btn--tertiary dropzone__btn">
              {t.receipts.redact}
              <input
                type="file"
                className="rmmm-visually-hidden"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) setRedacting(f);
                  e.target.value = '';
                }}
              />
            </label>
          </div>
          {fileNote && <StatusMessage tone="warning" title={fileNote} />}
          {errors.files && <StatusMessage tone="error" title={errors.files} />}
          {receipts.length === 0 && locals.length === 0 ? (
            <p className="muted">{t.receipts.none}</p>
          ) : (
            <ul
              className="files"
              aria-label={t.receipts.fileCount(receipts.length + locals.length)}
            >
              {locals.map((l) => (
                <li key={l.key} className="files__item">
                  <span className="files__name">{l.name}</span>
                  <span className="files__status" role="status">
                    {l.status === 'queued'
                      ? t.receipts.queued
                      : l.status === 'uploading'
                        ? t.receipts.uploading(l.pct)
                        : l.error}
                  </span>
                  {l.status === 'uploading' && (
                    <progress max={100} value={l.pct} aria-label={l.name} />
                  )}
                  {l.status === 'error' && (
                    <Button
                      variant="text"
                      onClick={() => setLocals((x) => x.filter((y) => y.key !== l.key))}
                    >
                      {t.receipts.remove}
                    </Button>
                  )}
                </li>
              ))}
              {receipts.map((m, i) => {
                const name = names[m.id] ?? `${m.kind} ${i + 1}`;
                return (
                  <li key={m.id} className="files__item" data-status={m.uploadStatus}>
                    <span className="files__name">{name}</span>
                    <span className="files__status">
                      {m.uploadStatus === 'ready'
                        ? t.receipts.ready
                        : m.uploadStatus === 'rejected' || m.uploadStatus === 'failed'
                          ? `${t.receipts.rejected}. ${t.receipts.rejectReasons[m.rejectReason ?? ''] ?? ''}`
                          : t.receipts.uploaded}
                    </span>
                    <Button
                      variant="text"
                      onClick={() => removeMedia(m.id)}
                      aria-label={t.receipts.removeLabel(name)}
                    >
                      {t.receipts.remove}
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}
          <RedactionEditor
            file={redacting}
            open={redacting !== null}
            onClose={() => setRedacting(null)}
            onApply={async (blob) => {
              const name = redacting?.name ?? 'image';
              setRedacting(null);
              const d = await ensureDraft();
              if (d) void sendFile(d.id, blob, name, { redacted: true }, 'image/jpeg');
            }}
          />
        </div>
      );
      break;
    }
    case 5:
      body = (
        <div className="stack">
          <div data-field="story">
            <TextArea
              name="story"
              label={t.story.label}
              description={t.story.hint}
              value={story}
              onChange={(e) => {
                dirty.current = true;
                setStory(e.target.value);
              }}
              error={err('story')}
              maxLength={STORY_MAX}
              showCount
              rows={10}
            />
          </div>
          <section className="stack" aria-labelledby="voice-title">
            <h3 id="voice-title" className="report__legend">
              {t.story.voiceTitle}
            </h3>
            <p className="muted">{t.story.voiceHint}</p>
            {voiceNote ? (
              <div className="voice">
                <span>{t.story.recorded(voiceNoteSeconds(voiceNote) ?? 0)}</span>
                <Button variant="text" onClick={() => removeMedia(voiceNote.id)}>
                  {t.story.discard}
                </Button>
              </div>
            ) : locals.some((l) => l.name === t.story.voiceTitle) ? (
              <p role="status" className="muted">
                {t.receipts.uploading(locals.find((l) => l.name === t.story.voiceTitle)?.pct ?? 0)}
              </p>
            ) : (
              <VoiceRecorder
                onRecorded={async (blob, mime, seconds) => {
                  const d = await ensureDraft();
                  if (d)
                    void sendFile(
                      d.id,
                      blob,
                      t.story.voiceTitle,
                      { voiceNote: true, durationSeconds: seconds },
                      mime,
                    );
                }}
              />
            )}
          </section>
        </div>
      );
      break;
    case 6:
      body = (
        <div className="stack">
          {member ? (
            <StatusMessage tone="info" title={t.you.signedInAs(member.name)} />
          ) : (
            <StatusMessage
              tone="info"
              title={t.you.anonymousTitle}
              action={<Link href="/auth?next=%2Freport">{t.you.signInInstead}</Link>}
            >
              <p>{t.you.anonymousBody}</p>
            </StatusMessage>
          )}
          <p className="muted">
            <Link href="/legal/terms">{t.you.termsLinks}</Link>
          </p>
          {!member && (
            <div data-field="age">
              <Checkbox
                name="age"
                label={`${t.you.age} (${t.you.required})`}
                checked={consent.age}
                onChange={(e) => setConsent((c) => ({ ...c, age: e.target.checked }))}
                error={err('age')}
              />
            </div>
          )}
          <div data-field="truth">
            <Checkbox
              name="truth"
              label={`${t.you.truth} (${t.you.required})`}
              checked={consent.truth}
              onChange={(e) => setConsent((c) => ({ ...c, truth: e.target.checked }))}
              error={err('truth')}
            />
          </div>
          <div data-field="terms">
            <Checkbox
              name="terms"
              label={`${t.you.terms} (${t.you.required})`}
              checked={consent.terms}
              onChange={(e) => setConsent((c) => ({ ...c, terms: e.target.checked }))}
              error={err('terms')}
            />
          </div>
          {member && (
            <Checkbox
              name="contact"
              label={t.you.contact}
              description={t.you.contactHint}
              checked={consent.contact}
              onChange={(e) => setConsent((c) => ({ ...c, contact: e.target.checked }))}
            />
          )}
          <RadioGroup
            legend={t.you.onCameraLegend}
            name="onCamera"
            value={consent.onCamera}
            onChange={(v) => setConsent((c) => ({ ...c, onCamera: v }))}
            options={ON_CAMERA.map((o) => ({ value: o, label: t.you.onCamera[o] }))}
          />
        </div>
      );
      break;
    case 7: {
      const whoList = Object.entries(clean(who)) as [keyof WhoStep, string][];
      const labels = Object.fromEntries(
        WHO_GROUPS.flatMap((g) => g.fields.map((f) => [f.k, f.label])),
      );
      const receipts = media.filter((m) => !m.voiceNote && m.uploadStatus !== 'rejected');
      const row = (s: Step, title: string, content: ReactNode) => (
        <section className="review__section" aria-labelledby={`review-${s}`}>
          <div className="review__head">
            <h3 id={`review-${s}`}>{title}</h3>
            <Button variant="text" onClick={() => goTo(s)} aria-label={`${t.edit}: ${title}`}>
              {t.edit}
            </Button>
          </div>
          {content}
        </section>
      );
      body = (
        <div className="stack">
          <p className="muted">{t.review.hint}</p>
          {row(
            1,
            t.steps[0]!,
            <p>
              {category
                ? t.category.options[category as (typeof CATEGORIES)[number]]
                : t.review.nothing}
            </p>,
          )}
          {row(
            2,
            t.steps[1]!,
            <dl className="review__list">
              {whoList.map(([k, v]) => (
                <div key={k}>
                  <dt>{labels[k]}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
            </dl>,
          )}
          {row(
            3,
            t.steps[2]!,
            <dl className="review__list">
              <div>
                <dt>{t.money.amount}</dt>
                <dd>
                  {money.amount ? `${money.amount} ${money.currency ?? 'USD'}` : t.review.nothing}
                </dd>
              </div>
              <div>
                <dt>{t.money.paidOn}</dt>
                <dd>{money.paidOn || t.review.nothing}</dd>
              </div>
              <div>
                <dt>{t.money.rail}</dt>
                <dd>
                  {money.rail
                    ? t.money.rails[money.rail as (typeof PAY_RAILS)[number]]
                    : t.review.nothing}
                </dd>
              </div>
              <div>
                <dt>{t.money.wasDeposit}</dt>
                <dd>
                  {money.wasDeposit ? t.money[money.wasDeposit as 'yes' | 'no'] : t.review.nothing}
                </dd>
              </div>
              <div>
                <dt>{t.money.refundRequested}</dt>
                <dd>
                  {money.refundRequested
                    ? t.money[money.refundRequested as 'yes' | 'no']
                    : t.review.nothing}
                </dd>
              </div>
            </dl>,
          )}
          {row(
            4,
            t.steps[3]!,
            <p>{receipts.length ? t.receipts.fileCount(receipts.length) : t.review.nothing}</p>,
          )}
          {row(
            5,
            t.steps[4]!,
            <>
              <p className="review__story">{story || t.review.nothing}</p>
              {voiceNote && <p className="muted">{t.review.voiceNote}</p>}
            </>,
          )}
          {row(
            6,
            t.steps[5]!,
            <ul className="review__consents">
              <li>{t.you.truth}</li>
              <li>{t.you.terms}</li>
              {consent.contact && member && <li>{t.you.contact}</li>}
              {consent.onCamera && (
                <li>{t.you.onCamera[consent.onCamera as (typeof ON_CAMERA)[number]]}</li>
              )}
            </ul>,
          )}
          <Turnstile siteKey={publicEnv.turnstileSiteKey} onToken={setCaptcha} />
          <div className="report__nav">
            <Button variant="secondary" onClick={back} disabled={busy}>
              {t.back}
            </Button>
            <Button
              onClick={submit}
              loading={busy}
              loadingLabel={t.review.sending}
              disabled={!!publicEnv.turnstileSiteKey && !captcha}
            >
              {t.review.submit}
            </Button>
          </div>
        </div>
      );
      break;
    }
  }

  return (
    <div className="report">
      <div className="report__top">
        <p className="report__progress" aria-live="polite">
          {step <= TOTAL ? t.stepOf(step, TOTAL) : t.steps[6]}
        </p>
        <span className="report__save" role="status" aria-live="polite">
          {save === 'saving'
            ? t.saving
            : save === 'saved'
              ? t.saved
              : save === 'error'
                ? t.notSaved
                : ''}
        </span>
        <Button
          variant="secondary"
          className="report__exit"
          onClick={quickExit}
          title={t.quickExitHint}
        >
          {t.quickExit}
        </Button>
      </div>
      <ol className="report__steps" aria-label={t.title}>
        {t.steps.slice(0, TOTAL).map((name, i) => (
          <li
            key={name}
            aria-current={i + 1 === step ? 'step' : undefined}
            data-done={i + 1 < step ? '' : undefined}
          >
            {name}
          </li>
        ))}
      </ol>
      {!available && <StatusMessage tone="warning" title={t.unavailable} />}
      {resumed && step < 7 && <StatusMessage tone="info" title={t.resumed} />}
      {(failure || errCount > 0) && (
        <StatusMessage tone="error" title={failure ?? en.forms.fixErrors(errCount)} />
      )}
      <form className="report__form stack" onSubmit={next} noValidate>
        <h2 ref={headingRef} tabIndex={-1} className="report__title">
          {stepName}
        </h2>
        {body}
        {step < 7 && nav}
      </form>
    </div>
  );
}

function voiceNoteSeconds(m: MediaView): number | null {
  return m.durationMs ? Math.round(m.durationMs / 1000) : null;
}
