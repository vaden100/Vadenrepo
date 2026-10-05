import { useColorScheme } from 'react-native';
import { themes } from '@rmmm/tokens';

/** Dark is the default (SPEC 13); light only when the OS asks for it. */
export function useTheme() {
  return useColorScheme() === 'light' ? themes.light : themes.dark;
}
