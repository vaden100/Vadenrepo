import type { Metadata } from 'next';
import Link from 'next/link';
import { en } from '@rmmm/ui/web';
import { requireStaff } from '@/lib/admin/staff';

export const metadata: Metadata = { title: en.admin.nav.files };

const t = en.admin.files;
const KINDS = ['image', 'pdf', 'audio', 'video'] as const;
const STATUSES = [
  'ready',
  'processing',
  'uploaded',
  'awaiting_upload',
  'rejected',
  'failed',
] as const;
const PAGE = 48;

interface FileRow {
  id: string;
  kind: (typeof KINDS)[number];
  mime: string | null;
  bytes: number | null;
  upload_status: string;
  reject_reason: string | null;
  scan_status: string;
  voice_note: boolean;
  redacted_path: string | null;
  created_at: string;
  report: { id: string; public_code: string | null; status: string } | null;
}

const when = (d: string) =>
  new Date(d).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' });

/**
 * Every evidence file in one place (staff only). Rows come through the staff member's own
 * session (RLS on media); the files stream from private storage via /api/admin/media/:id.
 */
export default async function FilesPage({
  searchParams,
}: {
  searchParams: Promise<{ kind?: string; status?: string; page?: string }>;
}) {
  const { sb } = await requireStaff('/admin/files');
  const sp = await searchParams;
  const kind = (KINDS as readonly string[]).includes(sp.kind ?? '') ? sp.kind! : null;
  const status = (STATUSES as readonly string[]).includes(sp.status ?? '') ? sp.status! : null;
  const page = Math.max(1, Math.min(1000, Number(sp.page) || 1));

  let q = sb
    .from('media')
    .select(
      'id, kind, mime, bytes, upload_status, reject_reason, scan_status, voice_note, redacted_path, created_at, report:reports(id, public_code, status)',
      { count: 'exact' },
    )
    .order('created_at', { ascending: false })
    .range((page - 1) * PAGE, page * PAGE - 1);
  if (kind) q = q.eq('kind', kind);
  if (status) q = q.eq('upload_status', status);

  const [{ data, count }, kindCounts, { data: sources }] = await Promise.all([
    q,
    Promise.all(
      KINDS.map((k) =>
        sb
          .from('media')
          .select('id', { count: 'exact', head: true })
          .eq('kind', k)
          .then((r) => [k, r.count ?? 0] as const),
      ),
    ),
    sb.from('outside_sources').select('label, row_count, last_import_at'),
  ]);
  const files = (data ?? []) as unknown as FileRow[];
  const total = count ?? 0;
  const href = (p: Record<string, string | null | number>) => {
    const u = new URLSearchParams();
    const next = { kind, status, page: 1, ...p };
    for (const [k, v] of Object.entries(next))
      if (v && !(k === 'page' && v === 1)) u.set(k, String(v));
    const s = u.toString();
    return `/admin/files${s ? `?${s}` : ''}`;
  };

  return (
    <div className="stack-lg">
      <h1>{en.admin.nav.files}</h1>
      <p className="muted">{t.lede}</p>

      <section aria-labelledby="stored" className="stack">
        <h2 id="stored" className="h3">
          {t.data}
        </h2>
        <ul className="admin-tiles">
          {kindCounts.map(([k, n]) => (
            <li key={k}>
              <Link href={href({ kind: k })} className="admin-tile">
                <span className="admin-tile__n">{n}</span>
                <span>{t.kinds[k]}</span>
              </Link>
            </li>
          ))}
        </ul>
        {(sources ?? []).map((s) => (
          <p key={s.label} className="muted">
            {t.outside(s.row_count, s.label)}
            {s.last_import_at ? ` · ${when(s.last_import_at)}` : ''}
          </p>
        ))}
      </section>

      <nav aria-label={t.kind} className="stack">
        <ul className="admin-tabs">
          <li>
            <Link href={href({ kind: null })} aria-current={!kind ? 'page' : undefined}>
              {t.all}
            </Link>
          </li>
          {KINDS.map((k) => (
            <li key={k}>
              <Link href={href({ kind: k })} aria-current={kind === k ? 'page' : undefined}>
                {t.kinds[k]}
              </Link>
            </li>
          ))}
        </ul>
        <ul className="admin-tabs" aria-label={t.status}>
          <li>
            <Link href={href({ status: null })} aria-current={!status ? 'page' : undefined}>
              {t.all}
            </Link>
          </li>
          {STATUSES.map((s) => (
            <li key={s}>
              <Link href={href({ status: s })} aria-current={status === s ? 'page' : undefined}>
                {t.statuses[s]}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <p className="muted" role="status">
        {t.total(total)}
      </p>
      {files.length === 0 ? (
        <p className="muted">{t.none}</p>
      ) : (
        <ul className="file-grid">
          {files.map((f) => {
            const src = `/api/admin/media/${f.id}${f.redacted_path ? '?copy=covered' : ''}`;
            const label = `${f.voice_note ? t.voice : (t.kindOne[f.kind] ?? f.kind)}, ${when(f.created_at)}`;
            const ready = f.upload_status === 'ready';
            return (
              <li key={f.id} className="file-card" data-testid="file-card">
                <div className="file-card__preview">
                  {ready && f.kind === 'image' ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={src} alt={label} loading="lazy" />
                  ) : ready && f.kind === 'audio' ? (
                    <audio controls preload="none" src={src} aria-label={label} />
                  ) : ready && f.kind === 'video' ? (
                    <video controls preload="none" src={src} aria-label={label} />
                  ) : (
                    <span className="mono">{(f.mime ?? f.kind).toUpperCase()}</span>
                  )}
                </div>
                <div className="file-card__meta">
                  <p className="mono">{label}</p>
                  <p>
                    <span className="pill">{t.statuses[f.upload_status] ?? f.upload_status}</span>
                    {f.redacted_path && <span className="pill">{t.covered}</span>}
                    {f.bytes ? <span className="muted"> {t.size(f.bytes)}</span> : null}
                  </p>
                  {f.reject_reason && (
                    <p className="muted">
                      {en.report.receipts.rejectReasons[f.reject_reason] ?? f.reject_reason}
                    </p>
                  )}
                  <p>
                    {f.report && (
                      <Link href={`/admin/reports/${f.report.id}`} className="mono">
                        {t.report} {f.report.public_code ?? f.report.id.slice(0, 8)}
                      </Link>
                    )}
                    {ready && (
                      <>
                        {' · '}
                        <a href={src} target="_blank" rel="noopener noreferrer">
                          {t.open}
                        </a>
                      </>
                    )}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <nav aria-label={t.page(page)} className="row">
        {page > 1 && <Link href={href({ page: page - 1 })}>{t.newer}</Link>}
        {page * PAGE < total && <Link href={href({ page: page + 1 })}>{t.older}</Link>}
      </nav>
    </div>
  );
}
