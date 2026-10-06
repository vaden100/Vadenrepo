import type { ReactNode } from 'react';
import { Breadcrumbs, type Crumb } from '@rmmm/ui/web';
import { absoluteUrl } from '@/lib/site';
import { JsonLd } from '@/components/shell/JsonLd';

/** Page title block with breadcrumbs (and matching BreadcrumbList structured data). */
export function PageHead({
  crumbs,
  eyebrow,
  title,
  lede,
  nonce,
  children,
}: {
  crumbs?: Crumb[];
  eyebrow?: string;
  title: string;
  lede?: ReactNode;
  nonce?: string;
  children?: ReactNode;
}) {
  return (
    <div className="page-head">
      {crumbs && (
        <>
          <Breadcrumbs items={crumbs} />
          <JsonLd
            nonce={nonce}
            data={{
              '@context': 'https://schema.org',
              '@type': 'BreadcrumbList',
              itemListElement: crumbs.map((c, i) => ({
                '@type': 'ListItem',
                position: i + 1,
                name: c.label,
                ...(c.href ? { item: absoluteUrl(c.href) } : {}),
              })),
            }}
          />
        </>
      )}
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h1 className="h1">{title}</h1>
      {lede && <p className="lede">{lede}</p>}
      {children}
    </div>
  );
}
