import { z } from 'zod';
import { CATEGORIES, PAY_RAILS } from './enums';

/** SPEC 4.1: submit a story. Shared by the web flow, the API and the mobile app. */

export const REPORT_CONSENT_VERSION = '2026-10-06';

export const STORY_MAX = 5000;
export const VOICE_NOTE_MAX_SECONDS = 60;
export const VIDEO_MAX_SECONDS = 60;
export const MAX_FILES_PER_REPORT = 20;

/** SPEC 11 size limits, and the only types we accept. Checked again by magic bytes on the server. */
export const MEDIA_RULES = {
  image: {
    maxBytes: 15 * 1024 * 1024,
    mimes: ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'],
  },
  pdf: { maxBytes: 15 * 1024 * 1024, mimes: ['application/pdf'] },
  audio: {
    maxBytes: 20 * 1024 * 1024,
    mimes: [
      'audio/mpeg',
      'audio/mp4',
      'audio/x-m4a',
      'audio/aac',
      'audio/webm',
      'audio/ogg',
      'audio/wav',
      'audio/x-wav',
    ],
  },
  video: { maxBytes: 200 * 1024 * 1024, mimes: ['video/mp4', 'video/quicktime', 'video/webm'] },
} as const;

export type MediaKind = keyof typeof MEDIA_RULES;

export function kindForMime(mime: string): MediaKind | null {
  const m = mime.toLowerCase().split(';')[0]!.trim();
  for (const [kind, rule] of Object.entries(MEDIA_RULES) as [
    MediaKind,
    (typeof MEDIA_RULES)[MediaKind],
  ][]) {
    if ((rule.mimes as readonly string[]).includes(m)) return kind;
  }
  return null;
}

const trimmed = (max: number) => z.string().trim().max(max);
const optionalText = (max: number) =>
  trimmed(max)
    .optional()
    .transform((v) => (v ? v : undefined));

/** Step 2: who. Everything optional individually; at least one way to identify them is required. */
export const WhoStep = z
  .object({
    businessName: optionalText(120),
    instagram: optionalText(100),
    tiktok: optionalText(100),
    facebook: optionalText(200),
    x: optionalText(100),
    phone: optionalText(40),
    website: optionalText(300),
    cashtag: optionalText(40),
    zelle: optionalText(254),
    venmo: optionalText(60),
    paypal: optionalText(254),
    appleCash: optionalText(40),
    city: optionalText(80),
    state: optionalText(40),
  })
  .strict();
export type WhoStep = z.infer<typeof WhoStep>;

export const IDENTIFYING_FIELDS = [
  'businessName',
  'instagram',
  'tiktok',
  'facebook',
  'x',
  'phone',
  'website',
  'cashtag',
  'zelle',
  'venmo',
  'paypal',
  'appleCash',
] as const;

export const hasIdentifier = (w: Partial<WhoStep>) =>
  IDENTIFYING_FIELDS.some((k) => Boolean(w[k]?.trim()));

const yesNo = z.enum(['yes', 'no']);

/** Step 3: money. */
export const MoneyStep = z
  .object({
    amount: z
      .string()
      .trim()
      .regex(/^\d{1,7}(\.\d{1,2})?$/)
      .optional(),
    currency: z.enum(['USD', 'CAD', 'GBP', 'EUR']).default('USD'),
    paidOn: z.iso.date().optional(),
    rail: z.enum(PAY_RAILS).optional(),
    wasDeposit: yesNo.optional(),
    refundRequested: yesNo.optional(),
    refundResponse: optionalText(500),
  })
  .strict();
export type MoneyStep = z.infer<typeof MoneyStep>;

/** Everything a draft can hold. PATCH sends any subset. */
export const ReportDraft = z
  .object({
    category: z.enum(CATEGORIES).optional(),
    who: WhoStep.partial().optional(),
    money: MoneyStep.partial().optional(),
    story: z.string().max(STORY_MAX).optional(),
    step: z.number().int().min(1).max(7).optional(),
  })
  .strict();
export type ReportDraft = z.infer<typeof ReportDraft>;

export const ON_CAMERA = ['yes', 'voice_only', 'anonymous_only', 'no'] as const;

/** Step 6 + submit. Required consents must be literally true (never pre-checked). */
export const SubmitInput = z
  .object({
    consentTruth: z.literal(true),
    consentTerms: z.literal(true),
    ageConfirmed: z.literal(true),
    consentContact: z.boolean().default(false),
    onCamera: z.enum(ON_CAMERA).optional(),
    turnstileToken: z.string().max(4096).optional(),
  })
  .strict();
export type SubmitInput = z.infer<typeof SubmitInput>;

const fraction = z.number().min(0).max(1);
export const RedactBox = z.object({ x: fraction, y: fraction, w: fraction, h: fraction }).strict();
export type RedactBox = z.infer<typeof RedactBox>;

export const MediaRequest = z
  .object({
    mime: z.string().max(100),
    bytes: z.number().int().positive(),
    /** Seconds, for audio/video recorded or picked on the device (re-checked by the worker). */
    durationSeconds: z.number().positive().max(3600).optional(),
    /** The reporter's own redaction was applied before upload. */
    redacted: z.boolean().optional(),
    /** Recorded in the story step instead of uploaded as a receipt. */
    voiceNote: z.boolean().optional(),
    /** Areas to cover, as fractions of the image (the app's redaction tool; painted by the worker). */
    redactBoxes: z.array(RedactBox).max(50).optional(),
  })
  .strict();

export const ClaimInput = z
  .object({
    code: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^RMMM-\d{2}-\d{4,}$/),
    claim: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$/),
  })
  .strict();

/** Claim codes: 12 characters from an unambiguous alphabet (no 0/O, 1/I/L), shown as XXXX-XXXX-XXXX. */
export const CLAIM_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

export function formatClaimCode(randomBytes: Uint8Array): string {
  if (randomBytes.length < 12) throw new Error('need 12 random bytes');
  let out = '';
  for (let i = 0; i < 12; i++) {
    out += CLAIM_ALPHABET[randomBytes[i]! % CLAIM_ALPHABET.length];
    if (i === 3 || i === 7) out += '-';
  }
  return out;
}

export function amountToCents(amount: string | undefined): number | null {
  if (!amount) return null;
  const [whole, frac = ''] = amount.split('.');
  return Number(whole) * 100 + Number(frac.padEnd(2, '0').slice(0, 2));
}

export function centsToAmount(cents: number | null | undefined): string | undefined {
  if (cents === null || cents === undefined) return undefined;
  return cents % 100 === 0 ? String(cents / 100) : (cents / 100).toFixed(2);
}

/** What the server returns for a draft (resume after reload). */
export interface ReportDraftView {
  id: string;
  status: string;
  step: number;
  category?: string;
  who: Partial<WhoStep>;
  money: Partial<MoneyStep>;
  story: string;
  media: MediaView[];
}

export interface MediaView {
  id: string;
  kind: MediaKind;
  mime: string | null;
  bytes: number | null;
  durationMs: number | null;
  uploadStatus: 'awaiting_upload' | 'uploaded' | 'processing' | 'ready' | 'rejected' | 'failed';
  rejectReason: string | null;
  voiceNote: boolean;
  createdAt: string;
}

/** Minimum story length unless a voice note tells it. */
export const STORY_MIN = 20;

/** Returned once by submit. The claim code is never shown again. */
export interface SubmitResult {
  /** Report id (the app stores "<id>.<claimCode>" to check status later). */
  id: string;
  code: string;
  claimCode: string | null;
  status: string;
}

/** What a reporter sees on the status page (their own report only). */
export interface ReportStatusView {
  id: string;
  code: string | null;
  status: string;
  submittedAt: string | null;
  files: number;
  filesProcessing: number;
}

/** GET /api/reports/current. available is false when the site has no database configured. */
export interface CurrentDraft {
  available: boolean;
  draft: ReportDraftView | null;
}
