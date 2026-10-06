import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { en, StatusMessage } from '@rmmm/ui/web';
import { SignInForm } from '@/components/auth/SignInForm';
import { PageHead } from '@/components/content/PageHead';
import { getSession, safeNext } from '@/lib/session';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: en.auth.title, robots: { index: false } };

export default async function AuthPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; reason?: string }>;
}) {
  const sp = await searchParams;
  const next = safeNext(sp.next);
  if (await getSession()) redirect(next);
  return (
    <div className="container stack-lg">
      <PageHead title={en.auth.title} lede={en.auth.lede} />
      {sp.reason === 'expired' && <StatusMessage tone="info" title={en.states.sessionExpired} />}
      <SignInForm next={next} />
    </div>
  );
}
