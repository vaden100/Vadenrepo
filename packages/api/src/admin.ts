import { z } from 'zod';
import { CATEGORIES, IDENT_TYPES } from './enums';

/** Admin console contracts (SPEC 5 admin, 10). Postgres enforces the same rules again. */

export const REJECT_REASONS = [
  'not_enough_evidence',
  'duplicate',
  'not_a_scam_report',
  'abusive',
  'spam',
  'withdrawn_by_reporter',
  'other',
] as const;

const text = (max: number) => z.string().trim().min(1).max(max);

export const ModerateReport = z.discriminatedUnion('action', [
  z.object({ action: z.literal('triage') }).strict(),
  z.object({ action: z.literal('request_evidence'), evidenceRequest: text(1000) }).strict(),
  z.object({ action: z.literal('ready') }).strict(),
  z.object({ action: z.literal('approve'), publicExcerpt: text(1200) }).strict(),
  z.object({ action: z.literal('reject'), rejectedReason: z.enum(REJECT_REASONS) }).strict(),
  z.object({ action: z.literal('note'), staffNote: z.string().trim().max(4000) }).strict(),
  z.object({ action: z.literal('excerpt'), publicExcerpt: z.string().trim().max(1200) }).strict(),
]);
export type ModerateReport = z.infer<typeof ModerateReport>;

export const BAN_DAYS = ['7', '30', '365', 'forever'] as const;
export const BanSource = z.object({ reason: text(200), duration: z.enum(BAN_DAYS) }).strict();

export const EntityFields = z
  .object({
    displayName: text(120),
    category: z.enum(CATEGORIES).nullable().optional(),
    city: z.string().trim().max(80).optional(),
    state: z.string().trim().max(40).optional(),
  })
  .strict();

export const EntityFromReport = z
  .object({ reportId: z.uuid(), entityId: z.uuid().optional(), displayName: text(120).optional() })
  .strict()
  .refine((v) => v.entityId || v.displayName, { message: 'entity or name required' });

export const EntityAction = z.discriminatedUnion('action', [
  z.object({ action: z.literal('update'), fields: EntityFields }).strict(),
  z.object({ action: z.literal('approve') }).strict(),
  z.object({ action: z.literal('withdraw') }).strict(),
  z.object({ action: z.literal('publish') }).strict(),
  z.object({ action: z.literal('unpublish') }).strict(),
  z.object({ action: z.literal('legal_hold'), on: z.boolean() }).strict(),
  z.object({ action: z.literal('merge'), dropId: z.uuid() }).strict(),
  z.object({ action: z.literal('link'), otherId: z.uuid() }).strict(),
  z
    .object({
      action: z.literal('confirm_link'),
      a: z.uuid(),
      b: z.uuid(),
      reason: z.string().max(40),
    })
    .strict(),
  z
    .object({ action: z.literal('add_identifier'), type: z.enum(IDENT_TYPES), value: text(300) })
    .strict(),
  z.object({ action: z.literal('remove_identifier'), identifierId: z.uuid() }).strict(),
]);
export type EntityAction = z.infer<typeof EntityAction>;

export const FLAG_ACTIONS = ['removed', 'edited', 'no_action', 'banned_user'] as const;
export const ResolveFlag = z
  .object({ action: z.enum(FLAG_ACTIONS), resolution: z.string().trim().max(2000) })
  .strict();

export const DISPUTE_OUTCOMES = [
  'content_updated',
  'annotated',
  'content_removed',
  'no_change',
] as const;
export const UpdateDispute = z.discriminatedUnion('status', [
  z
    .object({ status: z.literal('in_review'), staffNote: z.string().trim().max(4000).optional() })
    .strict(),
  z
    .object({
      status: z.literal('resolved'),
      outcome: z.enum(DISPUTE_OUTCOMES),
      staffNote: z.string().trim().max(4000).optional(),
    })
    .strict(),
]);

export const AddIpBans = z
  .object({
    addresses: z.array(z.string().trim().min(2).max(50)).min(1).max(100),
    reason: text(200),
    days: z.number().int().min(1).max(3650).nullable(),
  })
  .strict();

export const AccountBan = z
  .object({ userId: z.uuid(), reason: z.string().trim().max(200), banned: z.boolean() })
  .strict();

export const RedactRequest = z
  .object({
    boxes: z
      .array(
        z
          .object({
            x: z.number().min(0).max(1),
            y: z.number().min(0).max(1),
            w: z.number().min(0).max(1),
            h: z.number().min(0).max(1),
          })
          .strict(),
      )
      .max(50),
  })
  .strict();

/** Public: flag content (Apple 1.2) and business disputes (SPEC 10.6). */
export const FLAG_TARGETS = [
  'entity',
  'report',
  'case',
  'case_update',
  'episode',
  'reply',
  'user',
] as const;
export const FLAG_REASONS = [
  'inaccurate',
  'personal_info',
  'harassment',
  'hate',
  'spam',
  'legal',
  'other',
] as const;
export const FlagInput = z
  .object({
    targetType: z.enum(FLAG_TARGETS),
    targetId: z.uuid(),
    reason: z.enum(FLAG_REASONS),
    details: z.string().trim().max(2000).optional(),
  })
  .strict();

export const DisputeInput = z
  .object({
    entitySlug: z.string().trim().min(1).max(120),
    name: text(120),
    email: z.email().max(254),
    body: z.string().trim().min(20).max(8000),
    turnstileToken: z.string().max(4096).optional(),
  })
  .strict();

/** IPv4/IPv6 address or CIDR range, as typed by staff. */
export function isIpOrCidr(v: string): boolean {
  const [addr, bits, extra] = v.split('/');
  if (extra !== undefined || !addr) return false;
  const v4 = /^(25[0-5]|2[0-4]\d|1?\d?\d)(\.(25[0-5]|2[0-4]\d|1?\d?\d)){3}$/.test(addr);
  const v6 = !v4 && /^[0-9a-f:]+$/i.test(addr) && addr.includes(':') && addr.split(':').length <= 8;
  if (!v4 && !v6) return false;
  if (bits === undefined) return true;
  const n = Number(bits);
  return /^\d{1,3}$/.test(bits) && n >= (v4 ? 8 : 16) && n <= (v4 ? 32 : 128);
}
