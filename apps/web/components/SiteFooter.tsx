import Link from 'next/link';
import { format, strings } from '@ns1/i18n';
import { Logo } from '@ns1/ui';
import { crisis, facts } from '@/content/facts';
import { footerNav, legalNav } from './nav';
import { ReadingSettingsButton } from './ReadingSettings';

export function SiteFooter() {
  const t = strings();
  return (
    <footer className="site-footer">
      <div className="container site-footer__grid">
        <div className="stack site-footer__about">
          <Logo variant="mark" />
          <p>
            {format(t.footer.partOf, { name: facts.shortName.value, company: facts.company.value })}
          </p>
          <p>
            <a href={`tel:${crisis.lifeline.number}`}>
              {format(t.crisis.footerLink, { number: crisis.lifeline.number })}
            </a>
          </p>
        </div>
        <nav aria-label={t.nav.footerLabel}>
          <ul className="footer-links">
            {footerNav.map((l) => (
              <li key={l.href}>
                <Link href={l.href}>{l.label}</Link>
              </li>
            ))}
          </ul>
        </nav>
        <nav aria-label={t.nav.legalLabel}>
          <ul className="footer-links">
            {legalNav.map((l) => (
              <li key={l.href}>
                <Link href={l.href}>{l.label}</Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <div className="container site-footer__base">
        <p>
          {t.footer.copyright} {new Date().getFullYear()} {facts.company.value}
        </p>
        <ReadingSettingsButton />
      </div>
    </footer>
  );
}
