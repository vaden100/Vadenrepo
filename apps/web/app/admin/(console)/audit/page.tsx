import type { Metadata } from 'next';
import Link from 'next/link';
import { en } from '@rmmm/ui/web';
import { requireStaff } from '@/lib/admin/staff';

export const metadata: Metadata = { title: en.admin.nav.audit };

const t = en.admin;
const TABLES = [
  'reports',
  'entities',
  'entity_approvals',
  'entity_identifiers',
  'entity_links',
  'media',
  'ip_bans',
  'device_bans',
  'content_flags',
  'disputes',
  'profiles',
];

interface Row {
  id: number;
  actor: string | null;
  action: string;
  target_type: string | null;
  target_id: string | null;
  meta: { changes?: Record<string, unknown> } | null;
  created_at: string;
}

export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<{ table?: string }>;
}) {
  const { sb } = await requireStaff('/admin/audit', ['admin']);
  const table = (await searchParams).table;
  let q = sb
    .from('audit_log')
    .select('id, actor, action, target_type, target_id, meta, created_at')
    .order('id', { ascending: false })
    .limit(300);
  if (table && TABLES.includes(table)) q = q.eq('target_type', table);
  const rows = ((await q).data ?? []) as Row[];
  return (
    <div className="stack-lg">
      <h1>{t.nav.audit}</h1>
      <p className="muted">{t.audit.lede}</p>
      <nav aria-label={t.audit.filter}>
        <ul className="admin-tabs">
          <li>
            <Link href="/admin/audit" aria-current={!table ? 'page' : undefined}>
              {t.audit.all}
            </Link>
          </li>
          {TABLES.map((x) => (
            <li key={x}>
              <Link
                href={`/admin/audit?table=${x}`}
                aria-current={table === x ? 'page' : undefined}
              >
                {x}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      {rows.length === 0 ? (
        <p className="muted">{t.empty.audit}</p>
      ) : (
        <div className="table-scroll" role="region" aria-label={t.nav.audit} tabIndex={0}>
          <table className="admin-table">
            <thead>
              <tr>
                <th scope="col">{t.table.when}</th>
                <th scope="col">{t.table.who}</th>
                <th scope="col">{t.table.what}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="mono">
                    {new Date(r.created_at).toISOString().replace('T', ' ').slice(0, 19)}
                  </td>
                  <td className="mono">{r.actor?.slice(0, 8) ?? ''}</td>
                  <td>
                    {r.action} {r.target_type}{' '}
                    <span className="mono">{r.target_id?.slice(0, 8)}</span>
                    {r.meta?.changes && (
                      <span className="muted"> ({Object.keys(r.meta.changes).join(', ')})</span>
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
