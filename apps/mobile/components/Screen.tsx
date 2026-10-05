import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { space } from '@rmmm/tokens';
import { nativeFonts, useTheme } from '@rmmm/ui/native';

export function Screen({
  title,
  lede,
  children,
}: {
  title?: string;
  lede?: string;
  children?: ReactNode;
}) {
  const t = useTheme();
  return (
    <ScrollView style={{ backgroundColor: t.background }} contentContainerStyle={styles.content}>
      {title && (
        <Text accessibilityRole="header" style={[styles.title, { color: t.text }]}>
          {title.toUpperCase()}
        </Text>
      )}
      {lede && <Text style={[styles.lede, { color: t.textMuted }]}>{lede}</Text>}
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: space[4], gap: space[5], paddingBottom: space[16] },
  title: { fontFamily: nativeFonts.headlineCondensed, fontSize: 38, lineHeight: 40 },
  lede: { fontFamily: nativeFonts.body, fontSize: 16, lineHeight: 24 },
});
