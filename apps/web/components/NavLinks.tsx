'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { strings } from '@ns1/i18n';
import { primaryNav } from './nav';

/** Wide-screen navigation, with the current page marked. */
export function NavLinks() {
  const pathname = usePathname();
  return (
    <nav aria-label={strings().nav.primaryLabel} className="nav-wide">
      <ul>
        {primaryNav.map((l) => (
          <li key={l.href}>
            <Link href={l.href} aria-current={pathname === l.href ? 'page' : undefined}>
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
