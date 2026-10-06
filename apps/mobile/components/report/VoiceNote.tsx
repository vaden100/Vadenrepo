import { useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
} from 'expo-audio';
import { VOICE_NOTE_MAX_SECONDS } from '@rmmm/api';
import { space } from '@rmmm/tokens';
import { Button, en, nativeFonts, useTheme } from '@rmmm/ui/native';
import { Note } from './Controls';

const t = en.report.story;

/** 60-second voice note (SPEC 4.1 step 5). m4a; stops itself at the limit. */
export function VoiceNote({ onRecorded }: { onRecorded: (uri: string, seconds: number) => void }) {
  const theme = useTheme();
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [denied, setDenied] = useState(false);
  const started = useRef(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearInterval(timer.current);
    },
    [],
  );

  const stop = async () => {
    if (timer.current) clearInterval(timer.current);
    await recorder.stop();
    setRecording(false);
    const secs = Math.min(
      VOICE_NOTE_MAX_SECONDS,
      Math.max(1, Math.round((Date.now() - started.current) / 1000)),
    );
    if (recorder.uri) onRecorded(recorder.uri, secs);
  };

  const start = async () => {
    const perm = await requestRecordingPermissionsAsync();
    if (!perm.granted) return setDenied(true);
    await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
    await recorder.prepareToRecordAsync();
    recorder.record();
    started.current = Date.now();
    setSeconds(0);
    setRecording(true);
    timer.current = setInterval(() => {
      const s = Math.floor((Date.now() - started.current) / 1000);
      setSeconds(s);
      if (s >= VOICE_NOTE_MAX_SECONDS) void stop();
    }, 250);
  };

  return (
    <View style={{ gap: space[3] }}>
      {recording ? (
        <>
          <Text
            accessibilityLiveRegion="polite"
            style={{ color: theme.text, fontFamily: nativeFonts.bodyStrong }}
          >
            {t.recording(Math.min(seconds, VOICE_NOTE_MAX_SECONDS))}
          </Text>
          <Button variant="secondary" onPress={stop}>
            {t.stop}
          </Button>
        </>
      ) : (
        <Button variant="secondary" onPress={start}>
          {t.record}
        </Button>
      )}
      {denied && <Note tone="warning">{t.micDenied}</Note>}
    </View>
  );
}
