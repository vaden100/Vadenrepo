'use client';

import { useEffect } from 'react';
import { track } from '@/components/shell/analytics';
import type { EntryPoint } from './entry-point';

/**
 * Counts finished lookups by entry point and outcome, so we learn whether share cards and the
 * home check actually bring people to search. Only fires with analytics consent (track()).
 */
export function SearchTracker({
  entry,
  kind,
  outcome,
}: {
  entry: EntryPoint;
  kind: string;
  outcome: 'matched' | 'under_review' | 'none';
}) {
  useEffect(() => {
    track('search_completed', { entry_point: entry, kind, outcome });
  }, [entry, kind, outcome]);
  return null;
}
