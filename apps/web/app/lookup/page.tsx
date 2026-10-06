import type { Metadata } from 'next';
import Link from 'next/link';
import { classify } from '@rmmm/search-core';
import { buttonClass, EmptyState, en } from '@rmmm/ui/web';
import { IdentifierProbe } from '@/components/content/IdentifierProbe';
import { PageHead } from '@/components/content/PageHead';
import { beforeYouPay } from '@/content/resources';
import { getNonce } from '@/lib/nonce';
import { pageMetadata } from '@/lib/seo';

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}): Promise<Metadata> {
  const q = (await searchParams).q;
  return pageMetadata({
    title: en.lookup.title,
    description: en.lookup.lede,
    path: '/lookup',
    kind: 'Lookup',
    // Search result URLs are not indexed (thin, user-provided content).
    noindex: Boolean(q),
  });
}

export default async function LookupPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[] }>;
}) {
  const raw = (await searchParams).q;
  const q = (Array.isArray(raw) ? raw[0] : raw)?.slice(0, 200) ?? '';
  // Classified on the server too: the readout is server-rendered and works without JavaScript.
  const c = q ? classify(q) : null;
  const nonce = await getNonce();
  return (
    <div className="container stack-lg">
      <PageHead
        nonce={nonce}
        crumbs={[{ label: en.nav.home, href: '/' }, { label: en.lookup.title }]}
        title={en.lookup.title}
        lede={en.lookup.lede}
      />
      <IdentifierProbe initial={q} initialResult={c} autoFocus={!q} />
      <EmptyState
        title={en.lookup.notYetTitle}
        action={
          <Link href="/resources/payment-disputes" className={buttonClass('secondary')}>
            Already paid? Get your money back
          </Link>
        }
      >
        <p>{en.lookup.notYetBody}</p>
      </EmptyState>
      <section aria-labelledby="byp" className="stack">
        <h2 id="byp" className="h2">
          Before you pay
        </h2>
        <ol className="checklist">
          {beforeYouPay.map((i) => (
            <li key={i.title}>
              <div>
                <h3>{i.title}</h3>
                <p>{i.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
