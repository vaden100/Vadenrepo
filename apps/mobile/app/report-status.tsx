import { useEffect, useState } from 'react';
import { Text } from 'react-native';
import type { ReportStatusView } from '@rmmm/api';
import { Button, en, nativeFonts, useTheme } from '@rmmm/ui/native';
import { Field, FormError } from '@/components/Field';
import { Note } from '@/components/report/Controls';
import { Screen } from '@/components/Screen';
import { api, claimToken } from '@/lib/api';

const t = en.report.status;

/** Check an anonymous report with case code + claim code (SPEC 4.1). */
export default function ReportStatusScreen() {
  const theme = useTheme();
  const [view, setView] = useState<ReportStatusView | null>(null);
  const [code, setCode] = useState('');
  const [claim, setClaim] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // The claim saved on this phone after submitting shows straight away.
  useEffect(() => {
    api<{ report: ReportStatusView | null }>('GET', '/api/reports/claim').then((r) => {
      if (r.ok && r.data.report) setView(r.data.report);
    });
  }, []);

  async function check() {
    const c = code.trim().toUpperCase();
    const k = claim.trim().toUpperCase();
    if (!/^RMMM-\d{2}-\d{4,}$/.test(c) || !/^[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$/.test(k))
      return setError(t.formatError);
    setBusy(true);
    setError(null);
    const r = await api<ReportStatusView>('POST', '/api/reports/claim', { code: c, claim: k });
    setBusy(false);
    if (!r.ok)
      return setError(
        r.status === 404 || r.status === 422 ? t.notFound : r.message || en.forms.networkError,
      );
    await claimToken.set(`${r.data.id}.${k}`);
    setView(r.data);
  }

  return (
    <Screen title={t.title} lede={t.lede}>
      {view && (
        <>
          <Text
            accessibilityRole="header"
            selectable
            style={{ color: theme.text, fontFamily: nativeFonts.monoStrong, fontSize: 24 }}
          >
            {view.code}
          </Text>
          <Note>{t.states[view.status] ?? view.status}</Note>
          <Text style={{ color: theme.textSecondary, fontFamily: nativeFonts.body }}>
            {t.files(view.files)}
            {view.filesProcessing > 0 ? `. ${t.processing(view.filesProcessing)}` : ''}
          </Text>
        </>
      )}
      <FormError>{error}</FormError>
      <Field
        label={t.code}
        hint={t.codeHint}
        autoCapitalize="characters"
        autoCorrect={false}
        value={code}
        onChangeText={setCode}
        mono
      />
      <Field
        label={t.claim}
        hint={t.claimHint}
        autoCapitalize="characters"
        autoCorrect={false}
        value={claim}
        onChangeText={setClaim}
        mono
      />
      <Button onPress={check} loading={busy}>
        {t.submit}
      </Button>
    </Screen>
  );
}
