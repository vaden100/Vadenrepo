import { strings } from '@ns1/i18n';
import { Icon } from '@ns1/ui';
import { CrisisBox } from '@/components/CrisisBox';
import { FactValue } from '@/components/Fact';
import { PageHead } from '@/components/PageHead';
import { facts } from '@/content/facts';
import { page } from '@/content/pages';
import { pageMetadata } from '@/lib/metadata';

const t = strings().contact;
const meta = page('/contact');
export const metadata = pageMetadata({ ...meta });

/** No form yet: it needs email sending under the gallery's own account (docs/decisions.md). */
export default function ContactPage() {
  const venue = facts.venue.value;
  return (
    <>
      <PageHead title={meta.title} lede={t.lede} />
      <section aria-labelledby="reach">
        <h2 id="reach">{t.reachHeading}</h2>
        <dl className="facts-list">
          <div>
            <dt>{t.email}</dt>
            <dd>
              <FactValue value={facts.email.value} name="email" />
            </dd>
          </div>
          <div>
            <dt>{t.phone}</dt>
            <dd>
              <FactValue value={facts.phone.value} name="phone" />
            </dd>
          </div>
          <div>
            <dt>{t.mail}</dt>
            <dd>
              <FactValue value={facts.mailingAddress.value} name="mailingAddress" />
            </dd>
          </div>
        </dl>
        <p>{t.textProse}</p>
        <ul className="plain-list stack">
          <li>
            <a href={facts.currentSite.value}>
              <Icon name="chat" /> {t.currentSiteLink}
            </a>
          </li>
          <li>
            <a href={facts.linktree.value}>
              <Icon name="external" /> {t.linktreeLink}
            </a>
          </li>
        </ul>
      </section>
      <section className="section" aria-labelledby="where">
        <h2 id="where">{t.sessionsHeading}</h2>
        <address>
          {venue.name}
          <br />
          {venue.street}
          <br />
          {venue.city}, {venue.region} {venue.postalCode}
        </address>
      </section>
      <CrisisBox />
    </>
  );
}
