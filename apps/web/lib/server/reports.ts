import type {
  MediaKind,
  MediaView,
  MoneyStep,
  ReportDraftView,
  ReportStatusView,
  WhoStep,
} from '@rmmm/api';
import { centsToAmount } from '@rmmm/api';
import { db, q } from './db';
import type { ReportRow } from './report-access';

export interface MediaRow {
  id: string;
  report_id: string;
  kind: MediaKind;
  storage_path: string;
  mime: string | null;
  bytes: number | null;
  duration_ms: number | null;
  upload_status: MediaView['uploadStatus'];
  reject_reason: string | null;
  voice_note: boolean;
  created_at: string;
}

interface IdentRow {
  field: keyof WhoStep;
  raw: string;
}

const yn = (v: boolean | null): 'yes' | 'no' | undefined =>
  v === null ? undefined : v ? 'yes' : 'no';

export const mediaView = (m: MediaRow): MediaView => ({
  id: m.id,
  kind: m.kind,
  mime: m.mime,
  bytes: m.bytes,
  durationMs: m.duration_ms,
  uploadStatus: m.upload_status,
  rejectReason: m.reject_reason,
  voiceNote: m.voice_note,
  createdAt: m.created_at,
});

export async function listMedia(reportId: string): Promise<MediaRow[]> {
  return db.select<MediaRow>(
    'media',
    `report_id=eq.${q(reportId)}&select=id,report_id,kind,storage_path,mime,bytes,duration_ms,upload_status,reject_reason,voice_note,created_at&order=created_at.asc`,
  );
}

/** Everything the flow needs to resume a draft. Never includes hashes, IPs or devices. */
export async function draftView(r: ReportRow): Promise<ReportDraftView> {
  const [idents, media] = await Promise.all([
    db.select<IdentRow>('report_identifiers', `report_id=eq.${q(r.id)}&select=field,raw`),
    listMedia(r.id),
  ]);
  const who: Partial<WhoStep> = {};
  for (const i of idents) who[i.field] = i.raw;
  if (r.city) who.city = r.city;
  if (r.state) who.state = r.state;
  const money: Partial<MoneyStep> = {
    amount: centsToAmount(r.amount_cents),
    currency: (r.currency as MoneyStep['currency']) ?? 'USD',
    paidOn: r.paid_on ?? undefined,
    rail: (r.rail as MoneyStep['rail']) ?? undefined,
    wasDeposit: yn(r.was_deposit),
    refundRequested: yn(r.refund_requested),
    refundResponse: r.refund_response ?? undefined,
  };
  return {
    id: r.id,
    status: r.status,
    step: r.step,
    category: r.category ?? undefined,
    who,
    money,
    story: r.story ?? '',
    media: media.map(mediaView),
  };
}

/** Status for the reporter's own report (status page, account list). */
export async function statusView(r: ReportRow): Promise<ReportStatusView> {
  const media = await listMedia(r.id);
  return {
    id: r.id,
    code: r.public_code,
    status: r.status,
    submittedAt: r.submitted_at,
    files: media.filter((m) => m.upload_status !== 'rejected').length,
    filesProcessing: media.filter((m) => ['uploaded', 'processing'].includes(m.upload_status))
      .length,
  };
}
