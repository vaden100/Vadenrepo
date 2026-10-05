import { useId, type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, Path, Pattern, Rect } from 'react-native-svg';
import { colors, radius, space } from '@rmmm/tokens';
import { nativeFonts } from './fonts';

/** Zigzag bottom edge, same geometry as brand/receipt-edge.svg. */
export function ReceiptEdge({ color = colors.paper }: { color?: string }) {
  const id = `zig${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  return (
    <Svg
      width="100%"
      height={8}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Defs>
        <Pattern id={id} width={16} height={8} patternUnits="userSpaceOnUse">
          <Path d="M0 0H16L12 8L8 0L4 8L0 0Z" fill={color} />
        </Pattern>
      </Defs>
      <Rect width="100%" height={8} fill={`url(#${id})`} />
    </Svg>
  );
}

export interface ReceiptCardProps {
  meta?: string;
  aside?: string;
  children: ReactNode;
  footer?: string;
}

export function ReceiptCard({ meta, aside, children, footer }: ReceiptCardProps) {
  return (
    <View>
      <View style={styles.body}>
        {(meta || aside) && (
          <View style={styles.metaRow}>
            <Text style={styles.meta}>{meta?.toUpperCase()}</Text>
            {aside && <Text style={styles.meta}>{aside}</Text>}
          </View>
        )}
        {typeof children === 'string' ? <Text style={styles.content}>{children}</Text> : children}
        {footer && <Text style={styles.footer}>{footer}</Text>}
      </View>
      <ReceiptEdge />
    </View>
  );
}

export const receiptStyles = StyleSheet.create({
  content: { fontFamily: nativeFonts.body, fontSize: 15, lineHeight: 22, color: colors.paperInk },
});

const styles = StyleSheet.create({
  body: {
    backgroundColor: colors.paper,
    borderTopLeftRadius: radius.paper,
    borderTopRightRadius: radius.paper,
    padding: space[4],
    gap: space[2],
  },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', gap: space[3] },
  meta: {
    fontFamily: nativeFonts.mono,
    fontSize: 12,
    lineHeight: 16,
    color: '#5E5D58',
    letterSpacing: 0.5,
  },
  content: receiptStyles.content,
  footer: { fontFamily: nativeFonts.bodyStrong, fontSize: 12, color: '#5E5D58' },
});
