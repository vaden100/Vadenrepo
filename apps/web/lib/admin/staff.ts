import { notFound, redirect } from 'next/navigation';
import { headers } from 'next/headers';
import type { SupabaseClient } from '@supabase/supabase-js';
import { supabaseServer } from '@/lib/supabase/server';

export type StaffRole = 'moderator' | 'editor' | 'admin';
export const STAFF_ROLES: readonly StaffRole[] = ['moderator', 'editor', 'admin'];

export interface Staff {
  /** Supabase client acting as the staff member: RLS and the audit trigger see who they are. */
  sb: SupabaseClient;
  userId: string;
  role: StaffRole;
  name: string;
}

export type StaffCheck =
  | { ok: true; staff: Staff }
  | { ok: false; reason: 'unconfigured' | 'signed_out' | 'not_staff' | 'needs_mfa' };

/**
 * Staff = signed in, role moderator/editor/admin, not banned, and the session is aal2
 * (TOTP verified this sign-in). Postgres re-checks all of it on every query (private.is_staff()).
 */
export async function checkStaff(): Promise<StaffCheck> {
  const sb = await supabaseServer();
  if (!sb) return { ok: false, reason: 'unconfigured' };
  const { data } = await sb.auth.getUser();
  if (!data.user) return { ok: false, reason: 'signed_out' };
  const { data: profile } = await sb
    .from('profiles')
    .select('role, display_name, banned_at')
    .eq('id', data.user.id)
    .single<{ role: string; display_name: string | null; banned_at: string | null }>();
  if (!profile || profile.banned_at || !STAFF_ROLES.includes(profile.role as StaffRole)) {
    return { ok: false, reason: 'not_staff' };
  }
  const { data: aal } = await sb.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aal?.currentLevel !== 'aal2') return { ok: false, reason: 'needs_mfa' };
  return {
    ok: true,
    staff: {
      sb,
      userId: data.user.id,
      role: profile.role as StaffRole,
      name: profile.display_name || data.user.email || data.user.phone || data.user.id.slice(0, 8),
    },
  };
}

/** Optional allowlist for the admin console (SPEC 11): ADMIN_IP_ALLOWLIST="203.0.113.0/24,198.51.100.7". */
export function adminIpAllowed(ip: string | null, list = process.env.ADMIN_IP_ALLOWLIST): boolean {
  if (!list?.trim()) return true;
  if (!ip) return false;
  return list
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .some((entry) => ipInCidr(ip, entry));
}

function ipv4ToInt(ip: string): number | null {
  const parts = ip.split('.').map(Number);
  if (parts.length !== 4 || parts.some((p) => !Number.isInteger(p) || p < 0 || p > 255))
    return null;
  return ((parts[0]! << 24) >>> 0) + (parts[1]! << 16) + (parts[2]! << 8) + parts[3]!;
}

export function ipInCidr(ip: string, cidr: string): boolean {
  const [base, bitsRaw] = cidr.split('/');
  if (!base) return false;
  if (!base.includes('.') || !ip.includes('.'))
    return ip.toLowerCase() === base.toLowerCase() && !bitsRaw;
  const a = ipv4ToInt(ip);
  const b = ipv4ToInt(base);
  const bits = bitsRaw === undefined ? 32 : Number(bitsRaw);
  if (a === null || b === null || !Number.isInteger(bits) || bits < 0 || bits > 32) return false;
  const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0;
  return (a & mask) >>> 0 === (b & mask) >>> 0;
}

/** For pages: send people where they need to go, and hide the console from everyone else. */
export async function requireStaff(
  from: string,
  roles: readonly StaffRole[] = STAFF_ROLES,
): Promise<Staff> {
  const h = await headers();
  const ip =
    (h.get(process.env.CLIENT_IP_HEADER || 'x-forwarded-for') ?? '').split(',')[0]?.trim() || null;
  if (!adminIpAllowed(ip)) notFound();
  const check = await checkStaff();
  if (!check.ok) {
    if (check.reason === 'signed_out') redirect(`/auth?next=${encodeURIComponent(from)}`);
    if (check.reason === 'needs_mfa') redirect(`/admin/mfa?next=${encodeURIComponent(from)}`);
    notFound();
  }
  if (!roles.includes(check.staff.role)) notFound();
  return check.staff;
}
