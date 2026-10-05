import { useEffect, useState } from 'react';
import { Animated, StyleSheet, View, type DimensionValue } from 'react-native';
import { radius, space } from '@rmmm/tokens';
import { en } from '../shared/strings.en';
import { ReceiptEdge } from './ReceiptCard';
import { useReducedMotion } from './reducedMotion';
import { useTheme } from './theme';

function usePulse() {
  const reduced = useReducedMotion();
  const [v] = useState(() => new Animated.Value(1));
  useEffect(() => {
    if (reduced) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(v, { toValue: 0.55, duration: 600, useNativeDriver: true }),
        Animated.timing(v, { toValue: 1, duration: 600, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [reduced, v]);
  return v;
}

export function SkeletonLine({
  width = '100%',
  onPaper = false,
}: {
  width?: DimensionValue;
  onPaper?: boolean;
}) {
  const t = useTheme();
  const opacity = usePulse();
  return (
    <Animated.View
      style={[styles.line, { width, opacity, backgroundColor: onPaper ? '#C9C2B4' : t.border }]}
    />
  );
}

export function ReceiptSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <View accessible accessibilityLabel={en.common.loading} accessibilityState={{ busy: true }}>
      <View style={styles.receipt}>
        <SkeletonLine width="45%" onPaper />
        {Array.from({ length: lines }, (_, i) => (
          <SkeletonLine key={i} width={i === lines - 1 ? '60%' : '100%'} onPaper />
        ))}
      </View>
      <ReceiptEdge color="#DED8CC" />
    </View>
  );
}

export function CardSkeleton() {
  const t = useTheme();
  return (
    <View
      accessible
      accessibilityLabel={en.common.loading}
      accessibilityState={{ busy: true }}
      style={[styles.card, { backgroundColor: t.surface }]}
    >
      <SkeletonLine width="55%" />
      <SkeletonLine width="80%" />
    </View>
  );
}

const styles = StyleSheet.create({
  line: { height: 12, borderRadius: radius.paper },
  receipt: {
    backgroundColor: '#DED8CC',
    padding: space[4],
    gap: space[2],
    borderTopLeftRadius: radius.paper,
    borderTopRightRadius: radius.paper,
  },
  card: { padding: space[4], gap: space[2], borderRadius: radius.paper },
});
