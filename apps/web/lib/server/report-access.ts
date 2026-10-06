import { randomBytes } from 'node:crypto';
import type { NextRequest, NextResponse } from 'next/server';
import { sha256Hex } from '@/lib/security/client';
import { getSession } from '@/lib/session';
import { db, q } from './db';

/**
 * Who may touch a report (SPEC 3, 9): the signed-in reporter, or the holder of the
 * anonymous draft cookie (random token, only its hash is stored), or after submission the
 * holder of a claim session. Everything else is 404 (no existence leak).
 */
export const DRAFT_COOKIE = 'rmmm_draft';
export const CLAIM_COOKIE = 'rmmm_claim';

export interface ReportRow {
  id: string;
  public_code: string | null;
  reporter_id: string | null;
  status: string;
  step: number;
  category: string | null;
  story: string | null;
  amount_cents: number | null;
  currency: string;
  paid_on: string | null;
  rail: string | null;
  was_deposit: boolean | null;
  refund_requested: boolean | null;
  refund_response: string | null;
  city: string | null;
  state: string | null;
  draft_token_hash: string | null;
  anon_claim_hash: string | null;
  created_at: string;
  submitted_at: string | null;
}

export function newToken(): string {
  return randomBytes(32).toString('base64url');
}

/** Cookie value "<reportId>.<token>". */
export function parsePair(v: string | undefined): { id: string; token: string } | null {
  if (!v) return null;
  const [id, token] = v.split('.');
  return id && token && /^[0-9a-f-]{36}$/.test(id) ? { id, token } : null;
}

export function setOwnerCookie(
  res: NextResponse,
  req: NextRequest,
  name: string,
  value: string,
  maxAgeDays: number,
) {
  res.cookies.set(name, value, {
    httpOnly: true,
    secure: req.nextUrl.protocol === 'https:',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * maxAgeDays,
  });
}

export type Access = {
  report: ReportRow;
  via: 'account' | 'draft' | 'claim';
  userId: string | null;
};

export async function reportAccess(req: NextRequest, id: string): Promise<Access | null> {
  if (!/^[0-9a-f-]{36}$/.test(id)) return null;
  const [row] = await db.select<ReportRow>('reports', `id=eq.${q(id)}&select=*`);
  if (!row) return null;

  const session = await getSession();
  if (session && row.reporter_id === session.user.id)
    return { report: row, via: 'account', userId: session.user.id };

  const draft = parsePair(req.cookies.get(DRAFT_COOKIE)?.value);
  if (
    draft?.id === id &&
    row.draft_token_hash &&
    row.draft_token_hash === (await sha256Hex(`draft:${draft.token}`))
  ) {
    return { report: row, via: 'draft', userId: session?.user.id ?? null };
  }

  const claim = parsePair(req.cookies.get(CLAIM_COOKIE)?.value);
  if (
    claim?.id === id &&
    row.anon_claim_hash &&
    row.anon_claim_hash === (await sha256Hex(`claim:${claim.token}`))
  ) {
    return { report: row, via: 'claim', userId: null };
  }
  return null;
}

/** Drafts and reports where we asked for more evidence can be edited; nothing else. */
export const editable = (status: string) => status === 'draft' || status === 'needs_evidence';
