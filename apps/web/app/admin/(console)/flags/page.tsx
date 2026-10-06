import type { Metadata } from 'next';
import Link from 'next/link';
import { en } from '@rmmm/ui/web';
import { Deadline } from '@/components/admin/Deadline';
import { ResolveFlagForm } from '@/components/admin/QueueForms';
import { requireStaff } from '@/lib/admin/staff';
import { renderTime } from '@/lib/admin/time';

export const metadata: Metadata = { title: en.admin.nav.flags };

const t = en.admin;

interface Flag {
  id: string;
  target_type: string;
  target_id: string;
  reason: string;
  details: string | null;
  created_at: string;
  due_at: string;
  resolved_at: string | null;
  action: string | null;
  resolution: string | null;
}

const targetHref = (f: Flag) =>
  f.target_type === 'entity'
    ? `/admin/entities/${f.target_id}`
    : f.target_type === 'report'
      ? `/admin/reports/${f.target_id}`
      : null;

export default async function FlagsPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const { sb, role } = await requireStaff('/admin/flags');
  const resolved = (await searchParams).view === 'resolved';
  let q = sb
    .from('content_flags')
    .select(
      'id, target_type, target_id, reason, details, created_at, due_at, resolved_at, action, resolution',
    );
  q = resolved
    ? q.not('resolved_at', 'is', null).order('resolved_at', { ascending: false })
    : q.is('resolved_at', null).order('due_at');
  const flags = ((await q.limit(200)).data ?? []) as Flag[];
  const now = renderTime();
  const canResolve = role === 'moderator' || role === 'admin';
  return (
    <div className="stack-lg">
      <h1>{t.nav.flags}</h1>
      <p className="muted">{t.flags.lede}</p>
      <ul className="admin-tabs">
        <li>
          <Link href="/admin/flags" aria-current={!resolved ? 'page' : undefined}>
            {t.flags.open}
          </Link>
        </li>
        <li>
          <Link href="/admin/flags?view=resolved" aria-current={resolved ? 'page' : undefined}>
            {t.flags.resolved}
          </Link>
        </li>
      </ul>
      {flags.length === 0 ? (
        <p className="muted">{t.empty.flags}</p>
      ) : (
        <ul className="admin-cards">
          {flags.map((f) => {
            const href = targetHref(f);
            return (
              <li key={f.id} className="admin-card" data-testid="flag">
                <div className="row">
                  {!f.resolved_at && <Deadline due={f.due_at} now={now} />}
                  <span className="pill">{t.flags.reasons[f.reason] ?? f.reason}</span>
                  <span>
                    {f.target_type}:{' '}
                    {href ? (
                      <Link href={href} className="mono">
                        {f.target_id.slice(0, 8)}
                      </Link>
                    ) : (
                      <span className="mono">{f.target_id.slice(0, 8)}</span>
                    )}
                  </span>
                </div>
                {f.details && <p className="pre">{f.details}</p>}
                {f.resolved_at ? (
                  <p className="muted">
                    {t.flags.actions[f.action ?? ''] ?? f.action}
                    {f.resolution ? `. ${f.resolution}` : ''}
                  </p>
                ) : (
                  canResolve && <ResolveFlagForm id={f.id} />
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
