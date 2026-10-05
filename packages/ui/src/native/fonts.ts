/**
 * Font family names as registered by expo-font in apps/mobile (see app/_layout.tsx).
 * RN has no variable-font width axis, so condensed display type uses Archivo Narrow
 * (same family, SIL OFL).
 */
export const nativeFonts = {
  headlineBlack: 'Archivo_900Black',
  headlineExtraBold: 'Archivo_800ExtraBold',
  headlineCondensed: 'ArchivoNarrow_700Bold',
  body: 'IBMPlexSans_400Regular',
  bodyStrong: 'IBMPlexSans_600SemiBold',
  mono: 'IBMPlexMono_400Regular',
  monoStrong: 'IBMPlexMono_600SemiBold',
} as const;
