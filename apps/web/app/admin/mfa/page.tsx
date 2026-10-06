import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { en } from '@rmmm/ui/web';
import { MfaForm } from '@/components/admin/MfaForm';
import { PageHead } from '@/components/content/PageHead';
import { checkStaff } from '@/lib/admin/staff';
import { requireSignedIn, safeNext } from '@/lib/session';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: en.admin.mfa.title,
  robots: { index: false, follow: false },
};

export default async function MfaPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  await requireSignedIn('/admin/mfa');
  const check = await checkStaff();
  if (!check.ok && check.reason !== 'needs_mfa') notFound();
  return (
    <div className="container stack-lg">
      <PageHead title={en.admin.mfa.title} lede={en.admin.mfa.lede} />
      <MfaForm
        next={safeNext(next, '/admin').startsWith('/admin') ? safeNext(next, '/admin') : '/admin'}
      />
    </div>
  );
}
