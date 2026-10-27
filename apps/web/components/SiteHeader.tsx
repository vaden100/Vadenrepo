import Link from 'next/link';
import { strings } from '@ns1/i18n';
import { Icon, LinkButton, Logo } from '@ns1/ui';
import { MobileMenu } from './MobileMenu';
import { NavLinks } from './NavLinks';
import { ReadingSettingsButton } from './ReadingSettings';

export function SiteHeader() {
  const t = strings();
  return (
    <header className="site-header">
      <div className="container site-header__inner">
        <Link href="/" className="site-header__home">
          <Logo label={t.site.logoAlt} />
        </Link>
        <NavLinks />
        <div className="site-header__actions">
          <Link href="/search" className="icon-link wide-only">
            <Icon name="search" label={t.nav.search} />
          </Link>
          <span className="wide-only">
            <ReadingSettingsButton iconOnly />
          </span>
          <LinkButton href="/rsvp" icon="calendar" className="btn--compact">
            {t.nav.rsvp}
          </LinkButton>
          <MobileMenu />
        </div>
      </div>
    </header>
  );
}
