import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { en } from '@rmmm/ui';
import { SignInForm } from '@/components/auth/SignInForm';
import { getSession, safeNext } from '@/lib/session';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: en.auth.title, robots: { index: false } };

export default async function AuthPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const next = safeNext((await searchParams).next);
  if (await getSession()) redirect(next);
  return (
    <div className="container" style={{ paddingTop: 40, display: 'grid', gap: 16 }}>
      <h1 className="h1">{en.auth.title}</h1>
      <p className="lede">{en.auth.lede}</p>
      <SignInForm next={next} />
    </div>
  );
}
