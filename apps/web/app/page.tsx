import type { Metadata } from 'next';
import Link from 'next/link';
import { buttonClass, en, EvidenceSummary, LinkedPages, WhyMatched } from '@rmmm/ui/web';
import { IdentifierProbe } from '@/components/content/IdentifierProbe';
import { StorySequence } from '@/components/content/StorySequence';
import { principles, reviewSteps } from '@/content/about';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata({
  title: `${en.site.name}: ${en.site.tagline}`,
  description: en.site.description,
  path: '/',
});

const NOW = new Date('2026-10-05T12:00:00Z');

export default function HomePage() {
  return (
    <>
      <section className="container hero" aria-labelledby="hero-title">
        <p className="eyebrow">A Vaden World series · The evidence room</p>
        <h1 id="hero-title" className="display">
          Before you pay,
          <br />
          look them up.
        </h1>
        <p className="lede">
          Deposit taken, no-show, page deleted, new page next week. Search the handle, $cashtag or
          number they gave you. We show only what real people reported and our team reviewed.
        </p>
        <IdentifierProbe />
        <div className="hero__cta">
          <Link href="/report" className={buttonClass('primary')}>
            Got run? Tell your story
          </Link>
          <Link href="/resources/payment-disputes" className={buttonClass('secondary')}>
            Already paid? Get your money back
          </Link>
          <Link href="/resources/before-you-pay" className={buttonClass('text')}>
            The Before You Pay checklist
          </Link>
        </div>
      </section>

      <section className="section" aria-labelledby="tags-title">
        <div className="container grid">
          <div className="span-5 stack">
            <p className="eyebrow">Why we follow the money</p>
            <h2 id="tags-title" className="h2">
              Pages change names. The money goes to the same place.
            </h2>
            <p className="muted">
              “nailz” becomes “nailz2”, but the Cash App tag, the phone and the flyer stay the same.
              Lookup links those pages together and shows exactly why, so a rebrand does not wipe
              the record.
            </p>
            <p className="muted">
              Nothing is ever a score. You see what matched and how many reports were reviewed.
            </p>
          </div>
          <div className="span-7 stack">
            <span className="example-label">{en.pages.exampleData}</span>
            <EvidenceSummary
              state="ready"
              name="nailz.demo"
              subtitle="Example business · not a real page"
              reportedFor="deposit taken, no-show"
              now={NOW}
              data={{
                reportCount: 6,
                reviewedCount: 4,
                amountLostCents: 124_000,
                lastReportAt: new Date('2026-10-02T12:00:00Z'),
                linkedPageCount: 2,
              }}
            />
            <WhyMatched
              reasons={[
                { reason: 'shared_cashtag', strongest: true },
                { reason: 'shared_phone' },
                { reason: 'same_flyer_phash' },
              ]}
            />
            <LinkedPages
              pages={[
                { label: '@nailz2.demo', reason: 'shared_cashtag' },
                { label: '@lacedbytee.demo', reason: 'same_flyer_phash' },
              ]}
            />
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="story-title">
        <div className="container stack-lg">
          <div className="stack">
            <p className="eyebrow">How a report becomes a case</p>
            <h2 id="story-title" className="h2">
              Receipts first. Two sign-offs. Their side, on the record.
            </h2>
          </div>
          <StorySequence steps={reviewSteps} />
        </div>
      </section>

      <section className="section" aria-labelledby="principles-title">
        <div className="container stack-lg">
          <h2 id="principles-title" className="h2">
            The rules we hold ourselves to
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
          <div className="row">
            <Link href="/about" className={buttonClass('secondary')}>
              How the series works
            </Link>
            <Link href="/contact" className={buttonClass('text')}>
              Run a business mentioned here? Contact us
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
