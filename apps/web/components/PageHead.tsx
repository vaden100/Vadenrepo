import Link from 'next/link';
import { strings } from '@ns1/i18n';
import { SITE_URL } from '@/lib/site';
import { JsonLd } from './JsonLd';

export interface Crumb {
  label: string;
  href: string;
}

/** Breadcrumbs (with BreadcrumbList JSON-LD), the one <h1>, and an optional lede. */
export function PageHead({
  title,
  lede,
  crumbs = [],
}: {
  title: string;
  lede?: string;
  /** Parents between Home and this page. */
  crumbs?: Crumb[];
}) {
  const t = strings();
  const trail: Crumb[] = [{ label: t.breadcrumb.home, href: '/' }, ...crumbs];
  return (
    <header className="page-head">
      <nav aria-label={t.nav.breadcrumbLabel} className="breadcrumbs">
        <ol>
          {trail.map((c) => (
            <li key={c.href}>
              <Link href={c.href}>{c.label}</Link>
            </li>
          ))}
          <li aria-current="page">{title}</li>
        </ol>
      </nav>
      <h1>{title}</h1>
      {lede && <p className="lede">{lede}</p>}
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [...trail, { label: title, href: '' }].map((c, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            name: c.label,
            ...(c.href ? { item: `${SITE_URL}${c.href === '/' ? '' : c.href}` || SITE_URL } : {}),
          })),
        }}
      />
    </header>
  );
}
