import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { colors, radius, space } from '@rmmm/tokens';
import { brandSvg } from '../icons/generated';
import { en } from '../shared/strings.en';
import type { StampKind } from '../shared/status';
import { nativeFonts } from './fonts';
import { Stamp } from './Stamp';
import { useTheme } from './theme';

export interface CaseEnvelopeProps {
  caseNumber: string;
  title: string;
  meta?: string;
  status: StampKind;
  animateStatus?: boolean;
  children?: ReactNode;
}

export function CaseEnvelope({
  caseNumber,
  title,
  meta,
  status,
  animateStatus,
  children,
}: CaseEnvelopeProps) {
  return (
    <View>
      <View
        style={styles.tab}
        accessible
        accessibilityLabel={`${en.envelope.caseNumber} ${caseNumber}`}
      >
        <Text style={styles.tabText}>{caseNumber}</Text>
      </View>
      <View style={styles.body}>
        {meta && <Text style={styles.meta}>{meta.toUpperCase()}</Text>}
        <Text accessibilityRole="header" style={styles.title}>
          {title.toUpperCase()}
        </Text>
        <View style={styles.row}>
          <View style={styles.clasp} />
          <Stamp kind={status} size="sm" animate={animateStatus} tilt={-4} />
        </View>
        {children}
      </View>
    </View>
  );
}

export function EmptyCaseEnvelope({
  title = en.envelope.emptyTitle,
  body = en.envelope.emptyBody,
}) {
  const t = useTheme();
  return (
    <View style={styles.empty}>
      <SvgXml xml={brandSvg['empty-case-envelope']} width={200} height={150} />
      <Text style={[styles.emptyTitle, { color: t.text }]}>{title.toUpperCase()}</Text>
      <Text style={[styles.emptyBody, { color: t.textMuted }]}>{body}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tab: {
    alignSelf: 'flex-start',
    backgroundColor: colors.manila,
    paddingHorizontal: space[3],
    paddingTop: 6,
    paddingBottom: 4,
    borderTopLeftRadius: radius.paper,
    borderTopRightRadius: radius.paper,
  },
  tabText: { fontFamily: nativeFonts.monoStrong, fontSize: 13, color: colors.paperInk },
  body: {
    backgroundColor: colors.manila,
    padding: space[4],
    gap: space[3],
    borderRadius: radius.paper,
    borderTopLeftRadius: 0,
  },
  meta: { fontFamily: nativeFonts.mono, fontSize: 12, letterSpacing: 0.6, color: colors.paperInk },
  title: {
    fontFamily: nativeFonts.headlineCondensed,
    fontSize: 30,
    lineHeight: 32,
    color: colors.paperInk,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  clasp: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.paperInk,
    opacity: 0.5,
  },
  empty: { alignItems: 'center', gap: space[2], padding: space[6] },
  emptyTitle: { fontFamily: nativeFonts.headlineExtraBold, fontSize: 20 },
  emptyBody: { fontFamily: nativeFonts.body, fontSize: 16, lineHeight: 24, textAlign: 'center' },
});
