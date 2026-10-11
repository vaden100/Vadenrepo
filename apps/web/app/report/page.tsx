import type { Metadata } from 'next';
import Link from 'next/link';
import { en } from '@rmmm/ui/web';
import { PageHead } from '@/components/content/PageHead';
import { ReportFlow } from '@/components/report/ReportFlow';
import { getNonce } from '@/lib/nonce';
import { pageMetadata } from '@/lib/seo';
import { db } from '@/lib/server/db';
import { getSession } from '@/lib/session';

export const metadata: Metadata = pageMetadata({
  title: en.report.title,
  description: en.report.description,
  path: '/report',
});

export default async function ReportPage({
  searchParams,
}: {
  searchParams: Promise<{ entity?: string }>;
}) {
  const slug = (await searchParams).entity;
  const prefill =
    slug && /^[a-z0-9-]{1,80}$/.test(slug)
      ? await db
          .rpc<{ name: string } | null>('entity_page', { entity_slug: slug })
          .catch(() => null)
      : null;
  const [nonce, session] = await Promise.all([getNonce(), getSession()]);
  const p = session?.profile;
  const member =
    session && p?.age_confirmed_at && p.terms_accepted_at
      ? { name: p.display_name || session.user.email || session.user.phone || en.account.title }
      : null;
  return (
    <div className="container grid">
      <div className="span-8 stack-lg">
        <PageHead
          nonce={nonce}
          crumbs={[{ label: en.nav.home, href: '/' }, { label: en.report.title }]}
          title={en.report.title}
          lede={en.report.lede}
        />
        <ReportFlow member={member} prefillName={prefill?.name} />
      </div>
      <aside className="span-4 stack report-aside" aria-label={en.report.title}>
        <p className="muted">{en.report.privacyNote}</p>
        <p className="muted">
          <Link href="/report/status">{en.report.status.title}</Link>
        </p>
      </aside>
    </div>
  );
}
