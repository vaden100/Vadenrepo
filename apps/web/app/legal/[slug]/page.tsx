import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { en } from '@rmmm/ui';
import { PageHead } from '@/components/content/PageHead';
import { getLegalDoc, LEGAL_VERSION, legalDocs } from '@/content/legal';
import { getNonce } from '@/lib/nonce';
import { pageMetadata } from '@/lib/seo';

export const dynamicParams = false;

export function generateStaticParams() {
  return legalDocs.map((d) => ({ slug: d.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const doc = getLegalDoc((await params).slug);
  if (!doc) return {};
  return pageMetadata({
    title: doc.title,
    description: doc.summary,
    path: `/legal/${doc.slug}`,
    kind: 'Legal',
  });
}

export default async function LegalPage({ params }: { params: Promise<{ slug: string }> }) {
  const doc = getLegalDoc((await params).slug);
  if (!doc) notFound();
  const nonce = await getNonce();
  return (
    <div className="container">
      <PageHead
        nonce={nonce}
        crumbs={[{ label: en.nav.home, href: '/' }, { label: en.nav.legal }, { label: doc.title }]}
        title={doc.title}
        lede={doc.summary}
      >
        <p className="draft-note">{en.pages.draft(LEGAL_VERSION)}</p>
      </PageHead>
      <article className="prose">
        {doc.sections.map((s) => (
          <section key={s.heading}>
            <h2>{s.heading}</h2>
            {s.paragraphs?.map((p) => (
              <p key={p}>{p}</p>
            ))}
            {s.list && (
              <ul>
                {s.list.map((li) => (
                  <li key={li}>{li}</li>
                ))}
              </ul>
            )}
            {s.table && (
              // Wide tables scroll inside a focusable, named region (keyboard users can scroll it).
              <div className="table-scroll" role="region" aria-label={s.heading} tabIndex={0}>
                <table>
                  <thead>
                    <tr>
                      {s.table.head.map((h) => (
                        <th key={h} scope="col">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {s.table.rows.map((r) => (
                      <tr key={r.join('|')}>
                        {r.map((c, i) =>
                          i === 0 ? (
                            <th key={i} scope="row">
                              {c}
                            </th>
                          ) : (
                            <td key={i}>{c}</td>
                          ),
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        ))}
      </article>
    </div>
  );
}
