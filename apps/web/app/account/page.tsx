import type { Metadata } from 'next';
import Link from 'next/link';
import { en, StatusMessage } from '@rmmm/ui/web';
import { PageHead } from '@/components/content/PageHead';
import { SignOutButton } from '@/components/auth/SignOutButton';
import { requireMember } from '@/lib/session';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: en.account.title, robots: { index: false } };

export default async function AccountPage() {
  const { user, profile } = await requireMember('/account');
  const who = user.email ?? user.phone ?? user.id;
  return (
    <div className="container stack-lg">
      <PageHead
        crumbs={[{ label: en.nav.home, href: '/' }, { label: en.account.title }]}
        title={en.account.title}
        lede={en.account.signedInAs(who)}
      />
      {profile?.banned_at && (
        <StatusMessage tone="warning" title={en.states.suspendedTitle}>
          <p>{en.states.suspendedBody}</p>
        </StatusMessage>
      )}
      {profile && (
        <p className="mono muted">
          {en.account.role(profile.role)} ·{' '}
          {en.account.memberSince(
            new Date(profile.created_at).toLocaleDateString('en-US', { dateStyle: 'medium' }),
          )}
        </p>
      )}
      <ul className="card-list">
        <li>
          <Link href="/privacy-settings" className="card-link">
            <h2>{en.account.privacyLink}</h2>
            <p>{en.cookies.necessaryBody}</p>
          </Link>
        </li>
        <li>
          <Link href="/account/delete" className="card-link">
            <h2>{en.account.deleteLink}</h2>
            <p>{en.deletion.lede}</p>
          </Link>
        </li>
      </ul>
      <div>
        <SignOutButton />
      </div>
    </div>
  );
}
