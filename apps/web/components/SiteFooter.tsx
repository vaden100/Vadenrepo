import Link from 'next/link';
import { business } from '@/lib/business';
import { legalDocs } from '@/lib/legal';

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container">
        <p>
          {business.product}. Operated by {business.legalName}. {business.address}.{' '}
          {business.contactEmail}.
        </p>
        <p>Resources on this site are general information, not legal advice.</p>
        <ul aria-label="Legal">
          {legalDocs.map((d) => (
            <li key={d.slug}>
              <Link href={`/legal/${d.slug}`}>{d.title}</Link>
            </li>
          ))}
        </ul>
      </div>
    </footer>
  );
}
