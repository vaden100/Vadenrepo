import type { Metadata } from 'next';
import Link from 'next/link';
import { en } from '@rmmm/ui/web';
import { requireStaff } from '@/lib/admin/staff';

export const metadata: Metadata = { title: en.admin.nav.reports };

const t = en.admin;
const TABS = [
  'triage',
  'submitted',
  'needs_evidence',
  'ready_for_review',
  'approved',
  'rejected',
] as const;

interface Row {
  id: string;
  public_code: string;
  category: string | null;
  status: string;
  submitted_at: string;
  auto_flags: { deviceReports24h?: number; identifiers?: number; files?: number } | null;
}

const fmt = (d: string) =>
  new Date(d).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' });

export default async function ReportsQueue({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { sb } = await requireStaff('/admin/reports');
  const sp = await searchParams;
  const status = (TABS as readonly string[]).includes(sp.status ?? '') ? sp.status! : 'triage';
  const { data } = await sb
    .from('reports')
    .select('id, public_code, category, status, submitted_at, auto_flags')
    .eq('status', status)
    .order('submitted_at', { ascending: true })
    .limit(200);
  const rows = (data ?? []) as Row[];
  return (
    <div className="stack-lg">
      <h1>{t.nav.reports}</h1>
      <nav aria-label={t.table.status}>
        <ul className="admin-tabs">
          {TABS.map((s) => (
            <li key={s}>
              <Link
                href={`/admin/reports?status=${s}`}
                aria-current={s === status ? 'page' : undefined}
              >
                {t.status[s]}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      {rows.length === 0 ? (
        <p className="muted">{t.empty.reports}</p>
      ) : (
        <div className="table-scroll" role="region" aria-label={t.status[status]} tabIndex={0}>
          <table className="admin-table">
            <thead>
              <tr>
                <th scope="col">{t.table.code}</th>
                <th scope="col">{t.table.category}</th>
                <th scope="col">{t.table.submitted}</th>
                <th scope="col">{t.table.files}</th>
                <th scope="col">{t.table.signals}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>
                    <Link href={`/admin/reports/${r.id}`} className="mono">
                      {r.public_code}
                    </Link>
                  </td>
                  <td>
                    {r.category
                      ? en.report.category.options[
                          r.category as keyof typeof en.report.category.options
                        ]
                      : ''}
                  </td>
                  <td>{fmt(r.submitted_at)}</td>
                  <td>{r.auto_flags?.files ?? 0}</td>
                  <td>
                    {(r.auto_flags?.deviceReports24h ?? 0) > 0 ? (
                      <span className="pill pill--alert">
                        {t.signals.deviceReports((r.auto_flags?.deviceReports24h ?? 0) + 1)}
                      </span>
                    ) : (
                      <span className="muted">{t.signals.none}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
