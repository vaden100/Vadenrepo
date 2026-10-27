import Link from 'next/link';
import { format, strings } from '@ns1/i18n';
import { Button, TextField } from '@ns1/ui';
import { PageHead } from '@/components/PageHead';
import { page, searchPages } from '@/content/pages';
import { pageMetadata } from '@/lib/metadata';

const t = strings().search;
const meta = page('/search');
export const metadata = pageMetadata({ ...meta });

/** Server-side search over our own pages: no third party, works without JavaScript. */
export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[] }>;
}) {
  const raw = (await searchParams).q;
  const q = (Array.isArray(raw) ? raw[0] : raw)?.slice(0, 100).trim() ?? '';
  const results = q ? searchPages(q) : [];
  return (
    <>
      <PageHead title={meta.title} />
      <form action="/search" method="get" role="search" className="search-form">
        <TextField id="q" name="q" type="search" label={t.label} hint={t.hint} defaultValue={q} />
        <Button type="submit" icon="search">
          {t.actions.search}
        </Button>
      </form>
      {q && (
        <section className="section" aria-live="polite">
          <h2>
            {results.length
              ? format(t.results, { count: results.length, q })
              : format(t.none, { q })}
          </h2>
          <ul className="results">
            {results.map((r) => (
              <li key={r.path}>
                <Link href={r.path}>{r.title}</Link>
                <p>{r.description}</p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
