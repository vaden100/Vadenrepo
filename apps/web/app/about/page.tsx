import type { Metadata } from 'next';
import Link from 'next/link';
import { buttonClass, en } from '@rmmm/ui/web';
import { PageHead } from '@/components/content/PageHead';
import { StorySequence } from '@/components/content/StorySequence';
import { principles, reviewSteps } from '@/content/about';
import { getNonce } from '@/lib/nonce';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata({
  title: 'About the series',
  description:
    'RUN ME MY MONEY is a documentary series about scams and shady small businesses, and the evidence room behind it.',
  path: '/about',
  kind: 'About',
});

export default async function AboutPage() {
  const nonce = await getNonce();
  return (
    <div className="container stack-lg">
      <PageHead
        nonce={nonce}
        crumbs={[{ label: en.nav.home, href: '/' }, { label: en.nav.about }]}
        eyebrow="A Vaden World series"
        title="About RUN ME MY MONEY"
        lede="A documentary series about deposit scams, no-shows, rebranded pages, credit repair hustles, forex “gurus”, fake clout and money schemes. This site is its evidence room."
      />
      <section className="prose stack" aria-labelledby="what">
        <h2 id="what">What this site does</h2>
        <ul>
          <li>Lets you check a business, handle, payment tag or phone number before you pay.</li>
          <li>
            Takes stories from people who lost money, with receipts, and keeps them private until
            reviewed.
          </li>
          <li>
            Tracks every featured case in public, with dated updates, from reported to resolved or
            closed.
          </li>
          <li>Hosts the episodes, each linked to its case.</li>
        </ul>
        <p className="muted">
          Lookup, reports, cases and episodes open in stages. Nothing is shown until it is real.
        </p>
      </section>
      <section className="stack" aria-labelledby="rules">
        <h2 id="rules" className="h2">
          Our rules
        </h2>
        <ul className="principles">
          {principles.map((p) => (
            <li key={p.title} className="rmmm-receipt">
              <div className="rmmm-receipt__body">
                <h3>{p.title}</h3>
                <p>{p.body}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>
      <section className="stack" aria-labelledby="process">
        <h2 id="process" className="h2">
          From report to case
        </h2>
        <StorySequence steps={reviewSteps} />
      </section>
      <div className="row">
        <Link href="/contact" className={buttonClass('primary')}>
          Contact the team
        </Link>
        <Link href="/legal/terms" className={buttonClass('text')}>
          Read the Terms
        </Link>
      </div>
    </div>
  );
}
