import { format, perMonth, strings } from '@ns1/i18n';
import { LinkButton, Notice } from '@ns1/ui';
import { NextSession } from '@/components/NextSession';
import { PageHead } from '@/components/PageHead';
import { facts } from '@/content/facts';
import { page } from '@/content/pages';
import { pageMetadata } from '@/lib/metadata';

const t = strings();
const r = t.rsvp;
const meta = page('/rsvp');
export const metadata = pageMetadata({ ...meta });

/**
 * The primary action (director, 2026-10-27). The sign-up form arrives with the events module:
 * seats are held in the database with a capacity limit, and nothing says "registered" until the
 * server confirms (SPEC 3, 8.7). Until then this page is honest about how to save a seat.
 */
export default function RsvpPage() {
  const { paused, returnYear } = facts.sessionStatus.value;
  const venue = facts.venue.value;
  const size = facts.sessionSize.value;
  return (
    <>
      <PageHead
        title={meta.title}
        lede={r.lede}
        crumbs={[{ label: t.nav.sessions, href: '/programs/safe-sessions' }]}
      />
      <section aria-labelledby="when">
        <h2 id="when">{r.whenHeading}</h2>
        <p>
          {r.nextLabel} <NextSession />
        </p>
        <address>
          {venue.name}
          <br />
          {venue.street}
          <br />
          {venue.city}, {venue.region} {venue.postalCode}
        </address>
        <p>
          {format(r.sizeLine, {
            min: size.min,
            max: size.max,
            perMonth: perMonth(facts.sessionsPerMonth.value),
          })}
        </p>
      </section>
      <section className="section" aria-labelledby="open">
        <h2 id="open">{paused ? r.pausedHeading : r.notOpenHeading}</h2>
        <Notice>{paused ? format(r.pausedProse, { year: returnYear }) : r.notOpenProse}</Notice>
        <div className="cluster section-actions">
          <LinkButton href={facts.currentSite.value} icon="chat">
            {paused ? r.actions.textPaused : r.actions.text}
          </LinkButton>
          <LinkButton href="/programs/safe-sessions" variant="secondary">
            {r.actions.about}
          </LinkButton>
        </div>
      </section>
    </>
  );
}
