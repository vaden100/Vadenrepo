import { useState } from 'react';
import { router } from 'expo-router';
import { OtpCode, parseOtpTarget, type OtpTarget } from '@rmmm/api';
import { Button, en } from '@rmmm/ui/native';
import { Field, FormError } from '@/components/Field';
import { Screen } from '@/components/Screen';
import { supabase } from '@/lib/supabase';

export default function AuthScreen() {
  const sb = supabase();
  const [contact, setContact] = useState('');
  const [target, setTarget] = useState<OtpTarget | null>(null);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!sb) return <Screen title={en.auth.title} lede={en.auth.notConfigured} />;

  async function sendCode() {
    setError(null);
    const t = parseOtpTarget(contact);
    if (!t) return setError(en.auth.invalidContact);
    setBusy(true);
    const { error: err } =
      t.kind === 'email'
        ? await sb!.auth.signInWithOtp({ email: t.email })
        : await sb!.auth.signInWithOtp({ phone: t.phone });
    setBusy(false);
    if (err) return setError(en.common.tryAgain);
    setTarget(t);
  }

  async function verify() {
    setError(null);
    if (!target || !OtpCode.safeParse(code).success) return setError(en.auth.invalidCode);
    setBusy(true);
    const { error: err } =
      target.kind === 'email'
        ? await sb!.auth.verifyOtp({ email: target.email, token: code, type: 'email' })
        : await sb!.auth.verifyOtp({ phone: target.phone, token: code, type: 'sms' });
    setBusy(false);
    if (err) return setError(en.auth.invalidCode);
    router.replace('/onboarding');
  }

  if (target) {
    return (
      <Screen
        title={en.auth.title}
        lede={en.auth.codeSentTo(target.kind === 'email' ? target.email : target.phone)}
      >
        <Field
          label={en.auth.codeLabel}
          value={code}
          onChangeText={(v) => setCode(v.replace(/\D/g, '').slice(0, 6))}
          keyboardType="number-pad"
          textContentType="oneTimeCode"
          autoComplete="sms-otp"
          mono
          autoFocus
        />
        <FormError>{error}</FormError>
        <Button onPress={verify} loading={busy}>
          {en.auth.verify}
        </Button>
        <Button variant="ghost" onPress={() => setTarget(null)}>
          {en.auth.useDifferent}
        </Button>
      </Screen>
    );
  }

  return (
    <Screen title={en.auth.title} lede={en.auth.lede}>
      <Field
        label={en.auth.contactLabel}
        hint={en.auth.contactHint}
        value={contact}
        onChangeText={setContact}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        textContentType="username"
      />
      <FormError>{error}</FormError>
      <Button onPress={sendCode} loading={busy}>
        {en.auth.sendCode}
      </Button>
    </Screen>
  );
}
