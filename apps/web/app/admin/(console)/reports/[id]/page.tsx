import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { centsToAmount } from '@rmmm/api';
import { en } from '@rmmm/ui/web';
import { EvidencePanel, type EvidenceItem } from '@/components/admin/EvidencePanel';
import { BanPanel, EntityPanel, ModerationPanel } from '@/components/admin/ReportPanels';
import { requireStaff } from '@/lib/admin/staff';

export const metadata: Metadata = { title: en.admin.nav.reports };

const t = en.admin;

const REPORT_COLS =
  'id, public_code, status, category, story, amount_cents, currency, paid_on, rail, was_deposit, refund_requested, refund_response, city, state, consent_contact, on_camera, contact_mode, submitted_at, public_excerpt, evidence_request, staff_note, rejected_reason, auto_flags';

interface MediaRow {
  id: string;
  kind: EvidenceItem['kind'];
  upload_status: string;
  reject_reason: string | null;
  voice_note: boolean;
  redacted_path: string | null;
  ocr_text: string | null;
  transcript: string | null;
  scan_status: string;
  extracted: { duplicateOf?: string[] } | null;
}

const yn = (v: boolean | null) => (v === null ? '' : v ? en.report.money.yes : en.report.money.no);

export default async function ReportDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const staff = await requireStaff(`/admin/reports/${id}`);
  const { sb, role } = staff;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const [{ data: r }, { data: idents }, { data: media }, { data: links }, { data: source }] =
    await Promise.all([
      sb.from('reports').select(REPORT_COLS).eq('id', id).maybeSingle(),
      sb.from('report_identifiers').select('field, type, raw').eq('report_id', id).order('field'),
      sb
        .from('media')
        .select(
          'id, kind, upload_status, reject_reason, voice_note, redacted_path, ocr_text, transcript, scan_status, extracted',
        )
        .eq('report_id', id)
        .order('created_at'),
      sb
        .from('report_entities')
        .select('entity:entities(id, display_name, is_public)')
        .eq('report_id', id),
      sb.rpc('report_source_known', { report: id }),
    ]);
  if (!r) notFound();
  const files = (media ?? []) as MediaRow[];
  const flags = (r.auto_flags ?? {}) as { deviceReports24h?: number };
  const signals = [
    (flags.deviceReports24h ?? 0) > 0
      ? t.signals.deviceReports((flags.deviceReports24h ?? 0) + 1)
      : null,
    files.some((f) => f.extracted?.duplicateOf?.length) ? t.signals.duplicateMedia : null,
    files.some((f) => f.upload_status === 'rejected')
      ? t.signals.rejectedFiles(files.filter((f) => f.upload_status === 'rejected').length)
      : null,
  ].filter(Boolean) as string[];
  const canModerate = role === 'moderator' || role === 'admin';
  const whoLabels = en.report.who as Record<string, string>;
  const linked = (
    (links ?? []) as unknown as {
      entity: { id: string; display_name: string; is_public: boolean } | null;
    }[]
  )
    .map((l) => l.entity)
    .filter(Boolean)
    .map((e) => ({ id: e!.id, name: e!.display_name, isPublic: e!.is_public }));
  const src = (source ?? { ip: false, device: false }) as { ip: boolean; device: boolean };

  return (
    <div className="stack-lg">
      <div className="stack">
        <p className="eyebrow">{t.status[r.status] ?? r.status}</p>
        <h1 className="mono">{r.public_code}</h1>
        <p className="muted">
          {r.category
            ? en.report.category.options[r.category as keyof typeof en.report.category.options]
            : ''}
          {r.submitted_at ? ` · ${new Date(r.submitted_at).toUTCString()}` : ''}
        </p>
      </div>

      <div className="admin-columns">
        <div className="stack-lg">
          <section aria-labelledby="story" className="stack">
            <h2 id="story">{t.report.story}</h2>
            <p className="pre">{r.story || t.report.noStory}</p>
          </section>
          <section aria-labelledby="who" className="stack">
            <h2 id="who">{t.report.who}</h2>
            <dl className="review__list">
              {(idents ?? []).map((i) => (
                <div key={i.field}>
                  <dt>{whoLabels[i.field] ?? i.field}</dt>
                  <dd className="mono">{i.raw}</dd>
                </div>
              ))}
              {(r.city || r.state) && (
                <div>
                  <dt>{en.report.who.groupPlace}</dt>
                  <dd>{[r.city, r.state].filter(Boolean).join(', ')}</dd>
                </div>
              )}
            </dl>
          </section>
          <section aria-labelledby="money" className="stack">
            <h2 id="money">{t.report.money}</h2>
            <dl className="review__list">
              <div>
                <dt>{en.report.money.amount}</dt>
                <dd>
                  {r.amount_cents !== null
                    ? `${centsToAmount(r.amount_cents)} ${r.currency}`
                    : en.report.review.nothing}
                </dd>
              </div>
              <div>
                <dt>{en.report.money.paidOn}</dt>
                <dd>{r.paid_on ?? en.report.review.nothing}</dd>
              </div>
              <div>
                <dt>{en.report.money.rail}</dt>
                <dd>
                  {r.rail
                    ? en.report.money.rails[r.rail as keyof typeof en.report.money.rails]
                    : en.report.review.nothing}
                </dd>
              </div>
              <div>
                <dt>{en.report.money.wasDeposit}</dt>
                <dd>{yn(r.was_deposit)}</dd>
              </div>
              <div>
                <dt>{en.report.money.refundRequested}</dt>
                <dd>{yn(r.refund_requested)}</dd>
              </div>
              {r.refund_response && (
                <div>
                  <dt>{en.report.money.refundResponse}</dt>
                  <dd>{r.refund_response}</dd>
                </div>
              )}
            </dl>
          </section>
          <section aria-labelledby="evidence" className="stack">
            <h2 id="evidence">{t.report.evidence}</h2>
            <EvidencePanel
              canModerate={canModerate}
              items={files.map((f) => ({
                id: f.id,
                kind: f.kind,
                status: f.upload_status,
                rejectReason: f.reject_reason,
                voiceNote: f.voice_note,
                covered: Boolean(f.redacted_path),
                ocr: f.ocr_text,
                transcript: f.transcript,
                scan: f.scan_status,
              }))}
            />
          </section>
        </div>

        <div className="stack-lg">
          <section aria-labelledby="checks" className="stack">
            <h2 id="checks">{t.report.checks}</h2>
            {signals.length ? (
              <ul className="admin-list">
                {signals.map((s) => (
                  <li key={s}>
                    <span className="pill pill--alert">{s}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="muted">{t.signals.none}</p>
            )}
          </section>
          <section aria-labelledby="moderation" className="stack">
            <h2 id="moderation">{t.report.moderation}</h2>
            <ModerationPanel
              id={r.id}
              status={r.status}
              excerpt={r.public_excerpt ?? ''}
              note={r.staff_note ?? ''}
              evidenceRequest={r.evidence_request ?? ''}
              canModerate={canModerate}
            />
          </section>
          <section aria-labelledby="entities" className="stack">
            <h2 id="entities">{t.report.entities}</h2>
            <EntityPanel
              reportId={r.id}
              suggestedName={(idents ?? []).find((i) => i.field === 'businessName')?.raw ?? ''}
              linked={linked}
              canModerate={canModerate}
            />
          </section>
          <section aria-labelledby="source" className="stack">
            <h2 id="source">{t.report.source}</h2>
            <BanPanel
              reportId={r.id}
              ipKnown={src.ip}
              deviceKnown={src.device}
              isAdmin={role === 'admin'}
            />
          </section>
        </div>
      </div>
    </div>
  );
}
