import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { en } from '@rmmm/ui/web';
import { AdminNav } from '@/components/admin/AdminNav';
import { requireStaff } from '@/lib/admin/staff';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: { template: `%s | ${en.admin.title}`, default: en.admin.title },
  robots: { index: false, follow: false },
};

/** Staff only (SPEC 5 admin): signed in, staff role, 2FA this session. Others get a 404. */
export default async function AdminLayout({ children }: { children: ReactNode }) {
  const staff = await requireStaff('/admin');
  return (
    <div className="container admin-shell">
      <AdminNav
        role={staff.role}
        who={en.admin.signedInAs(staff.name, en.admin.roles[staff.role] ?? staff.role)}
      />
      <div className="admin-main">{children}</div>
    </div>
  );
}
