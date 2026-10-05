import { useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import { isAdult, TERMS_VERSION } from '@rmmm/api';
import { colors, space, touchTarget } from '@rmmm/tokens';
import { Button, en, nativeFonts, useTheme } from '@rmmm/ui/native';
import { Field, FormError } from '@/components/Field';
import { Screen } from '@/components/Screen';
import { useSession } from '@/lib/session';
import { supabase } from '@/lib/supabase';

const WEB = process.env.EXPO_PUBLIC_WEB_URL;

/** SPEC 12: 18+ age gate (neutral date entry, not stored) + terms acceptance. */
export default function OnboardingScreen() {
  const t = useTheme();
  const { refreshProfile } = useSession();
  const [mm, setMm] = useState('');
  const [dd, setDd] = useState('');
  const [yyyy, setYyyy] = useState('');
  const [terms, setTerms] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [under18, setUnder18] = useState(false);

  if (under18)
    return <Screen title={en.onboarding.under18Title} lede={en.onboarding.under18Body} />;

  async function submit() {
    setError(null);
    const birth = `${yyyy.padStart(4, '0')}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
    const adult = isAdult(birth);
    if (adult === null) return setError(en.onboarding.invalidDate);
    if (!terms) return setError(en.onboarding.termsRequired);
    const sb = supabase();
    if (!sb) return setError(en.auth.notConfigured);
    setBusy(true);
    const { data: ok, error: ageErr } = await sb.rpc('confirm_age', { birth_date: birth });
    if (ageErr) {
      setBusy(false);
      return setError(en.common.tryAgain);
    }
    if (ok === false || adult === false) {
      await sb.auth.signOut();
      setBusy(false);
      return setUnder18(true);
    }
    const { error: termsErr } = await sb.rpc('accept_terms', { version: TERMS_VERSION });
    setBusy(false);
    if (termsErr) return setError(en.common.tryAgain);
    await refreshProfile();
    router.replace('/me');
  }

  return (
    <Screen title={en.onboarding.title} lede={en.onboarding.lede}>
      <View style={styles.dob} accessibilityLabel={en.onboarding.birthDateLabel}>
        <Field
          label={en.onboarding.month}
          value={mm}
          onChangeText={(v) => setMm(v.replace(/\D/g, '').slice(0, 2))}
          keyboardType="number-pad"
          style={styles.short}
        />
        <Field
          label={en.onboarding.day}
          value={dd}
          onChangeText={(v) => setDd(v.replace(/\D/g, '').slice(0, 2))}
          keyboardType="number-pad"
          style={styles.short}
        />
        <Field
          label={en.onboarding.year}
          value={yyyy}
          onChangeText={(v) => setYyyy(v.replace(/\D/g, '').slice(0, 4))}
          keyboardType="number-pad"
          style={styles.long}
        />
      </View>
      <Text style={[styles.hint, { color: t.textMuted }]}>{en.onboarding.birthDateHint}</Text>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: terms }}
        onPress={() => setTerms((v) => !v)}
        style={styles.check}
      >
        <View
          style={[
            styles.box,
            { borderColor: t.text },
            terms && { backgroundColor: colors.stampRed, borderColor: colors.stampRed },
          ]}
        >
          {terms && (
            <Svg
              width={18}
              height={18}
              viewBox="0 0 24 24"
              fill="none"
              stroke={colors.paper}
              strokeWidth={3}
              strokeLinecap="square"
            >
              <Path d="M5 12l4 4 10-10" />
            </Svg>
          )}
        </View>
        <Text style={[styles.checkLabel, { color: t.text }]}>{en.onboarding.termsLabel}</Text>
      </Pressable>
      {WEB && (
        <Button variant="ghost" onPress={() => Linking.openURL(`${WEB}/legal/terms`)}>
          {en.onboarding.termsLinks}
        </Button>
      )}
      <FormError>{error}</FormError>
      <Button onPress={submit} loading={busy}>
        {en.onboarding.submit}
      </Button>
    </Screen>
  );
}

const styles = StyleSheet.create({
  dob: { flexDirection: 'row', gap: space[3] },
  short: { width: 64 },
  long: { width: 96 },
  hint: { fontFamily: nativeFonts.body, fontSize: 14, lineHeight: 20 },
  check: { flexDirection: 'row', gap: space[3], alignItems: 'center', minHeight: touchTarget },
  box: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderRadius: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkLabel: { flex: 1, fontFamily: nativeFonts.body, fontSize: 16, lineHeight: 24 },
});
