import type { Metadata } from 'next';
import Link from 'next/link';
import { en } from '@rmmm/ui/web';
import { Deadline } from '@/components/admin/Deadline';
import { DisputeForm } from '@/components/admin/QueueForms';
import { requireStaff } from '@/lib/admin/staff';
import { renderTime } from '@/lib/admin/time';

export const metadata: Metadata = { title: en.admin.nav.disputes };

const t = en.admin;

interface Dispute {
  id: string;
  entity_id: string | null;
  contact_name: string | null;
  contact_email: string | null;
  body: string;
  status: string;
  outcome: string | null;
  staff_note: string | null;
  due_at: string;
  created_at: string;
  entity: { display_name: string } | null;
}

export default async function DisputesPage() {
  const { sb } = await requireStaff('/admin/disputes');
  const { data } = await sb
    .from('disputes')
    .select(
      'id, entity_id, contact_name, contact_email, body, status, outcome, staff_note, due_at, created_at, entity:entities(display_name)',
    )
    .order('status')
    .order('due_at')
    .limit(200);
  const rows = (data ?? []) as unknown as Dispute[];
  const now = renderTime();
  return (
    <div className="stack-lg">
      <h1>{t.nav.disputes}</h1>
      <p className="muted">{t.disputes.lede}</p>
      {rows.length === 0 ? (
        <p className="muted">{t.empty.disputes}</p>
      ) : (
        <ul className="admin-cards">
          {rows.map((d) => (
            <li key={d.id} className="admin-card">
              <div className="row">
                <span className="pill">{t.disputes.status[d.status] ?? d.status}</span>
                {d.status !== 'resolved' && <Deadline due={d.due_at} now={now} />}
                {d.entity_id && (
                  <span>
                    {t.disputes.entity}:{' '}
                    <Link href={`/admin/entities/${d.entity_id}`}>
                      {d.entity?.display_name ?? d.entity_id.slice(0, 8)}
                    </Link>
                  </span>
                )}
              </div>
              <p className="muted">
                {t.disputes.from}: {d.contact_name ?? ''}{' '}
                {d.contact_email ? `<${d.contact_email}>` : ''}
              </p>
              <p className="pre">{d.body}</p>
              {d.outcome && <p>{t.disputes.outcomes[d.outcome] ?? d.outcome}</p>}
              <DisputeForm id={d.id} status={d.status} note={d.staff_note ?? ''} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
