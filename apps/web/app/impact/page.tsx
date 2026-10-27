import { format, perMonth, strings } from '@ns1/i18n';
import { PageHead } from '@/components/PageHead';
import { facts } from '@/content/facts';
import { page } from '@/content/pages';
import { pageMetadata } from '@/lib/metadata';

const t = strings().impact;
const meta = page('/impact');
export const metadata = pageMetadata({ ...meta });

/** Text only in Phase 2; charts come in Phase 6. Only sourced numbers (docs/facts.md). */
export default function ImpactPage() {
  const size = facts.sessionSize.value;
  return (
    <>
      <PageHead title={meta.title} lede={t.lede} />
      <ul className="stack">
        <li>{format(t.foundedLine, { year: facts.founded.value })}</li>
        <li>
          {format(t.sessionsLine, {
            perMonth: perMonth(facts.sessionsPerMonth.value),
            min: size.min,
            max: size.max,
          })}
        </li>
      </ul>
      <p className="field__hint">{t.sourceLine}</p>
      <section className="section">
        <h2>{t.moreHeading}</h2>
        <p>{t.moreProse}</p>
      </section>
    </>
  );
}
