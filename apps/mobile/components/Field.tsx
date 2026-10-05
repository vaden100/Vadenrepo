import { forwardRef } from 'react';
import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { radius, space, touchTarget } from '@rmmm/tokens';
import { nativeFonts, useTheme } from '@rmmm/ui/native';

export const Field = forwardRef<
  TextInput,
  TextInputProps & { label: string; hint?: string; mono?: boolean }
>(function Field({ label, hint, mono, style, ...rest }, ref) {
  const t = useTheme();
  return (
    <View style={styles.wrap}>
      <Text style={[styles.label, { color: t.text }]}>{label}</Text>
      <TextInput
        ref={ref}
        accessibilityLabel={label}
        accessibilityHint={hint}
        placeholderTextColor={t.textMuted}
        style={[
          styles.input,
          { backgroundColor: t.surface, borderColor: t.border, color: t.text },
          mono && { fontFamily: nativeFonts.mono, letterSpacing: 4 },
          style,
        ]}
        {...rest}
      />
      {hint && <Text style={[styles.hint, { color: t.textMuted }]}>{hint}</Text>}
    </View>
  );
});

export function FormError({ children }: { children: string | null }) {
  const t = useTheme();
  if (!children) return null;
  return (
    <Text
      accessibilityRole="alert"
      accessibilityLiveRegion="assertive"
      style={[styles.error, { color: t.danger }]}
    >
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6, flexShrink: 1 },
  label: { fontFamily: nativeFonts.bodyStrong, fontSize: 14 },
  input: {
    minHeight: touchTarget,
    borderWidth: 1,
    borderRadius: radius.paper,
    paddingHorizontal: space[3],
    fontFamily: nativeFonts.body,
    fontSize: 16,
  },
  hint: { fontFamily: nativeFonts.body, fontSize: 14, lineHeight: 20 },
  error: { fontFamily: nativeFonts.body, fontSize: 15 },
});
