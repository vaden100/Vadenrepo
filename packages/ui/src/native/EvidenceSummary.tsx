import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, space } from '@rmmm/tokens';
import { evidenceFacts, type EvidenceSummaryData } from '../shared/format';
import { en } from '../shared/strings.en';
import { nativeFonts } from './fonts';
import { ReceiptEdge } from './ReceiptCard';
import { SkeletonLine } from './Skeleton';
import { Stamp } from './Stamp';
import { useTheme } from './theme';

export type EvidenceSummaryProps =
  | { state: 'loading' }
  | { state: 'under_review' }
  | { state: 'no_results' }
  | {
      state: 'ready';
      name: string;
      subtitle?: string;
      data: EvidenceSummaryData;
      reportedFor?: string;
      now?: Date;
    };

/** Never a score. Only what was reported and reviewed (SPEC 4.2). */
export function EvidenceSummary(props: EvidenceSummaryProps) {
  const t = useTheme();
  if (props.state === 'loading') {
    return (
      <View accessible accessibilityLabel={en.common.loading} accessibilityState={{ busy: true }}>
        <View style={styles.body}>
          <SkeletonLine width="30%" onPaper />
          <SkeletonLine width="70%" onPaper />
          <SkeletonLine width="100%" onPaper />
        </View>
        <ReceiptEdge />
      </View>
    );
  }
  if (props.state === 'under_review' || props.state === 'no_results') {
    const review = props.state === 'under_review';
    return (
      <View style={[styles.notice, { borderColor: t.border }]} accessibilityLiveRegion="polite">
        <Text style={[styles.noticeTitle, { color: t.text }]}>
          {review ? en.evidence.underReviewTitle : en.evidence.noResultsTitle}
        </Text>
        <Text style={[styles.noticeBody, { color: t.textMuted }]}>
          {review ? en.evidence.underReviewBody : en.evidence.noResultsBody}
        </Text>
      </View>
    );
  }
  return (
    <View>
      <View style={styles.body}>
        <View style={styles.head}>
          <View style={styles.headText}>
            <Text style={styles.eyebrow}>EVIDENCE SUMMARY</Text>
            <Text accessibilityRole="header" style={styles.name}>
              {props.name.toUpperCase()}
            </Text>
            {props.subtitle && <Text style={styles.sub}>{props.subtitle}</Text>}
          </View>
          <Stamp kind="alleged" size="sm" tilt={-6} />
        </View>
        <View style={styles.rule} />
        {evidenceFacts(props.data, props.now).map((f) => (
          <Text key={f} style={styles.fact}>
            {f}
          </Text>
        ))}
        {props.reportedFor && <Text style={styles.sub}>Reported for: {props.reportedFor}.</Text>}
      </View>
      <ReceiptEdge />
    </View>
  );
}

const styles = StyleSheet.create({
  body: {
    backgroundColor: colors.paper,
    padding: space[4],
    gap: space[2],
    borderTopLeftRadius: radius.paper,
    borderTopRightRadius: radius.paper,
  },
  head: { flexDirection: 'row', justifyContent: 'space-between', gap: space[3] },
  headText: { flex: 1, gap: 2 },
  eyebrow: { fontFamily: nativeFonts.mono, fontSize: 12, letterSpacing: 1, color: '#5E5D58' },
  name: {
    fontFamily: nativeFonts.headlineCondensed,
    fontSize: 32,
    lineHeight: 34,
    color: colors.paperInk,
  },
  sub: { fontFamily: nativeFonts.body, fontSize: 14, color: '#5E5D58' },
  rule: {
    borderTopWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#CFC8BA',
    marginVertical: space[1],
  },
  fact: { fontFamily: nativeFonts.mono, fontSize: 15, lineHeight: 20, color: colors.paperInk },
  notice: { borderWidth: 2, borderRadius: radius.paper, padding: space[4], gap: space[1] },
  noticeTitle: { fontFamily: nativeFonts.headlineExtraBold, fontSize: 20 },
  noticeBody: { fontFamily: nativeFonts.body, fontSize: 16, lineHeight: 24 },
});
