import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { en } from '@rmmm/ui/web';
import {
  ConfirmLinkButton,
  EntityControls,
  IdentifierEditor,
  LinkMergeTools,
} from '@/components/admin/EntityPanels';
import { LinkGraph } from '@/components/admin/LinkGraph';
import { requireStaff } from '@/lib/admin/staff';

export const metadata: Metadata = { title: en.admin.nav.entities };

const t = en.admin.entity;

interface LinkRow {
  a: string;
  b: string;
  reason: string;
  confidence: number;
  confirmed_at: string | null;
}

export default async function EntityDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const staff = await requireStaff(`/admin/entities/${id}`);
  const { sb, role, userId } = staff;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const [{ data: e }, { data: idents }, { data: approvals }, { data: reports }, { data: links }] =
    await Promise.all([
      sb
        .from('entities')
        .select('id, display_name, category, city, state, is_public, legal_hold, slug')
        .eq('id', id)
        .maybeSingle(),
      sb.from('entity_identifiers').select('id, type, raw').eq('entity_id', id).order('type'),
      sb
        .from('entity_approvals')
        .select('staff_id, role, created_at')
        .eq('entity_id', id)
        .order('created_at'),
      sb
        .from('report_entities')
        .select('report:reports(id, public_code, status)')
        .eq('entity_id', id),
      sb
        .from('entity_links')
        .select('a, b, reason, confidence, confirmed_at')
        .or(`a.eq.${id},b.eq.${id}`),
    ]);
  if (!e) notFound();
  const linkRows = (links ?? []) as LinkRow[];
  const otherIds = [...new Set(linkRows.map((l) => (l.a === id ? l.b : l.a)))];
  const { data: others } = otherIds.length
    ? await sb.from('entities').select('id, display_name, is_public').in('id', otherIds)
    : { data: [] as { id: string; display_name: string; is_public: boolean }[] };
  const nameOf = new Map((others ?? []).map((o) => [o.id, o]));
  const canEdit = role === 'moderator' || role === 'admin';
  const linkedReports = (
    (reports ?? []) as unknown as {
      report: { id: string; public_code: string; status: string } | null;
    }[]
  )
    .map((r) => r.report)
    .filter(Boolean);

  return (
    <div className="stack-lg">
      <div className="stack">
        <p className="eyebrow">{e.is_public ? t.public : t.notPublic}</p>
        <h1>{e.display_name}</h1>
        <p className="mono muted">/{e.slug}</p>
      </div>
      <EntityControls
        entity={{
          id: e.id,
          name: e.display_name,
          category: e.category,
          city: e.city ?? '',
          state: e.state ?? '',
          isPublic: e.is_public,
          legalHold: e.legal_hold,
        }}
        approvals={(approvals ?? []).map((a) => ({
          name: a.staff_id === userId ? en.admin.you : a.staff_id.slice(0, 8),
          role: a.role,
        }))}
        myApproval={(approvals ?? []).some((a) => a.staff_id === userId)}
        role={role}
      />
      <section aria-labelledby="identifiers" className="stack">
        <h2 id="identifiers">{t.identifiers}</h2>
        <IdentifierEditor
          entityId={e.id}
          identifiers={idents ?? []}
          canEdit={canEdit && !e.legal_hold}
        />
      </section>
      <section aria-labelledby="reports" className="stack">
        <h2 id="reports">{t.reports}</h2>
        <ul className="admin-list">
          {linkedReports.map((r) => (
            <li key={r!.id}>
              <Link href={`/admin/reports/${r!.id}`} className="mono">
                {r!.public_code}
              </Link>{' '}
              <span className="pill">{en.admin.status[r!.status] ?? r!.status}</span>
            </li>
          ))}
        </ul>
      </section>
      <section aria-labelledby="links" className="stack">
        <h2 id="links">{t.links}</h2>
        <p className="muted">{t.linksHint}</p>
        {linkRows.length > 0 && (
          <>
            <LinkGraph
              center={{ id: e.id, name: e.display_name, isPublic: e.is_public }}
              nodes={otherIds.map((o) => ({
                id: o,
                name: nameOf.get(o)?.display_name ?? o.slice(0, 8),
                isPublic: Boolean(nameOf.get(o)?.is_public),
              }))}
              edges={linkRows.map((l) => ({
                other: l.a === id ? l.b : l.a,
                reason: l.reason,
                confidence: l.confidence,
                confirmed: Boolean(l.confirmed_at),
              }))}
            />
            <ul className="admin-list">
              {linkRows.map((l) => {
                const other = l.a === id ? l.b : l.a;
                return (
                  <li key={`${other}-${l.reason}`}>
                    <Link href={`/admin/entities/${other}`}>
                      {nameOf.get(other)?.display_name ?? other.slice(0, 8)}
                    </Link>{' '}
                    <span className="pill">{t.linkReasons[l.reason] ?? l.reason}</span>{' '}
                    {Math.round(l.confidence * 100)}%{' '}
                    {l.confirmed_at ? (
                      <span className="pill">{t.confirmed}</span>
                    ) : (
                      canEdit && (
                        <ConfirmLinkButton entityId={e.id} a={l.a} b={l.b} reason={l.reason} />
                      )
                    )}
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </section>
      <section aria-labelledby="merge" className="stack">
        <h2 id="merge">{t.merge}</h2>
        <LinkMergeTools entityId={e.id} canEdit={canEdit && !e.legal_hold} />
      </section>
    </div>
  );
}
