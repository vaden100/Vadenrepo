import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import type { EntityPageData } from '@rmmm/api';
import { buttonClass, EvidenceSummary, LinkedPages, en } from '@rmmm/ui/web';
import { PageHead } from '@/components/content/PageHead';
import { EntityDisputeForm, EntityReplyForm } from '@/components/search/EntityForms';
import { categoryLabel, linkedPages, officialChecks, place } from '@/components/search/results';
import { getNonce } from '@/lib/nonce';
import { pageMetadata } from '@/lib/seo';
import { db, q } from '@/lib/server/db';
import { getSession } from '@/lib/session';
import { renderTime } from '@/lib/time';

const t = en.entity;

/** Public entities only. Anything else is a plain 404, so nothing leaks about unreviewed pages. */
const load = cache(async (slug: string): Promise<EntityPageData | null> => {
  if (!/^[a-z0-9-]{1,80}$/.test(slug)) return null;
  try {
    return await db.rpc<EntityPageData | null>('entity_page', { entity_slug: slug });
  } catch {
    return null;
  }
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const e = await load((await params).slug);
  if (!e) return { title: en.errors.notFoundTitle, robots: { index: false } };
  return pageMetadata({
    title: e.name,
    description: t.description(e.name, place(e.city, e.state)),
    path: `/entities/${e.slug}`,
    kind: 'Reported page',
  });
}

const month = (m: string | null) =>
  m
    ? new Date(`${m}-01T00:00:00Z`).toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
        timeZone: 'UTC',
      })
    : '';

export default async function EntityPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const e = await load(slug);
  if (!e) notFound();
  const [nonce, session] = await Promise.all([getNonce(), getSession()]);
  const isOwner = session
    ? (
        await db
          .select<{ id: string }>(
            'entities',
            `slug=eq.${q(slug)}&claimed_by=eq.${q(session.user.id)}&select=id`,
          )
          .catch(() => [])
      ).length > 0
    : false;
  const now = new Date(renderTime());
  const where = place(e.city, e.state);
  const checks = officialChecks([e.category]);

  return (
    <div className="container stack-lg">
      <PageHead
        nonce={nonce}
        crumbs={[
          { label: en.nav.home, href: '/' },
          { label: en.lookup.title, href: '/lookup' },
          { label: e.name },
        ]}
        title={e.name}
        lede={t.alleged}
      />
      <div className="grid">
        <div className="span-7 stack-lg">
          <EvidenceSummary
            state="ready"
            name={e.name}
            subtitle={where || undefined}
            reportedFor={categoryLabel(e.category)}
            now={now}
            data={{
              reportCount: e.summary.reports,
              reviewedCount: e.summary.reviewed,
              amountLostCents: e.summary.amountCents,
              lastReportAt: new Date(e.summary.lastReportAt ?? e.approvedAt ?? now),
              linkedPageCount: e.links.length,
            }}
          />

          <section aria-labelledby="reports" className="stack">
            <h2 id="reports" className="h3">
              {t.reports}
            </h2>
            {e.excerpts.length === 0 ? (
              <p className="muted">{t.reportsEmpty}</p>
            ) : (
              <ul className="excerpts">
                {e.excerpts.map((x, i) => (
                  <li key={i} className="stack">
                    <blockquote>{x.excerpt}</blockquote>
                    <p className="muted mono">
                      {[
                        categoryLabel(x.category),
                        x.amountRange,
                        month(x.month),
                        place(x.city, x.state),
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section aria-labelledby="reply" className="stack">
            <h2 id="reply" className="h3">
              {t.reply}
            </h2>
            {e.reply ? (
              <div className="reply stack">
                <p className="pre">{e.reply.text}</p>
                <p className="muted">
                  {t.replyUpdated(
                    new Date(e.reply.updatedAt).toLocaleDateString('en-US', {
                      dateStyle: 'medium',
                      timeZone: 'UTC',
                    }),
                  )}
                </p>
              </div>
            ) : (
              <p className="muted">{t.replyNone}</p>
            )}
            {isOwner && <EntityReplyForm slug={e.slug} initial={e.reply?.text ?? ''} />}
          </section>
        </div>

        <aside className="span-5 stack-lg" aria-label={t.identifiers}>
          <section aria-labelledby="ids" className="stack">
            <h2 id="ids" className="h3">
              {t.identifiers}
            </h2>
            <p className="muted">{t.identifiersHint}</p>
            <ul className="entity-ids">
              {e.identifiers.map((i, n) => (
                <li key={n}>
                  <span className="entity-ids__type">{t.identifierTypes[i.type] ?? i.type}</span>
                  <span className="mono">{i.display}</span>
                </li>
              ))}
            </ul>
          </section>
          <LinkedPages pages={linkedPages(e.links)} />
          {checks.length > 0 && (
            <section aria-labelledby="official" className="stack">
              <h2 id="official" className="h3">
                {en.lookup.officialChecks}
              </h2>
              <ul>
                {checks.map((c) => (
                  <li key={c.href}>
                    <a href={c.href} rel="noopener noreferrer" target="_blank">
                      {c.label}
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}
          <section aria-labelledby="actions" className="stack">
            <h2 id="actions" className="h3">
              {t.actions}
            </h2>
            <div>
              <Link href={`/report?entity=${e.slug}`} className={buttonClass('primary')}>
                {t.sameHere}
              </Link>
            </div>
          </section>
          <section aria-labelledby="business" className="stack">
            <h2 id="business" className="h3">
              {t.business}
            </h2>
            <p className="muted">{t.businessBody}</p>
            <EntityDisputeForm slug={e.slug} />
          </section>
        </aside>
      </div>
    </div>
  );
}
