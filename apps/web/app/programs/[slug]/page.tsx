import { notFound } from 'next/navigation';
import { format, perMonth, strings } from '@ns1/i18n';
import { LinkButton } from '@ns1/ui';
import { CrisisBox } from '@/components/CrisisBox';
import { FactValue } from '@/components/Fact';
import { NextSession } from '@/components/NextSession';
import { PageHead } from '@/components/PageHead';
import { facts } from '@/content/facts';
import { page } from '@/content/pages';
import { programBySlug, programs, safeQuotes } from '@/content/programs';
import { pageMetadata } from '@/lib/metadata';

const t = strings();
const p = t.programs;

export function generateStaticParams() {
  return programs.map((x) => ({ slug: x.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!programBySlug(slug)) return {};
  return pageMetadata({ ...page(`/programs/${slug}`) });
}

/** Program template (SPEC 8.2). Facts we do not have yet show as placeholders. */
export default async function ProgramPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const program = programBySlug(slug);
  if (!program) notFound();
  const isSafe = program.slug === 'safe-sessions';
  const venue = facts.venue.value;
  const size = facts.sessionSize.value;

  return (
    <>
      <PageHead title={program.name} crumbs={[{ label: t.nav.programs, href: '/programs' }]} />
      <figure className="quote">
        <blockquote>
          <p>{program.quote}</p>
        </blockquote>
        <figcaption>{p.quoteLabel}</figcaption>
      </figure>

      {isSafe && (
        <>
          <section className="section">
            <h2>{p.whatHeading}</h2>
            <p>{safeQuotes.promise}</p>
            <p>{safeQuotes.extras}</p>
            <p>
              {format(p.sizeLine, {
                min: size.min,
                max: size.max,
                perMonth: perMonth(facts.sessionsPerMonth.value),
              })}
            </p>
          </section>
          <section className="section">
            <h2>{p.whereHeading}</h2>
            <address>
              {venue.name}
              <br />
              {venue.street}
              <br />
              {venue.city}, {venue.region} {venue.postalCode}
            </address>
            <p>
              {p.nextLabel} <NextSession />
            </p>
          </section>
        </>
      )}

      <section className="section">
        <h2>{p.whoHeading}</h2>
        <p>
          <FactValue value={null} name="audience" />
        </p>
      </section>
      <section className="section">
        <h2>{p.costHeading}</h2>
        <p>
          <FactValue value={null} name="price" />
        </p>
      </section>
      <section className="section">
        <h2>{p.accessHeading}</h2>
        <p>
          <FactValue value={null} name="access" />
        </p>
      </section>
      <section className="section">
        <h2>{p.joinHeading}</h2>
        <p>{program.join === 'session' ? p.joinSessionProse : p.joinContactProse}</p>
        {program.join === 'session' ? (
          <LinkButton href="/rsvp" icon="calendar">
            {t.home.actions.rsvp}
          </LinkButton>
        ) : (
          <LinkButton href="/contact" icon="arrow-right">
            {p.actions.contact}
          </LinkButton>
        )}
      </section>

      {isSafe && <CrisisBox />}
    </>
  );
}
