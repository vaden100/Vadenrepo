import type { Metadata } from 'next';
import Link from 'next/link';
import { en } from '@rmmm/ui/web';
import { PageHead } from '@/components/content/PageHead';
import { guides } from '@/content/resources';
import { getNonce } from '@/lib/nonce';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata({
  title: 'Resources',
  description:
    'Checklists and guides for before and after you pay: dispute a payment, report it to the FTC and IC3, spot a deposit scam.',
  path: '/resources',
  kind: 'Resources',
});

export default async function ResourcesPage() {
  const nonce = await getNonce();
  return (
    <div className="container stack-lg">
      <PageHead
        nonce={nonce}
        crumbs={[{ label: en.nav.home, href: '/' }, { label: en.nav.resources }]}
        title="Resources"
        lede="Lost money, or about to send a deposit? Start here. Every guide links to the official source."
      >
        <p className="muted">{en.pages.notLegalAdvice}</p>
      </PageHead>
      <ul className="card-list">
        {guides.map((g) => (
          <li key={g.slug}>
            <Link href={`/resources/${g.slug}`} className="card-link">
              <span className="eyebrow">{g.kind}</span>
              <h2>{g.title}</h2>
              <p>{g.description}</p>
              <span className="card-link__go" aria-hidden="true">
                Read
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
