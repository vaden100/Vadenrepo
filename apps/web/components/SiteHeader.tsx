import Link from 'next/link';
import { strings } from '@ns1/i18n';
import { Logo } from '@ns1/ui';
import { ReadingSettingsButton } from './ReadingSettings';

export function SiteHeader() {
  const t = strings();
  return (
    <header className="site-header">
      <div className="container site-header__inner">
        <Link href="/" className="site-header__home">
          <Logo label={t.site.logoAlt} />
        </Link>
        <ReadingSettingsButton />
      </div>
    </header>
  );
}
