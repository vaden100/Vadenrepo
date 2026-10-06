/**
 * Identifier classifier + normalizers (SPEC 8.1). Dependency-light: runs on web, mobile,
 * edge functions and in DB fixture tests.
 */
export { classify, type ClassifiedQuery, type QueryKind } from './classify';
export {
  handleFromUrl,
  looseHandle,
  normalizeCashtag,
  normalizeDomain,
  normalizeEmail,
  normalizeHandle,
  normalizeName,
  normalizePhone,
  type SocialPlatform,
} from './normalize';
export { extractIdentifiers, type ExtractedIdentifiers } from './extract';
