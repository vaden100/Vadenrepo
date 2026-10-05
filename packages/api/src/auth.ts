import { parsePhoneNumberFromString } from 'libphonenumber-js/min';
import { z } from 'zod';

/** Bump when the Terms or Privacy Policy change; users re-accept (consents_log stores it). */
export const TERMS_VERSION = '2026-10-05';

export const MIN_AGE = 18;

export type OtpTarget = { kind: 'email'; email: string } | { kind: 'phone'; phone: string };

const Email = z.email();

/** Parses what someone typed into "Email or phone number". Phones become E.164 (default US). */
export function parseOtpTarget(input: string): OtpTarget | null {
  const v = input.trim();
  if (!v) return null;
  if (v.includes('@')) {
    const r = Email.safeParse(v.toLowerCase());
    return r.success ? { kind: 'email', email: r.data } : null;
  }
  const phone = parsePhoneNumberFromString(v, 'US');
  return phone?.isValid() ? { kind: 'phone', phone: phone.number } : null;
}

export const OtpCode = z.string().regex(/^\d{6}$/);

/** Whole years between birth date and today (calendar math, no time zones). */
export function ageOn(
  birth: { y: number; m: number; d: number },
  today: { y: number; m: number; d: number },
): number {
  let age = today.y - birth.y;
  if (today.m < birth.m || (today.m === birth.m && today.d < birth.d)) age -= 1;
  return age;
}

/** Parses "YYYY-MM-DD" and checks it is a real calendar date in the past. */
export function parseBirthDate(
  s: string,
  today = new Date(),
): { y: number; m: number; d: number } | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return null;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const dt = new Date(Date.UTC(y, mo - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== mo - 1 || dt.getUTCDate() !== d)
    return null;
  if (y < 1900 || dt.getTime() > today.getTime()) return null;
  return { y, m: mo, d };
}

export function isAdult(birthDate: string, today = new Date()): boolean | null {
  const b = parseBirthDate(birthDate, today);
  if (!b) return null;
  return (
    ageOn(b, { y: today.getFullYear(), m: today.getMonth() + 1, d: today.getDate() }) >= MIN_AGE
  );
}
