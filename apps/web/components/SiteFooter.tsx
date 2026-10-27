import { strings } from '@ns1/i18n';
import { facts } from '@/content/facts';
import { ReadingSettingsButton } from './ReadingSettings';

export function SiteFooter() {
  const t = strings();
  return (
    <footer className="site-footer">
      <nav aria-label={t.nav.footerLabel} className="container site-footer__inner">
        <p>
          {t.footer.copyright} {new Date().getFullYear()} {facts.shortName.value}
        </p>
        <ReadingSettingsButton />
      </nav>
    </footer>
  );
}
