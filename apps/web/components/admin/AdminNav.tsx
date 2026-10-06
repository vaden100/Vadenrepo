'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { en } from '@rmmm/ui/web';

const t = en.admin.nav;

export function AdminNav({ role, who }: { role: string; who: string }) {
  const path = usePathname() ?? '';
  const items = [
    { href: '/admin', label: t.dashboard },
    { href: '/admin/reports', label: t.reports },
    { href: '/admin/entities', label: t.entities },
    { href: '/admin/flags', label: t.flags },
    { href: '/admin/disputes', label: t.disputes },
    ...(role === 'admin'
      ? [
          { href: '/admin/bans', label: t.bans },
          { href: '/admin/audit', label: t.audit },
        ]
      : []),
  ];
  const current = (href: string) => (href === '/admin' ? path === '/admin' : path.startsWith(href));
  return (
    <nav className="admin-nav" aria-label={t.label}>
      <p className="admin-nav__who mono">{who}</p>
      <ul>
        {items.map((i) => (
          <li key={i.href}>
            <Link href={i.href} aria-current={current(i.href) ? 'page' : undefined}>
              {i.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
