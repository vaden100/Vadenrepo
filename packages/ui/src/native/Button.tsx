import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, space, touchTarget } from '@rmmm/tokens';
import { en } from '../shared/strings.en';
import { nativeFonts } from './fonts';
import { useTheme } from './theme';

export interface ButtonProps {
  children: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  disabled?: boolean;
  loading?: boolean;
  icon?: ReactNode;
  accessibilityHint?: string;
}

export function Button({
  children,
  onPress,
  variant = 'primary',
  disabled,
  loading,
  icon,
  accessibilityHint,
}: ButtonProps) {
  const t = useTheme();
  const inactive = disabled || loading;
  const fg = variant === 'primary' ? t.onPrimary : variant === 'ghost' ? colors.caution : t.text;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!inactive, busy: !!loading }}
      accessibilityHint={accessibilityHint}
      disabled={inactive}
      onPress={onPress}
      style={[
        styles.base,
        variant === 'primary' && { backgroundColor: t.primary },
        variant === 'secondary' && { borderColor: t.border },
        variant === 'ghost' && styles.ghost,
        inactive && styles.inactive,
      ]}
    >
      <View style={styles.row}>
        {icon}
        <Text style={[styles.label, { color: fg }]}>{loading ? en.common.loading : children}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: touchTarget,
    paddingHorizontal: space[5],
    borderRadius: radius.paper,
    borderWidth: 2,
    borderColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ghost: { paddingHorizontal: space[2] },
  inactive: { opacity: 0.5 },
  row: { flexDirection: 'row', alignItems: 'center', gap: space[2] },
  label: { fontFamily: nativeFonts.bodyStrong, fontSize: 16 },
});
