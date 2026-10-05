import { useState, type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { CASE_STATUSES } from '@rmmm/api';
import { colors, space, typeScale } from '@rmmm/tokens';
import {
  Button,
  CardSkeleton,
  CaseEnvelope,
  EmptyCaseEnvelope,
  EvidenceSummary,
  Icon,
  iconShapes,
  LinkedPages,
  MarkerHighlight,
  nativeFonts,
  ReceiptCard,
  receiptStyles,
  ReceiptSkeleton,
  SkeletonLine,
  Stamp,
  STAMP_KINDS,
  useTheme,
  WhyMatched,
  type IconName,
} from '@rmmm/ui/native';
import { Screen } from '@/components/Screen';

const NOW = new Date('2026-10-05T12:00:00Z');

function Section({ title, children }: { title: string; children: ReactNode }) {
  const t = useTheme();
  return (
    <View style={[styles.section, { borderTopColor: t.border }]}>
      <Text accessibilityRole="header" style={[styles.sectionTitle, { color: t.text }]}>
        {title.toUpperCase()}
      </Text>
      {children}
    </View>
  );
}

function Label({ children }: { children: string }) {
  const t = useTheme();
  return <Text style={[styles.label, { color: t.textMuted }]}>{children.toUpperCase()}</Text>;
}

export default function StyleguideScreen() {
  const t = useTheme();
  const [i, setI] = useState(0);
  const status = CASE_STATUSES[i % CASE_STATUSES.length] ?? 'reported';

  return (
    <Screen title="Style guide" lede="Every token and component state. Demo data only.">
      <Section title="Color">
        <View style={styles.wrap}>
          {Object.entries(colors).map(([name, hex]) => (
            <View key={name} style={styles.swatchRow}>
              <View style={[styles.swatch, { backgroundColor: hex, borderColor: t.border }]} />
              <Text style={[styles.mono, { color: t.text }]}>
                {name} {hex}
              </Text>
            </View>
          ))}
        </View>
      </Section>

      <Section title="Type">
        {Object.entries(typeScale).map(([name, s]) => (
          <View key={name}>
            <Label>{`${name} ${s.size}/${s.lineHeight}`}</Label>
            <Text
              style={{
                color: t.text,
                fontSize: s.size,
                lineHeight: s.lineHeight,
                fontFamily:
                  s.family === 'mono'
                    ? s.weight >= 600
                      ? nativeFonts.monoStrong
                      : nativeFonts.mono
                    : s.family === 'body'
                      ? s.weight >= 600
                        ? nativeFonts.bodyStrong
                        : nativeFonts.body
                      : s.condensed
                        ? nativeFonts.headlineCondensed
                        : nativeFonts.headlineExtraBold,
              }}
            >
              {s.family === 'mono' ? 'RMMM-26-0412 · $1,240' : 'They thought nobody was watching.'}
            </Text>
          </View>
        ))}
      </Section>

      <Section title="Icons">
        <View style={styles.wrap}>
          {(Object.keys(iconShapes) as IconName[]).map((n) => (
            <View key={n} style={styles.iconCell}>
              <Icon name={n} size={28} color={t.text} />
              <Text style={[styles.tiny, { color: t.textMuted }]}>{n}</Text>
            </View>
          ))}
        </View>
      </Section>

      <Section title="Stamp">
        <View style={styles.wrap}>
          {STAMP_KINDS.map((k) => (
            <Stamp key={k} kind={k} />
          ))}
        </View>
        <View style={[styles.wrap, { alignItems: 'center' }]}>
          <Stamp kind="alleged" size="sm" />
          <Stamp kind="alleged" size="md" />
          <Stamp kind="alleged" size="lg" />
        </View>
        <Label>Status change (slam)</Label>
        <Stamp kind={status} size="lg" animate />
        <Button variant="secondary" onPress={() => setI((n) => n + 1)}>
          Next status
        </Button>
      </Section>

      <Section title="Button">
        <Button>Submit report</Button>
        <Button variant="secondary">Watch this page</Button>
        <Button variant="ghost">Before You Pay checklist</Button>
        <Button disabled>Disabled</Button>
        <Button loading>Submit</Button>
      </Section>

      <Section title="Receipt card">
        <ReceiptCard meta="Sep 2026 · Atlanta" aside="$50 to $100" footer="Deposit taken / no-show">
          <Text style={receiptStyles.content}>
            {'"Sent the $75 deposit Friday. '}
            <MarkerHighlight>Day of, the page blocked me</MarkerHighlight>
            {' and the booking link was gone."'}
          </Text>
        </ReceiptCard>
        <ReceiptSkeleton />
      </Section>

      <Section title="Case envelope">
        <CaseEnvelope
          caseNumber="RMMM-26-0412"
          title="The $75 booking that never happened"
          meta="Deposit taken / no-show · Atlanta, GA"
          status="contacted"
        />
        <EmptyCaseEnvelope />
      </Section>

      <Section title="Evidence summary">
        <EvidenceSummary
          state="ready"
          name="Nailz by Tee"
          subtitle="Atlanta, GA · demo data"
          reportedFor="deposit taken, no-show"
          now={NOW}
          data={{
            reportCount: 6,
            reviewedCount: 4,
            amountLostCents: 124_000,
            lastReportAt: new Date('2026-10-02T12:00:00Z'),
            linkedPageCount: 2,
          }}
        />
        <EvidenceSummary state="loading" />
        <EvidenceSummary state="under_review" />
        <EvidenceSummary state="no_results" />
      </Section>

      <Section title="Why matched and linked pages">
        <WhyMatched
          reasons={[
            { reason: 'shared_cashtag', strongest: true },
            { reason: 'shared_phone' },
            { reason: 'same_flyer_phash' },
          ]}
        />
        <LinkedPages
          pages={[
            { label: '@nailz2.atl', reason: 'shared_cashtag' },
            { label: '@teeslaced_', reason: 'same_flyer_phash' },
          ]}
        />
        <LinkedPages pages={[]} />
      </Section>

      <Section title="Skeletons">
        <SkeletonLine width="40%" />
        <SkeletonLine />
        <CardSkeleton />
        <ReceiptSkeleton lines={4} />
      </Section>
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: { borderTopWidth: 1, paddingTop: space[5], gap: space[3] },
  sectionTitle: { fontFamily: nativeFonts.headlineExtraBold, fontSize: 22 },
  label: { fontFamily: nativeFonts.mono, fontSize: 12 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: space[4] },
  swatchRow: { flexDirection: 'row', alignItems: 'center', gap: space[2], width: 160 },
  swatch: { width: 32, height: 32, borderRadius: 2, borderWidth: 1 },
  mono: { fontFamily: nativeFonts.mono, fontSize: 12 },
  iconCell: { width: 76, alignItems: 'center', gap: 4 },
  tiny: { fontFamily: nativeFonts.mono, fontSize: 10 },
});
