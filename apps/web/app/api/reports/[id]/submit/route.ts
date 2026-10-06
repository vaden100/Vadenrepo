import { randomBytes } from 'node:crypto';
import type { NextRequest } from 'next/server';
import {
  fieldErrors,
  formatClaimCode,
  REPORT_CONSENT_VERSION,
  STORY_MIN,
  SubmitInput,
  type SubmitResult,
} from '@rmmm/api';
import { extractIdentifiers } from '@rmmm/search-core';
import { apiError, handler, json, readJson, requestId, sameOrigin } from '@/lib/api';
import { serverEnv } from '@/lib/env';
import { log } from '@/lib/log';
import {
  clientIp,
  DEVICE_COOKIE,
  DEVICE_HEADER,
  deviceHash,
  sha256Hex,
} from '@/lib/security/client';
import { verifyTurnstile } from '@/lib/security/turnstile';
import { db, q } from '@/lib/server/db';
import {
  CLAIM_COOKIE,
  DRAFT_COOKIE,
  editable,
  reportAccess,
  setOwnerCookie,
  type ReportRow,
} from '@/lib/server/report-access';
import { listMedia } from '@/lib/server/reports';
import { caller } from '@/lib/server/caller';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ id: string }> };

/**
 * POST /api/reports/:id/submit (SPEC 4.1 step 7). Re-validates everything on the server,
 * re-checks bans, mints the case code, and for anonymous reports a claim code that is shown
 * once and stored only as a hash. Consents are written to consents_log with their version.
 */
export const POST = handler<Ctx>('reports.submit', async (req: NextRequest, { params }) => {
  if (!sameOrigin(req)) return apiError(403, 'forbidden', 'Request refused.');
  const access = await reportAccess(req, (await params).id);
  if (!access) return apiError(404, 'not_found', 'That report was not found.');
  const r = access.report;
  if (!editable(r.status)) return apiError(409, 'conflict', 'This report was already sent.');

  const parsed = SubmitInput.safeParse(await readJson(req));
  if (!parsed.success)
    return apiError(422, 'invalid', 'Some fields need attention.', fieldErrors(parsed.error));
  const input = parsed.data;

  // The draft itself must be complete; the browser checks too, but only this counts.
  const [idents, media] = await Promise.all([
    db.select<{ type: string }>('report_identifiers', `report_id=eq.${q(r.id)}&select=type`),
    listMedia(r.id),
  ]);
  const missing: Record<string, string> = {};
  if (!r.category) missing.category = 'required';
  if (idents.length === 0) missing.who = 'identifier_required';
  const hasVoice = media.some((m) => m.voice_note && m.upload_status !== 'rejected');
  if ((r.story ?? '').trim().length < STORY_MIN && !hasVoice) missing.story = 'too_short';
  if (media.some((m) => m.upload_status === 'awaiting_upload')) missing.media = 'uploading';
  if (Object.keys(missing).length)
    return apiError(422, 'invalid', 'Some steps need attention.', missing);

  const env = serverEnv();
  const ip = clientIp(req.headers, env.clientIpHeader);
  if (!(await verifyTurnstile(input.turnstileToken, ip))) {
    return apiError(400, 'invalid', 'The verification check did not pass. Try again.', {
      turnstileToken: 'failed',
    });
  }
  const app = req.headers.get(DEVICE_HEADER);
  const device = app
    ? await deviceHash('app', app)
    : await deviceHash('web', req.cookies.get(DEVICE_COOKIE)?.value);
  // The proxy fails open on lookups; writes re-check bans in Postgres (SPEC 11).
  if (await db.rpc<boolean>('is_banned', { ip, device_hash: device })) {
    return apiError(403, 'forbidden', 'Request refused.');
  }

  const firstSubmit = r.status === 'draft';
  // Signed in during the flow (step 6 offers it): the report joins their account.
  const who = r.reporter_id ? null : await caller(req);
  const member = who?.onboarded ? who.userId : null;
  const reporterId = r.reporter_id ?? member;
  const anonymous = !reporterId;
  const claimCode = firstSubmit && anonymous ? formatClaimCode(randomBytes(12)) : null;
  const code = r.public_code ?? (await db.rpc<string>('next_report_code'));

  // SPEC 10.1 automated checks, recorded for the triage queue (never shown publicly).
  const recent = device
    ? await db.select<{ id: string }>(
        'reports',
        `submitted_device=eq.${q(device)}&submitted_at=gte.${q(new Date(Date.now() - 86_400_000).toISOString())}&select=id`,
      )
    : [];
  const inStory = extractIdentifiers(r.story ?? '');
  const autoFlags = {
    deviceReports24h: recent.length,
    identifiers: idents.length,
    files: media.length,
    storyLength: (r.story ?? '').length,
    storyMentions: {
      handles: inStory.handles.length,
      phones: inStory.phones.length,
      emails: inStory.emails.length,
      cashtags: inStory.cashtags.length,
    },
  };

  const patch: Record<string, unknown> = {
    status: 'submitted',
    public_code: code,
    submitted_at: new Date().toISOString(),
    consent_truth: true,
    consent_terms: true,
    consent_contact: input.consentContact && !anonymous,
    on_camera: input.onCamera ?? null,
    age_confirmed: true,
    reporter_id: reporterId,
    contact_mode: anonymous ? 'anonymous' : 'account',
    submitted_ip: ip,
    submitted_device: device,
    draft_token_hash: null,
    auto_flags: autoFlags,
    step: 7,
  };
  if (claimCode) patch.anon_claim_hash = await sha256Hex(`claim:${claimCode}`);
  const [updated] = await db.update<ReportRow>(
    'reports',
    `id=eq.${q(r.id)}&status=in.(draft,needs_evidence)`,
    patch,
    'id,status',
  );
  if (!updated) return apiError(409, 'conflict', 'This report was already sent.');

  const consent = (name: string, value: boolean) => ({
    user_id: reporterId,
    report_id: r.id,
    consent: name,
    value,
    version: REPORT_CONSENT_VERSION,
  });
  await db.insert(
    'consents_log',
    [
      consent('report_truth', true),
      consent('report_terms', true),
      consent('report_age_18', true),
      consent('report_contact', input.consentContact && !anonymous),
      ...(input.onCamera
        ? [consent(`report_on_camera_${input.onCamera}`, input.onCamera !== 'no')]
        : []),
    ],
    'id',
  );
  const status = await db.rpc<string>('advance_report_after_processing', { report: r.id });

  log('info', 'report.submitted', {
    requestId: requestId(req),
    mode: anonymous ? 'anonymous' : 'account',
    files: media.length,
    resubmit: !firstSubmit,
  });
  const res = json<SubmitResult>({ id: r.id, code, claimCode, status }, 201);
  res.cookies.delete(DRAFT_COOKIE);
  if (claimCode) setOwnerCookie(res, req, CLAIM_COOKIE, `${r.id}.${claimCode}`, 30);
  return res;
});
