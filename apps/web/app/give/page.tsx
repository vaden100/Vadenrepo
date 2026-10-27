import { format, strings } from '@ns1/i18n';
import { LinkButton, Notice } from '@ns1/ui';
import { PageHead } from '@/components/PageHead';
import { facts } from '@/content/facts';
import { page } from '@/content/pages';
import { pageMetadata } from '@/lib/metadata';

const t = strings();
const g = t.give;
const meta = page('/give');
export const metadata = pageMetadata({ ...meta });

/** Placeholder until Phase 3 adds the donation platform. Never claims tax deductibility. */
export default function GivePage() {
  return (
    <>
      <PageHead title={meta.title} lede={format(g.lede, { company: facts.company.value })} />
      <Notice>{g.taxProse}</Notice>
      <section className="section">
        <h2>{g.meanwhileHeading}</h2>
        <p>{g.meanwhileProse}</p>
        <div className="cluster">
          <LinkButton href="/programs/safe-sessions" icon="people">
            {t.home.actions.session}
          </LinkButton>
          <LinkButton href="/contact" variant="secondary">
            {t.programs.actions.contact}
          </LinkButton>
        </div>
      </section>
    </>
  );
}
