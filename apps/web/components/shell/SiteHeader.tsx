'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Dialog, en } from '@rmmm/ui/web';
import { paletteDestinations, primaryNav } from '@/lib/site';
import type { ThemeChoice } from '@/lib/theme';
import { track } from './analytics';
import { CommandPalette } from './CommandPalette';
import { Logo } from './Logo';
import { ThemeToggle } from './ThemeToggle';

const isCurrent = (path: string, href: string) =>
  href === '/' ? path === '/' : path === href || path.startsWith(`${href}/`);

function SearchGlyph() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="square"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="10" cy="10" r="6" />
      <path d="M15 15l6 6" />
    </svg>
  );
}

function MenuGlyph() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="square"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

export function SiteHeader({ theme, signedIn }: { theme: ThemeChoice; signedIn: boolean }) {
  const path = usePathname() ?? '/';
  const [menu, setMenu] = useState(false);
  const [palette, setPalette] = useState(false);
  const [compact, setCompact] = useState(false);

  // Compact logo once the page scrolls: a sentinel + IntersectionObserver, no scroll handler.
  useEffect(() => {
    const sentinel = document.getElementById('top-sentinel');
    if (!sentinel || !('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver(([e]) => setCompact(!e?.isIntersecting));
    io.observe(sentinel);
    return () => io.disconnect();
  }, []);

  const openMenu = useCallback((v: boolean) => {
    setMenu(v);
    track(v ? 'navigation_opened' : 'navigation_closed');
  }, []);

  const accountHref = signedIn ? '/account' : '/auth';
  const accountLabel = signedIn ? en.account.nav : en.auth.nav;

  return (
    <header className="site-header" data-compact={compact ? '' : undefined}>
      <div className="container site-header__bar">
        <Logo current={path === '/'} />
        <nav aria-label={en.nav.label} className="site-nav">
          <ul>
            {primaryNav.map((i) => (
              <li key={i.href}>
                <Link href={i.href} aria-current={isCurrent(path, i.href) ? 'page' : undefined}>
                  {i.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="site-header__utils">
          <button
            type="button"
            className="rmmm-btn rmmm-btn--icon"
            onClick={() => setPalette(true)}
            aria-label={`${en.nav.commandHint} (Ctrl K)`}
            title={`${en.nav.commandHint} (Ctrl K or /)`}
            aria-keyshortcuts="Control+K Meta+K /"
          >
            <SearchGlyph />
          </button>
          <span className="site-header__desktop-only">
            <ThemeToggle initial={theme} />
          </span>
          <Link
            href={accountHref}
            className="rmmm-btn rmmm-btn--secondary site-header__desktop-only"
            aria-current={isCurrent(path, accountHref) ? 'page' : undefined}
          >
            {accountLabel}
          </Link>
          <button
            type="button"
            className="rmmm-btn rmmm-btn--icon site-header__mobile-only"
            aria-label={en.nav.openMenu}
            aria-haspopup="dialog"
            aria-expanded={menu}
            onClick={() => openMenu(true)}
          >
            <MenuGlyph />
          </button>
        </div>
      </div>

      <Dialog
        open={menu}
        onClose={() => openMenu(false)}
        title={en.nav.menu}
        closeLabel={en.nav.closeMenu}
        placement="sheet"
      >
        <nav aria-label={en.nav.label} className="mobile-nav">
          <ul>
            {[
              { href: '/', label: en.nav.home },
              ...primaryNav,
              { href: accountHref, label: accountLabel },
            ].map((i) => (
              <li key={i.href}>
                <Link
                  href={i.href}
                  aria-current={isCurrent(path, i.href) ? 'page' : undefined}
                  onClick={() => openMenu(false)}
                >
                  {i.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="mobile-nav__utils">
          <ThemeToggle initial={theme} showLabel />
          <Link href="/privacy-settings" onClick={() => openMenu(false)}>
            {en.nav.privacySettings}
          </Link>
        </div>
      </Dialog>

      <CommandPalette items={paletteDestinations} open={palette} onOpenChange={setPalette} />
    </header>
  );
}
