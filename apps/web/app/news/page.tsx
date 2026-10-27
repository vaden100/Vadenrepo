import { strings } from '@ns1/i18n';
import { PageHead } from '@/components/PageHead';
import { page } from '@/content/pages';
import { pageMetadata } from '@/lib/metadata';

const meta = page('/news');
export const metadata = pageMetadata({ ...meta });

export default function NewsPage() {
  return (
    <>
      <PageHead title={meta.title} />
      <p>{strings().news.empty}</p>
    </>
  );
}
