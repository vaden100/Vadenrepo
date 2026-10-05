import { useEffect } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
// Per-weight imports so only the 7 faces we use are bundled.
import { Archivo_800ExtraBold } from '@expo-google-fonts/archivo/800ExtraBold';
import { Archivo_900Black } from '@expo-google-fonts/archivo/900Black';
import { ArchivoNarrow_700Bold } from '@expo-google-fonts/archivo-narrow/700Bold';
import { IBMPlexMono_400Regular } from '@expo-google-fonts/ibm-plex-mono/400Regular';
import { IBMPlexMono_600SemiBold } from '@expo-google-fonts/ibm-plex-mono/600SemiBold';
import { IBMPlexSans_400Regular } from '@expo-google-fonts/ibm-plex-sans/400Regular';
import { IBMPlexSans_600SemiBold } from '@expo-google-fonts/ibm-plex-sans/600SemiBold';
import { en, useTheme } from '@rmmm/ui/native';
import { SessionProvider } from '@/lib/session';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  // Fonts ship inside the app bundle (self-hosted, SIL OFL). Keys must match nativeFonts.
  const [loaded, error] = useFonts({
    Archivo_800ExtraBold,
    Archivo_900Black,
    ArchivoNarrow_700Bold,
    IBMPlexSans_400Regular,
    IBMPlexSans_600SemiBold,
    IBMPlexMono_400Regular,
    IBMPlexMono_600SemiBold,
  });
  const t = useTheme();

  useEffect(() => {
    if (loaded || error) SplashScreen.hideAsync().catch(() => {});
  }, [loaded, error]);

  if (!loaded && !error) return null;

  return (
    <SessionProvider>
      <StatusBar style={t.background === '#111111' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: t.background },
          headerTintColor: t.text,
          headerTitleStyle: { fontFamily: 'Archivo_800ExtraBold' },
          contentStyle: { backgroundColor: t.background },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="styleguide" options={{ title: 'Style guide' }} />
        <Stack.Screen name="auth" options={{ title: en.auth.title }} />
        <Stack.Screen
          name="onboarding"
          options={{ title: en.onboarding.title, headerBackVisible: false }}
        />
      </Stack>
    </SessionProvider>
  );
}
