import Link from 'next/link';
import { en } from '@rmmm/ui';
import { business } from '@/lib/business';
import { legalDocs } from '@/content/legal';
import { primaryNav } from '@/lib/site';

export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="site-footer">
      <div className="container site-footer__grid">
        <nav aria-label={en.nav.footer}>
          <h2 className="site-footer__heading">{en.site.name}</h2>
          <ul>
            {primaryNav.map((i) => (
              <li key={i.href}>
                <Link href={i.href}>{i.label}</Link>
              </li>
            ))}
            <li>
              <Link href="/privacy-settings">{en.nav.privacySettings}</Link>
            </li>
          </ul>
        </nav>
        <nav aria-label={en.nav.legal}>
          <h2 className="site-footer__heading">{en.nav.legal}</h2>
          <ul>
            {legalDocs.map((d) => (
              <li key={d.slug}>
                <Link href={`/legal/${d.slug}`}>{d.title}</Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="site-footer__about">
          <p>{en.footer.operatedBy(business.product, business.legalName)}</p>
          <p>
            {business.address}. {business.contactEmail}.
          </p>
          <p>{en.footer.notLegalAdvice}</p>
          <p className="site-footer__shortcut">
            {en.footer.shortcutBefore} <kbd>/</kbd> {en.footer.shortcutOr} <kbd>Ctrl K</kbd>{' '}
            {en.footer.shortcutAfter}
          </p>
          <p>{en.footer.copyright(year, business.legalName)}</p>
        </div>
      </div>
    </footer>
  );
}
