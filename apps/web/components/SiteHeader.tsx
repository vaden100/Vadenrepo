import Link from 'next/link';
import { en } from '@rmmm/ui';

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="container">
        <Link href="/" aria-label="RUN ME MY MONEY home">
          {/* Wordmark is outlined artwork (SPEC 13), never live text. */}
          <img
            src="/brand/wordmark-transparent.svg"
            alt="RUN ME MY MONEY"
            width={120}
            height={56}
          />
        </Link>
        <nav aria-label="Main">
          <Link href="/account">{en.account.nav}</Link>
        </nav>
      </div>
    </header>
  );
}
