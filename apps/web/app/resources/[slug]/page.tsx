import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { en } from '@rmmm/ui/web';
import { PageHead } from '@/components/content/PageHead';
import { beforeYouPay, guides, rails, reportPlaces, RESOURCES_REVIEWED } from '@/content/resources';
import { getNonce } from '@/lib/nonce';
import { pageMetadata } from '@/lib/seo';

export const dynamicParams = false;
export const generateStaticParams = () => guides.map((g) => ({ slug: g.slug }));

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const g = guides.find((x) => x.slug === slug);
  return g
    ? pageMetadata({
        title: g.title,
        description: g.description,
        path: `/resources/${g.slug}`,
        kind: g.kind,
      })
    : {};
}

function External({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} className="ext" target="_blank" rel="noopener noreferrer">
      {children}
      {/* Same family as brand/icons: 2px stroke, square caps. */}
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="square"
        aria-hidden="true"
        focusable="false"
      >
        <path d="M7 17L17 7M9 7h8v8" />
      </svg>
      <span className="rmmm-visually-hidden"> (opens in a new tab)</span>
    </a>
  );
}

export default async function GuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const g = guides.find((x) => x.slug === slug);
  if (!g) notFound();
  const nonce = await getNonce();

  return (
    <div className="container stack-lg">
      <PageHead
        nonce={nonce}
        crumbs={[
          { label: en.nav.home, href: '/' },
          { label: en.nav.resources, href: '/resources' },
          { label: g.title },
        ]}
        eyebrow={g.kind}
        title={g.title}
        lede={g.description}
      >
        <p className="muted">
          {en.pages.notLegalAdvice} {en.pages.reviewed(RESOURCES_REVIEWED)}
        </p>
      </PageHead>

      {g.slug === 'before-you-pay' && (
        <ol className="checklist prose">
          {beforeYouPay.map((i) => (
            <li key={i.title}>
              <div>
                <h3>{i.title}</h3>
                <p>{i.body}</p>
              </div>
            </li>
          ))}
        </ol>
      )}

      {g.slug === 'payment-disputes' && (
        <div className="stack prose">
          <p>
            Move fast: the first hours matter. Save every screenshot first (payment, DMs, the flyer,
            their profile), then pick how you paid.
          </p>
          <div className="rails">
            {rails.map((r) => (
              <details key={r.id} className="rail" id={r.id}>
                <summary>{r.name}</summary>
                <div className="rail__body">
                  <p>{r.summary}</p>
                  <ol>
                    {r.steps.map((s) => (
                      <li key={s}>{s}</li>
                    ))}
                  </ol>
                  <p>
                    {r.links.map((l) => (
                      <External key={l.href} href={l.href}>
                        {l.label}
                      </External>
                    ))}
                  </p>
                </div>
              </details>
            ))}
          </div>
          <p>
            Then report it: <Link href="/resources/report-it">where to file a report</Link>.
          </p>
        </div>
      )}

      {g.slug === 'report-it' && (
        <div className="stack prose">
          <p>
            Reporting rarely gets your money back on its own, but it creates an official record and
            helps stop the next person from losing money.
          </p>
          <ul className="places">
            {reportPlaces.map((p) => (
              <li key={p.href}>
                <External href={p.href}>{p.name}</External>
                <p>{p.when}</p>
              </li>
            ))}
          </ul>
          <p>If you are in danger right now, call 911.</p>
        </div>
      )}
    </div>
  );
}
