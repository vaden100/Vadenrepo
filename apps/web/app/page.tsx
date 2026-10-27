import { strings } from '@ns1/i18n';
import { LinkButton, Shape } from '@ns1/ui';
import Link from 'next/link';
import { facts } from '@/content/facts';
import { pageMetadata } from '@/lib/metadata';

const t = strings().home;

export const metadata = pageMetadata({ title: t.title, description: t.description, path: '/' });

/** Temporary home until Phase 2 builds the real one (SPEC 5.1). */
export default function HomePage() {
  return (
    <div className="stack">
      <h1>{facts.shortName.value}</h1>
      <Shape name="marker-line" />
      <p className="lede">{t.prose}</p>
      <div className="cluster">
        <LinkButton href={facts.currentSite.value} icon="external">
          {t.currentSiteLink}
        </LinkButton>
        <Link href="/styleguide">{t.styleguideLink}</Link>
      </div>
    </div>
  );
}
