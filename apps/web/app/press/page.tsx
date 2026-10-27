import { format, strings } from '@ns1/i18n';
import { Icon, Logo } from '@ns1/ui';
import { FactValue } from '@/components/Fact';
import { PageHead } from '@/components/PageHead';
import { facts } from '@/content/facts';
import { page } from '@/content/pages';
import { pageMetadata } from '@/lib/metadata';

const t = strings();
const p = t.press;
const meta = page('/press');
export const metadata = pageMetadata({ ...meta });

export default function PressPage() {
  const downloads = [
    { href: '/brand/logo/wordmark.svg', label: p.downloadWordmark },
    { href: '/brand/logo/wordmark-light.svg', label: p.downloadLight },
    { href: '/brand/logo/mark.svg', label: p.downloadMark },
  ];
  return (
    <>
      <PageHead title={meta.title} lede={p.lede} />
      <section aria-labelledby="boiler">
        <h2 id="boiler">{p.boilerplateHeading}</h2>
        <blockquote className="quote">
          <p>{facts.mission.value}</p>
        </blockquote>
        <p>
          {format(t.footer.partOf, { name: facts.shortName.value, company: facts.company.value })}
        </p>
      </section>
      <section className="section" aria-labelledby="logos">
        <h2 id="logos">{p.logosHeading}</h2>
        <p>{p.logosProse}</p>
        <Logo label={t.site.name} />
        <ul className="plain-list stack">
          {downloads.map((d) => (
            <li key={d.href}>
              <a href={d.href} download>
                <Icon name="download" /> {d.label}
              </a>
            </li>
          ))}
        </ul>
      </section>
      <section className="section">
        <h2>{p.factSheetHeading}</h2>
        <p>{p.factSheetProse}</p>
      </section>
      <section className="section">
        <h2>{p.contactHeading}</h2>
        <p>
          <FactValue value={facts.email.value} name="email" />
        </p>
      </section>
    </>
  );
}
