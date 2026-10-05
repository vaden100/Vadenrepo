/**
 * Identifier classifier + normalizers (SPEC.md section 8.1).
 * Implemented in Phase 4. This package must stay dependency-light: it runs on
 * web, mobile, edge functions and in DB fixture tests.
 */
export type QueryKind = 'cashtag' | 'handle' | 'phone' | 'email' | 'domain' | 'name';

export interface ClassifiedQuery {
  kind: QueryKind;
  raw: string;
  norm: string;
  /** Handles only: trailing digits and separators removed (nailz2 -> nailz). */
  normLoose?: string;
}
