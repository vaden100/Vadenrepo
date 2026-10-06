import { useCallback, useEffect, useRef, useState } from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as DocumentPicker from 'expo-document-picker';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import {
  CATEGORIES,
  hasIdentifier,
  kindForMime,
  MAX_FILES_PER_REPORT,
  MEDIA_RULES,
  ON_CAMERA,
  PAY_RAILS,
  STORY_MAX,
  STORY_MIN,
  type CurrentDraft,
  type MediaView,
  type MoneyStep,
  type RedactBox,
  type ReportDraftView,
  type SubmitResult,
  type WhoStep,
} from '@rmmm/api';
import { radius, space } from '@rmmm/tokens';
import { Button, en, nativeFonts, Stamp, useTheme } from '@rmmm/ui/native';
import { Field, FormError } from '@/components/Field';
import { Check, Choice, Note } from '@/components/report/Controls';
import { Redactor } from '@/components/report/Redactor';
import { VoiceNote } from '@/components/report/VoiceNote';
import { Screen } from '@/components/Screen';
import { api, claimToken, draftToken, uploadFile, WEB_URL } from '@/lib/api';
import { useSession } from '@/lib/session';

const t = en.report;
const TOTAL = 6;
type Who = Partial<Record<keyof WhoStep, string>>;
type Money = Partial<Record<keyof MoneyStep, string>>;
interface Pending {
  key: string;
  name: string;
  failed?: boolean;
}

const WHO_FIELDS: {
  k: keyof WhoStep;
  label: string;
  keyboard?: 'phone-pad' | 'url' | 'email-address';
}[] = [
  { k: 'businessName', label: t.who.businessName },
  { k: 'instagram', label: t.who.instagram },
  { k: 'tiktok', label: t.who.tiktok },
  { k: 'facebook', label: t.who.facebook },
  { k: 'x', label: t.who.x },
  { k: 'phone', label: t.who.phone, keyboard: 'phone-pad' },
  { k: 'website', label: t.who.website, keyboard: 'url' },
  { k: 'cashtag', label: t.who.cashtag },
  { k: 'zelle', label: t.who.zelle },
  { k: 'venmo', label: t.who.venmo },
  { k: 'paypal', label: t.who.paypal },
  { k: 'appleCash', label: t.who.appleCash },
  { k: 'city', label: t.who.city },
  { k: 'state', label: t.who.state },
];

const clean = <T extends Record<string, string | undefined>>(o: T) =>
  Object.fromEntries(Object.entries(o).filter(([, v]) => v && v.trim())) as T;

/** Re-encode a photo on the device, which drops EXIF/GPS before upload (the worker cleans again). */
async function stripPhoto(uri: string): Promise<string> {
  try {
    const img = await ImageManipulator.manipulate(uri).renderAsync();
    const out = await img.saveAsync({ format: SaveFormat.JPEG, compress: 0.9 });
    return out.uri;
  } catch {
    return uri;
  }
}

/**
 * Submit a story on the phone (SPEC 4.1): same steps, rules and API as the website. Drafts
 * are saved to the server as you go; an anonymous draft's token lives in the keychain.
 */
export default function ReportScreen() {
  const theme = useTheme();
  const { session, onboarded } = useSession();
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<ReportDraftView | null>(null);
  const [step, setStep] = useState(1);
  const [category, setCategory] = useState('');
  const [who, setWho] = useState<Who>({});
  const [money, setMoney] = useState<Money>({ currency: 'USD' });
  const [story, setStory] = useState('');
  const [media, setMedia] = useState<MediaView[]>([]);
  const [pending, setPending] = useState<Pending[]>([]);
  const [consent, setConsent] = useState({
    age: false,
    truth: false,
    terms: false,
    contact: false,
    onCamera: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [failure, setFailure] = useState<string | null>(null);
  const [saved, setSaved] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<SubmitResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [redacting, setRedacting] = useState<{
    uri: string;
    width: number;
    height: number;
    name: string;
  } | null>(null);
  const draftRef = useRef<ReportDraftView | null>(null);
  useEffect(() => {
    draftRef.current = draft;
  }, [draft]);
  const member = Boolean(session && onboarded);

  const load = useCallback((d: ReportDraftView) => {
    setDraft(d);
    setCategory(d.category ?? '');
    setWho(d.who as Who);
    setMoney({ currency: 'USD', ...(d.money as Money) });
    setStory(d.story);
    setMedia(d.media);
    setStep(Math.min(Math.max(d.step, 1), 7));
  }, []);

  useEffect(() => {
    api<CurrentDraft>('GET', '/api/reports/current').then((r) => {
      if (r.ok && r.data.draft) load(r.data.draft);
      setLoading(false);
    });
  }, [load]);

  const ensureDraft = async (): Promise<ReportDraftView | null> => {
    if (draftRef.current) return draftRef.current;
    const r = await api<ReportDraftView & { draftToken?: string }>(
      'POST',
      '/api/reports',
      category ? { category } : {},
    );
    if (!r.ok) {
      setFailure(r.message || en.forms.networkError);
      return null;
    }
    if (r.data.draftToken) await draftToken.set(r.data.draftToken);
    draftRef.current = r.data;
    setDraft(r.data);
    return r.data;
  };

  const persist = async (nextStep?: number) => {
    const d = await ensureDraft();
    if (!d) return false;
    setSaved('saving');
    const r = await api<ReportDraftView>('PATCH', `/api/reports/${d.id}`, {
      ...(category ? { category } : {}),
      who: clean(who),
      money: { ...clean(money), currency: money.currency ?? 'USD' },
      story,
      ...(nextStep ? { step: nextStep } : {}),
    });
    setSaved(r.ok ? 'saved' : 'error');
    if (r.ok) setMedia(r.data.media);
    return r.ok;
  };

  // Refresh file status while the worker cleans uploads.
  const processing = media.some(
    (m) => m.uploadStatus === 'uploaded' || m.uploadStatus === 'processing',
  );
  useEffect(() => {
    if (!draft || !processing) return;
    const id = setInterval(async () => {
      const r = await api<{ media: MediaView[] }>('GET', `/api/reports/${draft.id}/media`);
      if (r.ok) setMedia(r.data.media);
    }, 3000);
    return () => clearInterval(id);
  }, [draft, processing]);

  const voice = media.find((m) => m.voiceNote && m.uploadStatus !== 'rejected');

  function validate(s: number) {
    const e: Record<string, string> = {};
    if (s === 1 && !category) e.category = t.category.error;
    if (s === 2 && !hasIdentifier(who as Partial<WhoStep>)) e.who = t.who.error;
    if (s === 3 && money.amount && !/^\d{1,7}(\.\d{1,2})?$/.test(money.amount.trim()))
      e.amount = t.money.amountError;
    if (s === 4 && pending.some((p) => !p.failed)) e.files = t.receipts.waitForUploads;
    if (s === 5 && story.trim().length < STORY_MIN && !voice) e.story = t.story.error;
    if (s === 6) {
      if (!member && !consent.age) e.age = t.you.ageError;
      if (!consent.truth) e.truth = t.you.truthError;
      if (!consent.terms) e.terms = t.you.termsError;
    }
    return e;
  }

  async function next() {
    const e = validate(step);
    setErrors(e);
    if (Object.keys(e).length) return setFailure(en.forms.fixErrors(Object.keys(e).length));
    setFailure(null);
    setBusy(true);
    const ok = step === 6 ? true : await persist(step + 1);
    setBusy(false);
    if (ok) setStep(step + 1);
    else setFailure(en.forms.networkError);
  }

  async function send(
    uri: string,
    mime: string,
    bytes: number,
    name: string,
    opts: { voiceNote?: boolean; durationSeconds?: number; redactBoxes?: RedactBox[] } = {},
  ) {
    const d = await ensureDraft();
    if (!d) return;
    const key = `${Date.now()}-${name}`;
    setPending((p) => [...p, { key, name }]);
    const slot = await api<{
      media: MediaView;
      upload: { url: string; headers: Record<string, string> };
    }>('POST', `/api/reports/${d.id}/media`, { mime, bytes, ...opts });
    const ok =
      slot.ok &&
      (await uploadFile(slot.data.upload, uri)) &&
      (await api('POST', `/api/reports/${d.id}/media/${slot.data.media.id}/complete`, {})).ok;
    if (ok && slot.ok) {
      setPending((p) => p.filter((x) => x.key !== key));
      const r = await api<{ media: MediaView[] }>('GET', `/api/reports/${d.id}/media`);
      if (r.ok) setMedia(r.data.media);
    } else {
      setPending((p) => p.map((x) => (x.key === key ? { ...x, failed: true } : x)));
    }
  }

  const room = () =>
    MAX_FILES_PER_REPORT -
    media.filter((m) => m.uploadStatus !== 'rejected').length -
    pending.length;

  async function pickPhotos() {
    const r = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      allowsMultipleSelection: true,
      exif: false,
      quality: 1,
    });
    if (r.canceled) return;
    for (const a of r.assets.slice(0, Math.max(0, room()))) {
      const mime = a.mimeType ?? (a.type === 'video' ? 'video/mp4' : 'image/jpeg');
      const kind = kindForMime(mime);
      if (!kind) {
        setFailure(t.receipts.typeError(a.fileName ?? mime));
        continue;
      }
      if (kind === 'image') {
        const uri = await stripPhoto(a.uri);
        await send(uri, 'image/jpeg', a.fileSize ?? 1, a.fileName ?? 'photo.jpg');
      } else {
        if ((a.fileSize ?? 0) > MEDIA_RULES[kind].maxBytes) {
          setFailure(
            t.receipts.sizeError(
              a.fileName ?? 'video',
              Math.round(MEDIA_RULES[kind].maxBytes / 1048576),
            ),
          );
          continue;
        }
        await send(a.uri, mime, a.fileSize ?? 1, a.fileName ?? 'video', {
          durationSeconds: a.duration ? a.duration / 1000 : undefined,
        });
      }
    }
  }

  async function pickToCover() {
    const r = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      exif: false,
      quality: 1,
    });
    if (r.canceled || !r.assets[0]) return;
    const a = r.assets[0];
    const uri = await stripPhoto(a.uri);
    setRedacting({ uri, width: a.width, height: a.height, name: a.fileName ?? 'photo.jpg' });
  }

  async function pickFiles() {
    const r = await DocumentPicker.getDocumentAsync({
      multiple: true,
      copyToCacheDirectory: true,
      type: ['application/pdf', ...MEDIA_RULES.audio.mimes, ...MEDIA_RULES.video.mimes],
    });
    if (r.canceled) return;
    for (const a of r.assets.slice(0, Math.max(0, room()))) {
      const mime = a.mimeType ?? '';
      const kind = kindForMime(mime);
      if (!kind) {
        setFailure(t.receipts.typeError(a.name));
        continue;
      }
      if ((a.size ?? 0) > MEDIA_RULES[kind].maxBytes) {
        setFailure(t.receipts.sizeError(a.name, Math.round(MEDIA_RULES[kind].maxBytes / 1048576)));
        continue;
      }
      await send(a.uri, mime, a.size ?? 1, a.name);
    }
  }

  async function remove(id: string) {
    if (!draft) return;
    const r = await api('DELETE', `/api/reports/${draft.id}/media/${id}`);
    if (r.ok) setMedia((m) => m.filter((x) => x.id !== id));
  }

  async function submit() {
    if (!draft || busy) return;
    for (const s of [1, 2, 3, 4, 5, 6]) {
      const e = validate(s);
      if (Object.keys(e).length) {
        setErrors(e);
        setStep(s);
        return setFailure(t.review.incomplete);
      }
    }
    setBusy(true);
    setFailure(null);
    if (!(await persist())) {
      setBusy(false);
      return setFailure(en.forms.networkError);
    }
    const r = await api<SubmitResult>('POST', `/api/reports/${draft.id}/submit`, {
      consentTruth: consent.truth,
      consentTerms: consent.terms,
      ageConfirmed: member ? true : consent.age,
      consentContact: consent.contact,
      ...(consent.onCamera ? { onCamera: consent.onCamera } : {}),
    });
    setBusy(false);
    if (!r.ok) return setFailure(r.message || en.forms.serverError);
    await draftToken.clear();
    if (r.data.claimCode) await claimToken.set(`${r.data.id}.${r.data.claimCode}`);
    setDone(r.data);
  }

  if (!WEB_URL) {
    return (
      <Screen title={t.title} lede={t.lede}>
        <Note tone="warning">{t.receipts.noWebUrl}</Note>
      </Screen>
    );
  }
  if (loading) {
    return (
      <Screen title={t.title}>
        <Note>{t.loadingDraft}</Note>
      </Screen>
    );
  }

  if (done) {
    return (
      <Screen title={t.done.title}>
        <Stamp kind="reported" animate />
        <Text style={[styles.label, { color: theme.textSecondary }]}>{t.done.caseCode}</Text>
        <Text selectable style={[styles.code, { color: theme.text }]}>
          {done.code}
        </Text>
        {done.claimCode && (
          <>
            <Text style={[styles.label, { color: theme.textSecondary }]}>{t.done.claimCode}</Text>
            <Text selectable style={[styles.code, { color: theme.text }]}>
              {done.claimCode}
            </Text>
            <Note tone="warning">{t.done.claimWarning}</Note>
          </>
        )}
        <Button
          variant="secondary"
          onPress={async () => {
            await Clipboard.setStringAsync(
              done.claimCode ? `${done.code} ${done.claimCode}` : done.code,
            );
            setCopied(true);
          }}
        >
          {copied ? t.done.copied : done.claimCode ? t.done.copyBoth : t.done.copy}
        </Button>
        <Text accessibilityRole="header" style={[styles.h2, { color: theme.text }]}>
          {t.done.next}
        </Text>
        {t.done.nextSteps.map((s, i) => (
          <Text key={s} style={[styles.body, { color: theme.text }]}>{`${i + 1}. ${s}`}</Text>
        ))}
        <Text accessibilityRole="header" style={[styles.h2, { color: theme.text }]}>
          {t.done.alsoReport}
        </Text>
        <Button variant="ghost" onPress={() => Linking.openURL('https://reportfraud.ftc.gov/')}>
          {t.done.ftc}
        </Button>
        <Button variant="ghost" onPress={() => Linking.openURL('https://www.ic3.gov/')}>
          {t.done.ic3}
        </Button>
        <Button
          variant="ghost"
          onPress={() =>
            Linking.openURL(
              `${WEB_URL}/resources/payment-disputes${money.rail ? `#${money.rail}` : ''}`,
            )
          }
        >
          {money.rail && money.rail in t.money.rails
            ? t.done.dispute(t.money.rails[money.rail as (typeof PAY_RAILS)[number]])
            : t.done.disputeAny}
        </Button>
        <Button
          variant="secondary"
          onPress={() => {
            setDone(null);
            setDraft(null);
            setStep(1);
            setCategory('');
            setWho({});
            setMoney({ currency: 'USD' });
            setStory('');
            setMedia([]);
            setConsent({ age: false, truth: false, terms: false, contact: false, onCamera: '' });
            router.push('/report-status');
          }}
        >
          {t.done.checkStatus}
        </Button>
      </Screen>
    );
  }

  const receipts = media.filter((m) => !m.voiceNote);
  const stepName = t.steps[step - 1] ?? '';

  return (
    <Screen title={t.title}>
      <View style={styles.top}>
        <Text style={[styles.progress, { color: theme.text }]}>
          {step <= TOTAL ? t.stepOf(step, TOTAL) : t.steps[6]}
        </Text>
        <Text
          accessibilityLiveRegion="polite"
          style={[styles.label, { color: theme.textSecondary }]}
        >
          {saved === 'saving'
            ? t.saving
            : saved === 'saved'
              ? t.saved
              : saved === 'error'
                ? t.notSaved
                : ''}
        </Text>
      </View>
      <Button
        variant="secondary"
        accessibilityHint={t.quickExitHint}
        onPress={() => Linking.openURL('https://www.google.com/search?q=weather')}
      >
        {t.quickExit}
      </Button>
      <Text accessibilityRole="header" style={[styles.h2, { color: theme.text }]}>
        {stepName}
      </Text>
      <FormError>{failure}</FormError>

      {step === 1 && (
        <Choice
          label={t.category.legend}
          value={category}
          onChange={setCategory}
          error={errors.category}
          options={CATEGORIES.map((c) => ({ value: c, label: t.category.options[c] }))}
        />
      )}

      {step === 2 && (
        <>
          <Note>{t.who.hint}</Note>
          {errors.who ? <Note tone="error">{errors.who}</Note> : null}
          {WHO_FIELDS.map((f) => (
            <Field
              key={f.k}
              label={`${f.label} (${en.forms.optional})`}
              value={who[f.k] ?? ''}
              onChangeText={(v) => setWho((w) => ({ ...w, [f.k]: v }))}
              keyboardType={f.keyboard}
              autoCapitalize={
                f.k === 'businessName' || f.k === 'city' || f.k === 'state' ? 'words' : 'none'
              }
              autoCorrect={false}
              maxLength={f.k === 'website' ? 300 : 120}
            />
          ))}
        </>
      )}

      {step === 3 && (
        <>
          <Note>{t.money.hint}</Note>
          <Field
            label={`${t.money.amount} (${en.forms.optional})`}
            keyboardType="decimal-pad"
            value={money.amount ?? ''}
            onChangeText={(v) => setMoney((m) => ({ ...m, amount: v }))}
          />
          <FormError>{errors.amount ?? null}</FormError>
          <Field
            label={`${t.money.paidOn} (${en.forms.optional})`}
            hint="YYYY-MM-DD"
            value={money.paidOn ?? ''}
            onChangeText={(v) => setMoney((m) => ({ ...m, paidOn: v }))}
          />
          <Choice
            label={t.money.rail}
            value={money.rail ?? ''}
            onChange={(v) => setMoney((m) => ({ ...m, rail: v }))}
            options={PAY_RAILS.map((r) => ({ value: r, label: t.money.rails[r] }))}
          />
          <Choice
            label={t.money.wasDeposit}
            value={money.wasDeposit ?? ''}
            onChange={(v) => setMoney((m) => ({ ...m, wasDeposit: v }))}
            options={[
              { value: 'yes', label: t.money.yes },
              { value: 'no', label: t.money.no },
            ]}
          />
          <Choice
            label={t.money.refundRequested}
            value={money.refundRequested ?? ''}
            onChange={(v) => setMoney((m) => ({ ...m, refundRequested: v }))}
            options={[
              { value: 'yes', label: t.money.yes },
              { value: 'no', label: t.money.no },
            ]}
          />
          {money.refundRequested === 'yes' && (
            <Field
              label={`${t.money.refundResponse} (${en.forms.optional})`}
              multiline
              value={money.refundResponse ?? ''}
              onChangeText={(v) => setMoney((m) => ({ ...m, refundResponse: v }))}
              maxLength={500}
            />
          )}
        </>
      )}

      {step === 4 && (
        <>
          <Note>{t.receipts.hint}</Note>
          <Note>{t.receipts.metadataNote}</Note>
          <Button variant="secondary" onPress={pickPhotos}>
            {t.receipts.choosePhotos}
          </Button>
          <Button variant="secondary" onPress={pickFiles}>
            {t.receipts.chooseFiles}
          </Button>
          <Button variant="secondary" onPress={pickToCover}>
            {t.receipts.redact}
          </Button>
          {errors.files ? <Note tone="error">{errors.files}</Note> : null}
          {receipts.length === 0 && pending.length === 0 ? <Note>{t.receipts.none}</Note> : null}
          {pending.map((p) => (
            <View key={p.key} style={[styles.file, { borderColor: theme.border }]}>
              <Text style={[styles.mono, { color: theme.text }]}>{p.name}</Text>
              <Text
                accessibilityLiveRegion="polite"
                style={[styles.label, { color: theme.textSecondary }]}
              >
                {p.failed ? t.receipts.failed : t.receipts.queued}
              </Text>
            </View>
          ))}
          {receipts.map((m, i) => (
            <View key={m.id} style={[styles.file, { borderColor: theme.border }]}>
              <Text style={[styles.mono, { color: theme.text }]}>{`${m.kind} ${i + 1}`}</Text>
              <Text style={[styles.label, { color: theme.textSecondary }]}>
                {m.uploadStatus === 'ready'
                  ? t.receipts.ready
                  : m.uploadStatus === 'rejected' || m.uploadStatus === 'failed'
                    ? `${t.receipts.rejected}. ${t.receipts.rejectReasons[m.rejectReason ?? ''] ?? ''}`
                    : t.receipts.uploaded}
              </Text>
              <Button variant="ghost" onPress={() => remove(m.id)}>
                {t.receipts.remove}
              </Button>
            </View>
          ))}
        </>
      )}

      {step === 5 && (
        <>
          <Field
            label={t.story.label}
            hint={t.story.hint}
            multiline
            value={story}
            onChangeText={setStory}
            maxLength={STORY_MAX}
            style={{ minHeight: 180, textAlignVertical: 'top', paddingTop: space[3] }}
          />
          <Text
            style={[styles.label, { color: theme.textSecondary }]}
          >{`${story.length} / ${STORY_MAX}`}</Text>
          <FormError>{errors.story ?? null}</FormError>
          <Text accessibilityRole="header" style={[styles.h3, { color: theme.text }]}>
            {t.story.voiceTitle}
          </Text>
          <Note>{t.story.voiceHint}</Note>
          {voice ? (
            <>
              <Text style={[styles.body, { color: theme.text }]}>
                {t.story.recorded(Math.round((voice.durationMs ?? 0) / 1000))}
              </Text>
              <Button variant="secondary" onPress={() => remove(voice.id)}>
                {t.story.discard}
              </Button>
            </>
          ) : pending.some((p) => p.name === t.story.voiceTitle && !p.failed) ? (
            <Note>{t.receipts.queued}</Note>
          ) : (
            <VoiceNote
              onRecorded={(uri, secs) =>
                send(uri, 'audio/mp4', 1, t.story.voiceTitle, {
                  voiceNote: true,
                  durationSeconds: secs,
                })
              }
            />
          )}
        </>
      )}

      {step === 6 && (
        <>
          {member ? (
            <Note>
              {t.you.signedInAs(session?.user.email ?? session?.user.phone ?? en.account.title)}
            </Note>
          ) : (
            <>
              <Note>{`${t.you.anonymousTitle}. ${t.you.anonymousBody}`}</Note>
              <Button variant="ghost" onPress={() => router.push('/auth')}>
                {t.you.signInInstead}
              </Button>
            </>
          )}
          <Button variant="ghost" onPress={() => Linking.openURL(`${WEB_URL}/legal/terms`)}>
            {t.you.termsLinks}
          </Button>
          {!member && (
            <Check
              label={`${t.you.age} (${t.you.required})`}
              checked={consent.age}
              onChange={(v) => setConsent((c) => ({ ...c, age: v }))}
              error={errors.age}
            />
          )}
          <Check
            label={`${t.you.truth} (${t.you.required})`}
            checked={consent.truth}
            onChange={(v) => setConsent((c) => ({ ...c, truth: v }))}
            error={errors.truth}
          />
          <Check
            label={`${t.you.terms} (${t.you.required})`}
            checked={consent.terms}
            onChange={(v) => setConsent((c) => ({ ...c, terms: v }))}
            error={errors.terms}
          />
          {member && (
            <Check
              label={t.you.contact}
              hint={t.you.contactHint}
              checked={consent.contact}
              onChange={(v) => setConsent((c) => ({ ...c, contact: v }))}
            />
          )}
          <Choice
            label={t.you.onCameraLegend}
            value={consent.onCamera}
            onChange={(v) => setConsent((c) => ({ ...c, onCamera: v }))}
            options={ON_CAMERA.map((o) => ({ value: o, label: t.you.onCamera[o] }))}
          />
        </>
      )}

      {step === 7 && (
        <>
          <Note>{t.review.hint}</Note>
          {[1, 2, 3, 4, 5, 6].map((s) => (
            <View key={s} style={[styles.review, { borderColor: theme.border }]}>
              <Text accessibilityRole="header" style={[styles.h3, { color: theme.text }]}>
                {t.steps[s - 1]}
              </Text>
              <Text style={[styles.body, { color: theme.text }]}>
                {s === 1
                  ? category
                    ? t.category.options[category as (typeof CATEGORIES)[number]]
                    : t.review.nothing
                  : s === 2
                    ? Object.values(clean(who)).join(', ') || t.review.nothing
                    : s === 3
                      ? money.amount
                        ? `${money.amount} ${money.currency ?? 'USD'}`
                        : t.review.nothing
                      : s === 4
                        ? receipts.length
                          ? t.receipts.fileCount(receipts.length)
                          : t.review.nothing
                        : s === 5
                          ? `${story || t.review.nothing}${voice ? `\n${t.review.voiceNote}` : ''}`
                          : `${t.you.truth}\n${t.you.terms}`}
              </Text>
              <Button variant="ghost" accessibilityHint={t.steps[s - 1]} onPress={() => setStep(s)}>
                {t.edit}
              </Button>
            </View>
          ))}
          <Button onPress={submit} loading={busy}>
            {t.review.submit}
          </Button>
        </>
      )}

      <View style={styles.nav}>
        {step > 1 && (
          <Button variant="secondary" onPress={() => setStep(step - 1)} disabled={busy}>
            {t.back}
          </Button>
        )}
        {step < 7 && (
          <Button onPress={next} loading={busy}>
            {t.next}
          </Button>
        )}
      </View>

      {redacting && (
        <Redactor
          uri={redacting.uri}
          width={redacting.width}
          height={redacting.height}
          onCancel={() => setRedacting(null)}
          onDone={(boxes) => {
            const r = redacting;
            setRedacting(null);
            void send(r.uri, 'image/jpeg', 1, r.name, boxes.length ? { redactBoxes: boxes } : {});
          }}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: space[3] },
  progress: { fontFamily: nativeFonts.monoStrong, fontSize: 14, letterSpacing: 1 },
  h2: { fontFamily: nativeFonts.headlineExtraBold, fontSize: 24 },
  h3: { fontFamily: nativeFonts.bodyStrong, fontSize: 18 },
  body: { fontFamily: nativeFonts.body, fontSize: 16, lineHeight: 24 },
  label: { fontFamily: nativeFonts.body, fontSize: 14 },
  mono: { fontFamily: nativeFonts.mono, fontSize: 15 },
  code: { fontFamily: nativeFonts.monoStrong, fontSize: 26 },
  file: { borderWidth: 1, borderRadius: radius.paper, padding: space[3], gap: space[1] },
  review: { borderTopWidth: 1, paddingTop: space[3], gap: space[2] },
  nav: { flexDirection: 'row', flexWrap: 'wrap', gap: space[3] },
});
