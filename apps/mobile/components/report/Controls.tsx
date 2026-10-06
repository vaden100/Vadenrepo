import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { radius, space, touchTarget } from '@rmmm/tokens';
import { Icon, nativeFonts, useTheme } from '@rmmm/ui/native';

/** Single choice list. Each row is a radio with its own label (screen readers read both). */
export function Choice({
  label,
  value,
  options,
  onChange,
  error,
}: {
  label: string;
  value: string;
  options: readonly { value: string; label: string }[];
  onChange: (v: string) => void;
  error?: string | null;
}) {
  const t = useTheme();
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={label} style={styles.group}>
      <Text style={[styles.legend, { color: t.text }]}>{label}</Text>
      {options.map((o) => {
        const on = value === o.value;
        return (
          <Pressable
            key={o.value}
            accessibilityRole="radio"
            accessibilityState={{ checked: on }}
            accessibilityLabel={o.label}
            onPress={() => onChange(o.value)}
            style={[
              styles.row,
              { borderColor: on ? t.text : t.border, backgroundColor: t.surface },
            ]}
          >
            <View style={[styles.radio, { borderColor: t.text }]}>
              {on && <View style={[styles.dot, { backgroundColor: t.text }]} />}
            </View>
            <Text style={[styles.label, { color: t.text }]}>{o.label}</Text>
          </Pressable>
        );
      })}
      {error ? (
        <Text accessibilityRole="alert" style={[styles.error, { color: t.danger }]}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

/** Checkbox row. Never pre-checked by the caller for consents. */
export function Check({
  label,
  hint,
  checked,
  onChange,
  error,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  error?: string | null;
}) {
  const t = useTheme();
  return (
    <View style={styles.checkWrap}>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked }}
        accessibilityLabel={label}
        accessibilityHint={hint}
        onPress={() => onChange(!checked)}
        style={styles.checkRow}
      >
        <View style={[styles.box, { borderColor: error ? t.danger : t.text }]}>
          {checked && <Icon name="verified" size={18} color={t.text} />}
        </View>
        <Text style={[styles.label, { color: t.text }]}>{label}</Text>
      </Pressable>
      {hint ? <Text style={[styles.hint, { color: t.textMuted }]}>{hint}</Text> : null}
      {error ? (
        <Text accessibilityRole="alert" style={[styles.error, { color: t.danger }]}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

export function Note({
  children,
  tone = 'info',
}: {
  children: ReactNode;
  tone?: 'info' | 'warning' | 'error';
}) {
  const t = useTheme();
  const color = tone === 'error' ? t.danger : tone === 'warning' ? t.warning : t.textSecondary;
  return (
    <Text
      accessibilityRole={tone === 'error' ? 'alert' : 'text'}
      accessibilityLiveRegion={tone === 'error' ? 'assertive' : 'polite'}
      style={[styles.note, { color, borderColor: tone === 'info' ? t.border : color }]}
    >
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  group: { gap: space[2] },
  legend: { fontFamily: nativeFonts.bodyStrong, fontSize: 16, marginBottom: space[1] },
  row: {
    minHeight: touchTarget,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[3],
    paddingHorizontal: space[3],
    paddingVertical: space[2],
    borderWidth: 1,
    borderRadius: radius.paper,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: { width: 10, height: 10, borderRadius: 5 },
  label: { flex: 1, fontFamily: nativeFonts.body, fontSize: 16, lineHeight: 22 },
  checkWrap: { gap: space[1] },
  checkRow: { minHeight: touchTarget, flexDirection: 'row', alignItems: 'center', gap: space[3] },
  box: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderRadius: radius.paper,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hint: { fontFamily: nativeFonts.body, fontSize: 14, lineHeight: 20, marginLeft: 36 },
  error: { fontFamily: nativeFonts.body, fontSize: 15 },
  note: {
    fontFamily: nativeFonts.body,
    fontSize: 15,
    lineHeight: 22,
    borderLeftWidth: 3,
    paddingLeft: space[3],
  },
});
