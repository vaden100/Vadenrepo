import { useState } from 'react';
import {
  Image,
  Modal,
  StyleSheet,
  Text,
  View,
  type GestureResponderEvent,
  type LayoutChangeEvent,
} from 'react-native';
import type { RedactBox } from '@rmmm/api';
import { colors, space } from '@rmmm/tokens';
import { Button, en, nativeFonts, useTheme } from '@rmmm/ui/native';

const t = en.report.redaction;

/**
 * Cover parts of a photo (SPEC 4.1 step 4). Drag to draw a box, or add one with the button.
 * Boxes are sent with the upload and painted solid black by the worker before anyone can see
 * the file; only the covered version is kept.
 */
export function Redactor({
  uri,
  width,
  height,
  onCancel,
  onDone,
}: {
  uri: string;
  width: number;
  height: number;
  onCancel: () => void;
  onDone: (boxes: RedactBox[]) => void;
}) {
  const theme = useTheme();
  const [boxes, setBoxes] = useState<RedactBox[]>([]);
  const [draft, setDraft] = useState<RedactBox | null>(null);
  const [frame, setFrame] = useState({ w: 1, h: 1 });
  const [origin, setOrigin] = useState<{ x: number; y: number } | null>(null);

  const norm = (a: { x: number; y: number }, b: { x: number; y: number }): RedactBox => {
    const clamp = (v: number) => Math.min(Math.max(v, 0), 1);
    const x1 = clamp(Math.min(a.x, b.x) / frame.w);
    const y1 = clamp(Math.min(a.y, b.y) / frame.h);
    return {
      x: x1,
      y: y1,
      w: clamp(Math.abs(a.x - b.x) / frame.w),
      h: clamp(Math.abs(a.y - b.y) / frame.h),
    };
  };

  const point = (e: GestureResponderEvent) => ({
    x: e.nativeEvent.locationX,
    y: e.nativeEvent.locationY,
  });
  const responder = {
    onStartShouldSetResponder: () => true,
    onMoveShouldSetResponder: () => true,
    onResponderGrant: (e: GestureResponderEvent) => setOrigin(point(e)),
    onResponderMove: (e: GestureResponderEvent) => origin && setDraft(norm(origin, point(e))),
    onResponderRelease: (e: GestureResponderEvent) => {
      if (!origin) return;
      const b = norm(origin, point(e));
      setOrigin(null);
      setDraft(null);
      if (b.w > 0.02 && b.h > 0.02) setBoxes((bs) => [...bs, b]);
    },
  };

  const onLayout = (e: LayoutChangeEvent) =>
    setFrame({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height });
  const shown = draft ? [...boxes, draft] : boxes;

  return (
    <Modal animationType="none" onRequestClose={onCancel} presentationStyle="fullScreen">
      <View style={[styles.wrap, { backgroundColor: theme.background }]}>
        <Text accessibilityRole="header" style={[styles.title, { color: theme.text }]}>
          {t.title}
        </Text>
        <Text style={[styles.hint, { color: theme.textSecondary }]}>{t.hint}</Text>
        <View
          accessible
          accessibilityLabel={t.canvasLabel}
          accessibilityHint={t.boxCount(boxes.length)}
          onLayout={onLayout}
          style={[styles.frame, { aspectRatio: width / height }]}
          {...responder}
        >
          <Image source={{ uri }} style={StyleSheet.absoluteFill} resizeMode="stretch" />
          {shown.map((b, i) => (
            <View
              key={i}
              style={[
                styles.box,
                {
                  left: `${b.x * 100}%`,
                  top: `${b.y * 100}%`,
                  width: `${b.w * 100}%`,
                  height: `${b.h * 100}%`,
                },
              ]}
            />
          ))}
        </View>
        <Text
          accessibilityLiveRegion="polite"
          style={[styles.hint, { color: theme.textSecondary }]}
        >
          {boxes.length ? t.boxCount(boxes.length) : ''}
        </Text>
        <View style={styles.row}>
          <Button
            variant="secondary"
            onPress={() => setBoxes((bs) => [...bs, { x: 0.375, y: 0.4375, w: 0.25, h: 0.125 }])}
          >
            {t.addBox}
          </Button>
          <Button
            variant="secondary"
            disabled={!boxes.length}
            onPress={() => setBoxes((bs) => bs.slice(0, -1))}
          >
            {t.undo}
          </Button>
        </View>
        <View style={styles.row}>
          <Button onPress={() => onDone(boxes)}>{t.apply}</Button>
          <Button variant="secondary" onPress={onCancel}>
            {t.cancel}
          </Button>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, padding: space[4], paddingTop: space[16], gap: space[3] },
  title: { fontFamily: nativeFonts.headlineExtraBold, fontSize: 24 },
  hint: { fontFamily: nativeFonts.body, fontSize: 15, lineHeight: 22 },
  frame: { width: '100%', maxHeight: '55%', alignSelf: 'center' },
  box: { position: 'absolute', backgroundColor: colors.ink },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: space[3] },
});
