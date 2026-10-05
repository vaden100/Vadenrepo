import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, space } from '@rmmm/tokens';
import { en } from '../shared/strings.en';
import type { MatchReason } from '../shared/status';
import { nativeFonts } from './fonts';
import { useTheme } from './theme';

export interface WhyMatchedProps {
  reasons: { reason: MatchReason; detail?: string; strongest?: boolean }[];
}

export function WhyMatched({ reasons }: WhyMatchedProps) {
  const t = useTheme();
  return (
    <View style={styles.wrap}>
      <Text accessibilityRole="header" style={[styles.title, { color: t.text }]}>
        {en.whyMatched.title.toUpperCase()}
      </Text>
      <View style={styles.chips}>
        {reasons.map((r) => (
          <View
            key={r.reason + (r.detail ?? '')}
            style={[styles.chip, { borderColor: r.strongest ? colors.caution : t.border }]}
          >
            <Text style={[styles.chipText, { color: r.strongest ? t.focus : t.text }]}>
              {en.whyMatched[r.reason]}
              {r.detail ? ` ${r.detail}` : ''}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export const sectionTitle = StyleSheet.create({
  text: { fontFamily: nativeFonts.headlineExtraBold, fontSize: 16, letterSpacing: 1 },
}).text;

const styles = StyleSheet.create({
  wrap: { gap: space[3] },
  title: sectionTitle,
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space[2] },
  chip: { borderWidth: 1, borderRadius: radius.paper, paddingHorizontal: 10, paddingVertical: 6 },
  chipText: { fontFamily: nativeFonts.body, fontSize: 14 },
});
