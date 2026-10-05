import { Text } from 'react-native';
import { colors } from '@rmmm/tokens';

/** Yellow marker for the key line in an excerpt. Nest inside a <Text>. */
export function MarkerHighlight({ children }: { children: string }) {
  return (
    <Text style={{ backgroundColor: colors.caution, color: colors.paperInk }}>{children}</Text>
  );
}
