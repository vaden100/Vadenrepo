import type { Metadata } from 'next';
import Link from 'next/link';
import { en } from '@rmmm/ui/web';
import { NewEntityForm } from '@/components/admin/EntityPanels';
import { requireStaff } from '@/lib/admin/staff';

export const metadata: Metadata = { title: en.admin.nav.entities };

const t = en.admin;

interface Row {
  id: string;
  display_name: string;
  city: string | null;
  state: string | null;
  is_public: boolean;
  legal_hold: boolean;
  approved_by: string[];
  created_at: string;
}

export default async function EntitiesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { sb, role } = await requireStaff('/admin/entities');
  const q = ((await searchParams).q ?? '').trim().slice(0, 80);
  let query = sb
    .from('entities')
    .select('id, display_name, city, state, is_public, legal_hold, approved_by, created_at')
    .order('created_at', { ascending: false })
    .limit(200);
  if (q) query = query.ilike('display_name', `%${q.replace(/[%_\\]/g, (c) => `\\${c}`)}%`);
  const rows = ((await query).data ?? []) as Row[];
  return (
    <div className="stack-lg">
      <h1>{t.nav.entities}</h1>
      <form className="row row--end" role="search">
        <div className="rmmm-field">
          <label className="rmmm-field__label" htmlFor="entity-q">
            {t.report.searchEntities}
          </label>
          <input id="entity-q" name="q" className="rmmm-input" defaultValue={q} maxLength={80} />
        </div>
        <button type="submit" className="rmmm-btn rmmm-btn--secondary">
          {t.bans.search}
        </button>
      </form>
      {rows.length === 0 ? (
        <p className="muted">{t.empty.entities}</p>
      ) : (
        <div className="table-scroll" role="region" aria-label={t.nav.entities} tabIndex={0}>
          <table className="admin-table">
            <thead>
              <tr>
                <th scope="col">{t.table.name}</th>
                <th scope="col">{t.table.place}</th>
                <th scope="col">{t.table.status}</th>
                <th scope="col">{t.table.created}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((e) => (
                <tr key={e.id}>
                  <td>
                    <Link href={`/admin/entities/${e.id}`}>{e.display_name}</Link>
                  </td>
                  <td>{[e.city, e.state].filter(Boolean).join(', ')}</td>
                  <td>
                    <span className="pill">
                      {e.is_public ? t.entity.public : t.entity.awaiting(e.approved_by.length)}
                    </span>
                    {e.legal_hold && <span className="pill pill--alert">{t.entity.legalHold}</span>}
                  </td>
                  <td>
                    {new Date(e.created_at).toLocaleDateString('en-US', {
                      dateStyle: 'medium',
                      timeZone: 'UTC',
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {(role === 'moderator' || role === 'admin') && (
        <section aria-labelledby="new-entity" className="stack">
          <h2 id="new-entity">{t.entity.new}</h2>
          <NewEntityForm />
        </section>
      )}
    </div>
  );
}
