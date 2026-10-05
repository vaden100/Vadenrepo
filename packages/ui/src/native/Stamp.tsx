import { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';
import { colors, motion } from '@rmmm/tokens';
import { stampMeta, type StampKind } from '../shared/status';
import { nativeFonts } from './fonts';
import { useReducedMotion } from './reducedMotion';

export interface StampProps {
  kind: StampKind;
  size?: 'sm' | 'md' | 'lg';
  /** Slam (scale 1.15 to 1, 120 ms) when `kind` changes. Skipped with Reduce Motion. */
  animate?: boolean;
  tilt?: number;
}

const sizes = {
  sm: { fontSize: 12, px: 10, py: 6, inset: 3 },
  md: { fontSize: 16, px: 14, py: 10, inset: 4 },
  lg: { fontSize: 24, px: 20, py: 14, inset: 5 },
} as const;

export function Stamp({ kind, size = 'md', animate = false, tilt = -3 }: StampProps) {
  const meta = stampMeta[kind];
  const s = sizes[size];
  const reduced = useReducedMotion();
  const [scale] = useState(() => new Animated.Value(1));
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (!animate || reduced) return;
    scale.setValue(motion.stampSlam.fromScale);
    Animated.timing(scale, {
      toValue: motion.stampSlam.toScale,
      duration: motion.stampSlam.durationMs,
      useNativeDriver: true,
    }).start();
  }, [kind, animate, reduced, scale]);

  return (
    <Animated.View
      accessible
      accessibilityRole="text"
      accessibilityLabel={meta.label}
      style={[
        styles.stamp,
        {
          backgroundColor: colors[meta.color],
          paddingHorizontal: s.px,
          paddingVertical: s.py,
          transform: [{ rotate: `${tilt}deg` }, { scale }],
        },
      ]}
    >
      <Animated.View
        pointerEvents="none"
        style={[
          styles.inner,
          {
            borderColor: colors[meta.text],
            top: s.inset,
            left: s.inset,
            right: s.inset,
            bottom: s.inset,
          },
        ]}
      />
      <Text style={[styles.text, { color: colors[meta.text], fontSize: s.fontSize }]}>
        {meta.label.toUpperCase()}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  stamp: { alignSelf: 'flex-start', borderRadius: 2 },
  inner: { position: 'absolute', borderWidth: 1, borderRadius: 1 },
  text: { fontFamily: nativeFonts.headlineBlack, letterSpacing: 2 },
});
