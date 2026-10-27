import Link from 'next/link';
import { format, strings } from '@ns1/i18n';
import { PageHead } from '@/components/PageHead';
import { page } from '@/content/pages';
import { programs } from '@/content/programs';
import { pageMetadata } from '@/lib/metadata';

const t = strings().programs;
const meta = page('/programs');
export const metadata = pageMetadata({ ...meta });

export default function ProgramsPage() {
  return (
    <>
      <PageHead title={meta.title} lede={t.lede} />
      <ul className="grid plain-list">
        {programs.map((p) => (
          <li key={p.slug} className="card stack">
            <p className="field__hint">{p.kind === 'program' ? t.programLabel : t.offerLabel}</p>
            <h2>{p.name}</h2>
            <blockquote className="quote">
              <p>{p.quote}</p>
            </blockquote>
            <p>
              <Link href={`/programs/${p.slug}`}>{format(t.readMore, { name: p.name })}</Link>
            </p>
          </li>
        ))}
      </ul>
    </>
  );
}
