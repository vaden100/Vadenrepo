import Link from 'next/link';
import { format, strings } from '@ns1/i18n';
import { PageHead } from '@/components/PageHead';
import { facts } from '@/content/facts';
import { page } from '@/content/pages';
import { pageMetadata } from '@/lib/metadata';

const t = strings().about;
const meta = page('/about');
export const metadata = pageMetadata({ ...meta });

export default function AboutPage() {
  return (
    <>
      <PageHead title={meta.title} lede={t.lede} />
      <section aria-labelledby="mission">
        <h2 id="mission">{t.missionHeading}</h2>
        <blockquote className="quote">
          <p>{facts.mission.value}</p>
        </blockquote>
        <p>
          {t.taglineLabel} <strong>{facts.tagline.value}</strong>
        </p>
      </section>
      <section className="section" aria-labelledby="story">
        <h2 id="story">{t.historyHeading}</h2>
        <p>{format(t.historyProse, { year: facts.founded.value })}</p>
        <p>
          {format(t.companyProse, { name: facts.shortName.value, company: facts.company.value })}{' '}
          {t.sosProse}
        </p>
        <p>
          <Link href="/about/team">{t.teamLink}</Link>
        </p>
      </section>
    </>
  );
}
