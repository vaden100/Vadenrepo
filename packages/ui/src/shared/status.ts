import type { CaseStatus } from '@rmmm/api';
import type { ColorToken } from '@rmmm/tokens';
import { en } from './strings.en';

export type StampKind = CaseStatus | 'alleged' | 'verified' | 'no_refunds';

export interface StampMeta {
  label: string;
  /** Stamp ink (fill). */
  color: ColorToken;
  /** Text on the ink. Pairs are checked for WCAG AA in @rmmm/tokens tests. */
  text: ColorToken;
}

/** Visual meaning of every stamp. Status colors come straight from SPEC 13. */
export const stampMeta: Record<StampKind, StampMeta> = {
  reported: { label: en.stamp.reported, color: 'stampRed', text: 'paper' },
  verifying: { label: en.stamp.verifying, color: 'statusVerifying', text: 'ink' },
  contacted: { label: en.stamp.contacted, color: 'statusContacted', text: 'paper' },
  response_received: { label: en.stamp.response_received, color: 'statusContacted', text: 'paper' },
  no_response: { label: en.stamp.no_response, color: 'statusClosed', text: 'paper' },
  resolved_refunded: {
    label: en.stamp.resolved_refunded,
    color: 'statusResolvedText',
    text: 'paper',
  },
  resolved_other: { label: en.stamp.resolved_other, color: 'statusResolvedText', text: 'paper' },
  closed: { label: en.stamp.closed, color: 'statusClosed', text: 'paper' },
  alleged: { label: en.stamp.alleged, color: 'stampRed', text: 'paper' },
  verified: { label: en.stamp.verified, color: 'statusResolvedText', text: 'paper' },
  no_refunds: { label: en.stamp.no_refunds, color: 'stampRed', text: 'paper' },
};

export const STAMP_KINDS = Object.keys(stampMeta) as StampKind[];

export type MatchReason = keyof Omit<typeof en.whyMatched, 'title'>;
