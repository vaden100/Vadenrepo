import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { en } from '@rmmm/ui/web';
import { OnboardingForm } from '@/components/auth/OnboardingForm';
import { PageHead } from '@/components/content/PageHead';
import { getSession, safeNext } from '@/lib/session';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: en.onboarding.title, robots: { index: false } };

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const next = safeNext((await searchParams).next);
  const session = await getSession();
  if (!session) redirect(`/auth?next=${encodeURIComponent(`/onboarding?next=${next}`)}`);
  if (session.profile?.age_confirmed_at && session.profile.terms_accepted_at) redirect(next);
  return (
    <div className="container stack-lg">
      <PageHead title={en.onboarding.title} lede={en.onboarding.lede} />
      <OnboardingForm next={next} />
    </div>
  );
}
