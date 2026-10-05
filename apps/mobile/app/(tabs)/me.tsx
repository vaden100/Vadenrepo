import { Text } from 'react-native';
import { router } from 'expo-router';
import { Button, CardSkeleton, en, nativeFonts, useTheme } from '@rmmm/ui/native';
import { Screen } from '@/components/Screen';
import { useSession } from '@/lib/session';
import { supabase } from '@/lib/supabase';

export default function MeScreen() {
  const t = useTheme();
  const { ready, session, profile, onboarded } = useSession();

  if (!ready) {
    return (
      <Screen title={en.account.title}>
        <CardSkeleton />
      </Screen>
    );
  }

  if (!session) {
    return (
      <Screen title={en.account.title} lede={en.auth.lede}>
        <Button onPress={() => router.push('/auth')}>{en.account.signIn}</Button>
      </Screen>
    );
  }

  if (!onboarded) {
    return (
      <Screen title={en.onboarding.title} lede={en.onboarding.lede}>
        <Button onPress={() => router.push('/onboarding')}>{en.common.continue}</Button>
      </Screen>
    );
  }

  const who = session.user.email ?? session.user.phone ?? session.user.id;
  return (
    <Screen title={en.account.title}>
      <Text style={{ color: t.text, fontFamily: nativeFonts.body, fontSize: 16 }}>
        {en.account.signedInAs(who)}
      </Text>
      {profile && (
        <Text style={{ color: t.textMuted, fontFamily: nativeFonts.mono, fontSize: 13 }}>
          {en.account.role(profile.role)}
        </Text>
      )}
      <Button variant="secondary" onPress={() => supabase()?.auth.signOut()}>
        {en.auth.signOut}
      </Button>
    </Screen>
  );
}
