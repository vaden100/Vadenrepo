import { z } from 'zod';

/** Contracts for the website's route handlers (docs/website-foundations.md 14). */

export const CONTACT_REASONS = ['business', 'press', 'legal', 'safety', 'bug', 'other'] as const;

export const ContactInput = z.object({
  reason: z.enum(CONTACT_REASONS),
  name: z.string().trim().min(1).max(120),
  email: z.email().trim().max(254),
  message: z.string().trim().min(20).max(4000),
  /** Honeypot: hidden from people, filled by bots. Must be empty. */
  website: z.string().max(0).optional().default(''),
  turnstileToken: z.string().max(4096).optional(),
});
export type ContactInput = z.infer<typeof ContactInput>;

export const ConsentInput = z.object({ analytics: z.boolean() });

export const DeletionInput = z.object({ confirm: z.literal(true) });

export const ClientErrorInput = z.object({
  message: z.string().max(500),
  digest: z.string().max(100).optional(),
  path: z.string().max(300),
});

/** Every error response from our API has this shape. Codes are stable; messages are for people. */
export type ApiError = {
  error:
    | 'bad_request'
    | 'invalid'
    | 'unauthorized'
    | 'forbidden'
    | 'not_found'
    | 'conflict'
    | 'rate_limited'
    | 'unavailable'
    | 'server_error';
  message: string;
  /** Field-level problems for forms: field name -> short code. */
  fields?: Record<string, string>;
};

/** Turns a zod error into { field: code } for the form to map onto its own messages. */
export function fieldErrors(err: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of err.issues) {
    const k = String(issue.path[0] ?? '_');
    out[k] ??= issue.code;
  }
  return out;
}
