import Link from 'next/link';
import { format, perMonth, strings } from '@ns1/i18n';
import { LinkButton, Placeholder, Roundtable, Shape } from '@ns1/ui';
import { FactValue } from '@/components/Fact';
import { JsonLd } from '@/components/JsonLd';
import { facts } from '@/content/facts';
import { page } from '@/content/pages';
import { programs } from '@/content/programs';
import { pageMetadata } from '@/lib/metadata';
import { SITE_URL } from '@/lib/site';

const t = strings();
const h = t.home;
const meta = page('/');

export const metadata = pageMetadata({
  title: meta.title,
  description: meta.description,
  path: '/',
});

/** Home (SPEC 5.1). The order of sections is fixed by the spec. */
export default function HomePage() {
  const size = facts.sessionSize.value;
  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'NGO',
          name: facts.name.value,
          alternateName: facts.shortName.value,
          url: SITE_URL,
          logo: `${SITE_URL}/brand/logo/mark.svg`,
          foundingDate: String(facts.founded.value),
          slogan: facts.tagline.value,
          parentOrganization: { '@type': 'NGO', name: facts.company.value },
          sameAs: [facts.linktree.value],
        }}
      />

      {/* 1. Mission line */}
      <section className="hero">
        <h1>{facts.heroLine.value}</h1>
        <Shape name="marker-line" />
        <p className="lede">
          {format(h.whoWhere, {
            name: facts.shortName.value,
            city: facts.venue.value.city,
            company: facts.company.value,
          })}
        </p>
        <p className="hero__tagline">{facts.tagline.value}</p>
      </section>

      {/* 2. Doors */}
      <section className="section" aria-labelledby="doors">
        <h2 id="doors" className="visually-hidden">
          {h.doorsHeading}
        </h2>
        <div className="doors">
          <div className="door">
            <h3>{h.giveTitle}</h3>
            <p>{h.giveProse}</p>
            <LinkButton href="/give" variant="give" icon="heart">
              {h.actions.give}
            </LinkButton>
          </div>
          <div className="door">
            <h3>{h.sessionTitle}</h3>
            <p>{h.sessionProse}</p>
            <LinkButton href="/programs/safe-sessions" icon="people">
              {h.actions.session}
            </LinkButton>
          </div>
          <div className="door">
            <h3>{h.partnerTitle}</h3>
            <p>{h.partnerProse}</p>
            <LinkButton href="/programs/book-a-session" variant="secondary" icon="chat">
              {h.actions.partner}
            </LinkButton>
          </div>
        </div>
      </section>

      {/* 3. Signature SVG from real data, with its text equivalent */}
      <section className="section feature" aria-labelledby="table">
        <Roundtable seats={size.max} />
        <div>
          <h2 id="table">{h.tableHeading}</h2>
          <p className="feature__number">
            {format(h.tableProse, {
              min: size.min,
              max: size.max,
              perMonth: perMonth(facts.sessionsPerMonth.value),
            })}
          </p>
          <p className="field__hint">{h.tableSource}</p>
        </div>
      </section>

      {/* 4. One story, only with consent */}
      <section className="section" aria-labelledby="stories">
        <h2 id="stories">{h.storyHeading}</h2>
        <p>{h.storyProse}</p>
        <p>
          <Placeholder name={t.placeholder.names.story} note={t.placeholder.needsSource} />
        </p>
      </section>

      {/* 5. Programs */}
      <section className="section" aria-labelledby="programs">
        <h2 id="programs">{h.programsHeading}</h2>
        <ul className="grid plain-list">
          {programs.map((p) => (
            <li key={p.slug} className="card">
              <h3>
                <Link href={`/programs/${p.slug}`}>{p.name}</Link>
              </h3>
              <p className="field__hint">
                {p.kind === 'program' ? t.programs.programLabel : t.programs.offerLabel}
              </p>
            </li>
          ))}
        </ul>
      </section>

      {/* 6. Trust strip */}
      <section className="section" aria-labelledby="trust">
        <h2 id="trust">{h.trustHeading}</h2>
        <dl className="facts-list">
          <div>
            <dt>{t.transparency.company}</dt>
            <dd>{facts.company.value}</dd>
          </div>
          <div>
            <dt>{t.transparency.legalName}</dt>
            <dd>
              <FactValue value={facts.legalName.value} name="legalName" />
            </dd>
          </div>
          <div>
            <dt>{t.transparency.ein}</dt>
            <dd>
              <FactValue value={facts.ein.value} name="ein" />
            </dd>
          </div>
        </dl>
        <p>
          <Link href="/transparency">{h.actions.transparency}</Link>
        </p>
      </section>

      {/* 7. Final band */}
      <section className="band" aria-labelledby="final">
        <h2 id="final">{h.finalHeading}</h2>
        <p>{h.finalProse}</p>
        <div className="cluster">
          <LinkButton href="/give" variant="give" icon="heart">
            {h.actions.giveMonthly}
          </LinkButton>
          <LinkButton href="/programs/safe-sessions" variant="secondary">
            {h.actions.session}
          </LinkButton>
        </div>
      </section>
    </>
  );
}
