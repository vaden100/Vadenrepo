import type { Metadata } from 'next';
import { en } from '@rmmm/ui/web';
import { PageHead } from '@/components/content/PageHead';
import { ClaimStatus } from '@/components/report/ClaimStatus';
import { getNonce } from '@/lib/nonce';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata({
  title: en.report.status.title,
  description: en.report.status.description,
  path: '/report/status',
});

export default async function ReportStatusPage() {
  const nonce = await getNonce();
  return (
    <div className="container grid">
      <div className="span-7 stack-lg">
        <PageHead
          nonce={nonce}
          crumbs={[
            { label: en.nav.home, href: '/' },
            { label: en.report.title, href: '/report' },
            { label: en.report.status.title },
          ]}
          title={en.report.status.title}
          lede={en.report.status.lede}
        />
        <ClaimStatus />
      </div>
    </div>
  );
}
