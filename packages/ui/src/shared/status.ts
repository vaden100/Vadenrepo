import type { CaseStatus } from '@rmmm/api';
import type { ColorToken } from '@rmmm/tokens';
import { en } from './strings.en';

export type StampKind = CaseStatus | 'alleged' | 'verified' | 'no_refunds';

export interface StampMeta {
  label: string;
  /** Ink color of the stamp. */
  color: ColorToken;
}

/** Visual meaning of every stamp. Status colors come straight from SPEC 13. */
export const stampMeta: Record<StampKind, StampMeta> = {
  reported: { label: en.stamp.reported, color: 'stampRed' },
  verifying: { label: en.stamp.verifying, color: 'statusVerifying' },
  contacted: { label: en.stamp.contacted, color: 'statusContacted' },
  response_received: { label: en.stamp.response_received, color: 'statusContacted' },
  no_response: { label: en.stamp.no_response, color: 'statusClosed' },
  resolved_refunded: { label: en.stamp.resolved_refunded, color: 'statusResolved' },
  resolved_other: { label: en.stamp.resolved_other, color: 'statusResolved' },
  closed: { label: en.stamp.closed, color: 'statusClosed' },
  alleged: { label: en.stamp.alleged, color: 'stampRed' },
  verified: { label: en.stamp.verified, color: 'statusResolved' },
  no_refunds: { label: en.stamp.no_refunds, color: 'stampRed' },
};

export const STAMP_KINDS = Object.keys(stampMeta) as StampKind[];

export type MatchReason = keyof Omit<typeof en.whyMatched, 'title'>;
