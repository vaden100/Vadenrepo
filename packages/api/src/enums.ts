import { z } from 'zod';

/** Mirrors the Postgres enums in SPEC.md section 7. Keep both in sync. */
export const ROLES = ['member', 'moderator', 'editor', 'admin', 'business'] as const;
export const REPORT_STATUSES = [
  'draft',
  'submitted',
  'triage',
  'needs_evidence',
  'ready_for_review',
  'approved',
  'rejected',
  'withdrawn',
] as const;
export const CASE_STATUSES = [
  'reported',
  'verifying',
  'contacted',
  'response_received',
  'no_response',
  'resolved_refunded',
  'resolved_other',
  'closed',
] as const;
export const IDENT_TYPES = [
  'name',
  'handle_ig',
  'handle_tiktok',
  'handle_fb',
  'handle_x',
  'cashtag',
  'zelle',
  'venmo',
  'paypal',
  'phone',
  'email',
  'domain',
  'url',
  'address',
] as const;
export const PAY_RAILS = [
  'cashapp',
  'zelle',
  'venmo',
  'paypal',
  'apple_cash',
  'card',
  'bank',
  'crypto',
  'cash',
  'other',
] as const;
export const CATEGORIES = [
  'deposit_no_show',
  'not_delivered',
  'bad_service_no_refund',
  'credit_repair',
  'forex_trading',
  'fake_giveaway_clout',
  'romance_catfish',
  'other',
] as const;

export const Role = z.enum(ROLES);
export const ReportStatus = z.enum(REPORT_STATUSES);
export const CaseStatus = z.enum(CASE_STATUSES);
export const IdentType = z.enum(IDENT_TYPES);
export const PayRail = z.enum(PAY_RAILS);
export const Category = z.enum(CATEGORIES);

export type Role = z.infer<typeof Role>;
export type ReportStatus = z.infer<typeof ReportStatus>;
export type CaseStatus = z.infer<typeof CaseStatus>;
export type IdentType = z.infer<typeof IdentType>;
export type PayRail = z.infer<typeof PayRail>;
export type Category = z.infer<typeof Category>;
