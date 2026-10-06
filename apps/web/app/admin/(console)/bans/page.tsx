import type { Metadata } from 'next';
import { en } from '@rmmm/ui/web';
import { AccountBanForm, AddBansForm, LiftBanButton } from '@/components/admin/QueueForms';
import { requireStaff } from '@/lib/admin/staff';

export const metadata: Metadata = { title: en.admin.nav.bans };

const t = en.admin;
const day = (d: string | null) =>
  d
    ? new Date(d).toLocaleDateString('en-US', { dateStyle: 'medium', timeZone: 'UTC' })
    : t.table.never;

export default async function BansPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { sb } = await requireStaff('/admin/bans', ['admin']);
  const q = ((await searchParams).q ?? '').trim().slice(0, 60);
  let ipq = sb
    .from('ip_bans')
    .select('id, cidr, reason, expires_at, created_at')
    .order('created_at', { ascending: false })
    .limit(300);
  if (q) ipq = ipq.or(`reason.ilike.%${q.replace(/[%_,()\\]/g, '')}%`);
  const [{ data: ips }, { data: devices }, { data: accounts }] = await Promise.all([
    ipq,
    sb
      .from('device_bans')
      .select('device_hash, reason, created_at')
      .order('created_at', { ascending: false })
      .limit(300),
    sb
      .from('profiles')
      .select('id, role, ban_reason, banned_at')
      .not('banned_at', 'is', null)
      .order('banned_at', { ascending: false })
      .limit(300),
  ]);
  return (
    <div className="stack-lg">
      <h1>{t.nav.bans}</h1>
      <p className="muted">{t.bans.lede}</p>
      <section aria-labelledby="ip" className="stack">
        <h2 id="ip">{t.bans.ip}</h2>
        <form className="row row--end" role="search">
          <div className="rmmm-field">
            <label className="rmmm-field__label" htmlFor="ban-q">
              {t.bans.search}
            </label>
            <input id="ban-q" name="q" className="rmmm-input" defaultValue={q} maxLength={60} />
          </div>
          <button type="submit" className="rmmm-btn rmmm-btn--secondary">
            {t.bans.search}
          </button>
        </form>
        {(ips ?? []).length === 0 ? (
          <p className="muted">{t.empty.bans}</p>
        ) : (
          <div className="table-scroll" role="region" aria-label={t.bans.ip} tabIndex={0}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th scope="col">{t.bans.ip}</th>
                  <th scope="col">{t.table.reason}</th>
                  <th scope="col">{t.table.expires}</th>
                  <th scope="col">{t.table.actions}</th>
                </tr>
              </thead>
              <tbody>
                {(ips ?? []).map((b) => (
                  <tr key={b.id}>
                    <td className="mono">{b.cidr}</td>
                    <td>{b.reason}</td>
                    <td>{day(b.expires_at)}</td>
                    <td>
                      <LiftBanButton id={b.id} kind="ip" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <h3>{t.bans.add}</h3>
        <AddBansForm />
      </section>
      <section aria-labelledby="dev" className="stack">
        <h2 id="dev">{t.bans.device}</h2>
        {(devices ?? []).length === 0 ? (
          <p className="muted">{t.empty.bans}</p>
        ) : (
          <ul className="admin-list">
            {(devices ?? []).map((d) => (
              <li key={d.device_hash}>
                <span className="mono">{d.device_hash.slice(0, 12)}</span> {d.reason}{' '}
                <LiftBanButton id={d.device_hash} kind="device" />
              </li>
            ))}
          </ul>
        )}
      </section>
      <section aria-labelledby="acc" className="stack">
        <h2 id="acc">{t.bans.accounts}</h2>
        <ul className="admin-list">
          {(accounts ?? []).map((a) => (
            <li key={a.id}>
              <span className="mono">{a.id}</span> {a.ban_reason ?? ''} ({day(a.banned_at)})
            </li>
          ))}
        </ul>
        <AccountBanForm />
      </section>
    </div>
  );
}
