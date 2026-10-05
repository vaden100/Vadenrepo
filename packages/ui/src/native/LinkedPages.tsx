import { StyleSheet, Text, View } from 'react-native';
import { radius, space } from '@rmmm/tokens';
import { en } from '../shared/strings.en';
import type { MatchReason } from '../shared/status';
import { nativeFonts } from './fonts';
import { Icon } from './Icon';
import { useTheme } from './theme';
import { sectionTitle } from './WhyMatched';

export interface LinkedPage {
  label: string;
  reason: MatchReason;
}

/** Rebrand graph as a simple node list (SPEC 13). Only staff-confirmed links are public. */
export function LinkedPages({ pages }: { pages: LinkedPage[] }) {
  const t = useTheme();
  return (
    <View style={styles.wrap}>
      <Text accessibilityRole="header" style={[sectionTitle, { color: t.text }]}>
        {(pages.length
          ? en.evidence.linkedPages(pages.length)
          : en.linkedPages.title
        ).toUpperCase()}
      </Text>
      {pages.length === 0 ? (
        <Text style={[styles.reason, { color: t.textMuted }]}>{en.linkedPages.empty}</Text>
      ) : (
        <View style={[styles.list, { backgroundColor: t.surface }]}>
          {pages.map((p, i) => (
            <View
              key={p.label}
              style={[styles.item, i > 0 && { borderTopWidth: 1, borderTopColor: t.border }]}
            >
              <Icon name="linked-pages" size={22} color={t.focus} />
              <View>
                <Text style={[styles.label, { color: t.text }]}>{p.label}</Text>
                <Text style={[styles.reason, { color: t.textMuted }]}>
                  {en.whyMatched[p.reason]}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space[3] },
  list: { borderRadius: radius.paper },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[3],
    paddingHorizontal: space[4],
    paddingVertical: space[3],
  },
  label: { fontFamily: nativeFonts.mono, fontSize: 15 },
  reason: { fontFamily: nativeFonts.body, fontSize: 14 },
});
