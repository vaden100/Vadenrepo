import { strings } from '@ns1/i18n';
import { Placeholder } from '@ns1/ui';
import { PageHead } from '@/components/PageHead';
import { facts } from '@/content/facts';
import { page } from '@/content/pages';
import { pageMetadata } from '@/lib/metadata';

const t = strings();
const meta = page('/about/team');
export const metadata = pageMetadata({ ...meta });

export default function TeamPage() {
  return (
    <>
      <PageHead
        title={meta.title}
        lede={t.team.lede}
        crumbs={[{ label: t.nav.about, href: '/about' }]}
      />
      <section aria-labelledby="lead">
        <h2 id="lead">{t.team.leadHeading}</h2>
        <div className="card">
          <h3>{facts.owner.value}</h3>
          <p>{facts.ownerTitle.value}</p>
        </div>
      </section>
      <section className="section" aria-labelledby="board">
        <h2 id="board">{t.team.boardHeading}</h2>
        <p>{t.transparency.boardProse}</p>
        <p>
          <Placeholder name={t.placeholder.names.board} note={t.placeholder.needsSource} />
        </p>
      </section>
    </>
  );
}
