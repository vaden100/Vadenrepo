import { strings } from '@ns1/i18n';
import { Placeholder } from '@ns1/ui';
import { FactValue } from '@/components/Fact';
import { PageHead } from '@/components/PageHead';
import { facts } from '@/content/facts';
import { page } from '@/content/pages';
import { pageMetadata } from '@/lib/metadata';

const t = strings();
const x = t.transparency;
const meta = page('/transparency');
export const metadata = pageMetadata({ ...meta });

/** Trust (SPEC 8.3). Missing items are shown as missing, never drafted as if adopted. */
export default function TransparencyPage() {
  return (
    <>
      <PageHead title={meta.title} lede={x.lede} />
      <section aria-labelledby="details">
        <h2 id="details">{x.detailsHeading}</h2>
        <dl className="facts-list">
          <div>
            <dt>{x.company}</dt>
            <dd>{facts.company.value}</dd>
          </div>
          <div>
            <dt>{x.legalName}</dt>
            <dd>
              <FactValue value={facts.legalName.value} name="legalName" />
            </dd>
          </div>
          <div>
            <dt>{x.taxStatus}</dt>
            <dd>
              {x.taxStatusValue} (<FactValue value={facts.taxType.value} name="taxType" />)
            </dd>
          </div>
          <div>
            <dt>{x.ein}</dt>
            <dd>
              <FactValue value={facts.ein.value} name="ein" />
            </dd>
          </div>
          <div>
            <dt>{x.gallery}</dt>
            <dd>{facts.name.value}</dd>
          </div>
          <div>
            <dt>{x.owner}</dt>
            <dd>
              {facts.owner.value}, {facts.ownerTitle.value}
            </dd>
          </div>
        </dl>
      </section>
      <section className="section">
        <h2>{x.filingsHeading}</h2>
        <p>{x.filingsProse}</p>
      </section>
      <section className="section">
        <h2>{x.boardHeading}</h2>
        <p>{x.boardProse}</p>
        <p>
          <Placeholder name={t.placeholder.names.board} note={t.placeholder.needsSource} />
        </p>
      </section>
      <section className="section">
        <h2>{x.policiesHeading}</h2>
        <p>{x.policiesProse}</p>
        <ul>
          {Object.values(x.policies).map((name) => (
            <li key={name}>{name}</li>
          ))}
        </ul>
      </section>
    </>
  );
}
