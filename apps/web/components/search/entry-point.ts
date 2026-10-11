/** Where a lookup started. Coarse and fixed: never a URL, referrer, device or network detail. */
export const ENTRY_POINTS = [
  'home',
  'lookup',
  'entity',
  'report',
  'share',
  'app',
  'direct',
] as const;
export type EntryPoint = (typeof ENTRY_POINTS)[number];

export const entryPoint = (v: string | undefined): EntryPoint =>
  (ENTRY_POINTS as readonly string[]).includes(v ?? '') ? (v as EntryPoint) : 'direct';
