import type { NextRequest, NextResponse } from 'next/server';
import { apiError, handler, sameOrigin } from '@/lib/api';
import { clientIp } from '@/lib/security/client';
import { serverEnv } from '@/lib/env';
import { adminIpAllowed, checkStaff, STAFF_ROLES, type Staff, type StaffRole } from './staff';

interface PgError {
  code?: string;
  message?: string;
}

/** Postgres refusals become messages a staff member can act on. */
export function pgError(e: PgError | null | undefined): NextResponse | null {
  if (!e) return null;
  if (e.code === '42501') {
    const hold = e.message?.includes('legal hold');
    return apiError(
      403,
      'forbidden',
      hold ? 'This is under legal hold.' : 'You do not have permission for that.',
    );
  }
  if (e.code === '23514' || e.code === 'P0001')
    return apiError(422, 'invalid', e.message ?? 'Check the form.');
  if (e.code === '23505') return apiError(409, 'conflict', 'That already exists.');
  if (e.code === '22P02' || e.code === '22023')
    return apiError(422, 'invalid', 'A value is not valid.');
  throw new Error(`postgres ${e.code}: ${e.message}`);
}

/**
 * /api/admin/* (SPEC 9): staff only, 2FA, same-origin, rate limited by the proxy. Writes go
 * through the staff member's own session, so Postgres audits them under their id.
 * Non-staff get 404 so the console does not advertise itself.
 */
export function adminRoute<C = unknown>(
  name: string,
  fn: (req: NextRequest, staff: Staff, ctx: C) => Promise<NextResponse>,
  roles: readonly StaffRole[] = STAFF_ROLES,
) {
  return handler<C>(`admin.${name}`, async (req, ctx) => {
    if (req.method !== 'GET' && !sameOrigin(req))
      return apiError(403, 'forbidden', 'Request refused.');
    if (!adminIpAllowed(clientIp(req.headers, serverEnv().clientIpHeader)))
      return apiError(404, 'not_found', 'Not found.');
    const check = await checkStaff();
    if (!check.ok) {
      if (check.reason === 'signed_out') return apiError(401, 'unauthorized', 'Sign in again.');
      if (check.reason === 'needs_mfa')
        return apiError(403, 'forbidden', 'Verify with your authenticator app first.');
      return apiError(404, 'not_found', 'Not found.');
    }
    if (!roles.includes(check.staff.role))
      return apiError(403, 'forbidden', 'You do not have permission for that.');
    return fn(req, check.staff, ctx);
  });
}
