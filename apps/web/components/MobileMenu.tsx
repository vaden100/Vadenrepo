'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { strings } from '@ns1/i18n';
import { Icon } from '@ns1/ui';
import { primaryNav } from './nav';
import { ReadingSettingsButton } from './ReadingSettings';

const t = strings().nav;

/** Small-screen menu. A native <details>, so it opens without JavaScript too. */
export function MobileMenu() {
  const ref = useRef<HTMLDetailsElement>(null);
  const pathname = usePathname();
  useEffect(() => {
    if (ref.current) ref.current.open = false;
  }, [pathname]);

  return (
    <details ref={ref} className="mobile-menu">
      <summary className="mobile-menu__toggle">
        <Icon name="menu" />
        <span>{t.menu}</span>
      </summary>
      <div className="mobile-menu__panel">
        <nav aria-label={t.primaryLabel}>
          <ul>
            {primaryNav.map((l) => (
              <li key={l.href}>
                <Link href={l.href} aria-current={pathname === l.href ? 'page' : undefined}>
                  {l.label}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/search">{t.search}</Link>
            </li>
          </ul>
        </nav>
        <ReadingSettingsButton />
      </div>
    </details>
  );
}
