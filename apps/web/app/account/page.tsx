import type { Metadata } from 'next';
import { en } from '@rmmm/ui';
import { SignOutButton } from '@/components/auth/SignOutButton';
import { requireMember } from '@/lib/session';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: en.account.title, robots: { index: false } };

export default async function AccountPage() {
  const { user, profile } = await requireMember('/account');
  const who = user.email ?? user.phone ?? user.id;
  return (
    <div
      className="container"
      style={{ paddingTop: 40, display: 'grid', gap: 16, justifyItems: 'start' }}
    >
      <h1 className="h1">{en.account.title}</h1>
      <p>{en.account.signedInAs(who)}</p>
      {profile && (
        <p className="mono" style={{ color: 'var(--color-text-muted)', margin: 0 }}>
          {en.account.role(profile.role)} ·{' '}
          {en.account.memberSince(new Date(profile.created_at).toLocaleDateString('en-US'))}
        </p>
      )}
      <SignOutButton />
    </div>
  );
}
