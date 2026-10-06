import Link from 'next/link';
import { en } from '@rmmm/ui/web';
import { requireStaff } from '@/lib/admin/staff';

const t = en.admin;
const QUEUE = [
  'submitted',
  'triage',
  'needs_evidence',
  'ready_for_review',
  'approved',
  'rejected',
] as const;

interface Counts {
  reports: Record<string, number>;
  flagsOpen: number;
  flagsOverdue: number;
  disputesOpen: number;
  disputesOverdue: number;
  entitiesAwaiting: number;
}

export default async function AdminDashboard() {
  const { sb } = await requireStaff('/admin');
  const { data } = await sb.rpc('admin_counts');
  const c = (data ?? {
    reports: {},
    flagsOpen: 0,
    flagsOverdue: 0,
    disputesOpen: 0,
    disputesOverdue: 0,
    entitiesAwaiting: 0,
  }) as Counts;
  return (
    <div className="stack-lg">
      <h1>{t.nav.dashboard}</h1>
      <section aria-labelledby="queue-title" className="stack">
        <h2 id="queue-title">{t.dashboard.queue}</h2>
        <ul className="admin-tiles">
          {QUEUE.map((s) => (
            <li key={s}>
              <Link href={`/admin/reports?status=${s}`} className="admin-tile">
                <span className="admin-tile__n">{c.reports[s] ?? 0}</span>
                <span>{t.status[s]}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
      <ul className="admin-alerts">
        <li>
          <Link href="/admin/flags">{t.dashboard.flagsOpen(c.flagsOpen)}</Link>
          {c.flagsOverdue > 0 && (
            <span className="pill pill--alert">{t.dashboard.flagsOverdue(c.flagsOverdue)}</span>
          )}
        </li>
        <li>
          <Link href="/admin/disputes">{t.dashboard.disputesOpen(c.disputesOpen)}</Link>
          {c.disputesOverdue > 0 && (
            <span className="pill pill--alert">
              {t.dashboard.disputesOverdue(c.disputesOverdue)}
            </span>
          )}
        </li>
        <li>
          <Link href="/admin/entities">{t.dashboard.entitiesAwaiting(c.entitiesAwaiting)}</Link>
        </li>
      </ul>
    </div>
  );
}
