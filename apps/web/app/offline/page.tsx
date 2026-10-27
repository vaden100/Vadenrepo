import { strings } from '@ns1/i18n';
import { CrisisBox } from '@/components/CrisisBox';
import { pageMetadata } from '@/lib/metadata';

const t = strings().offline;
export const metadata = pageMetadata({
  title: t.title,
  description: t.description,
  path: '/offline',
  noindex: true,
});

/** Shown by the service worker (Phase 7) when the network is down. Keeps crisis lines. */
export default function OfflinePage() {
  return (
    <>
      <h1>{t.title}</h1>
      <p>{t.prose}</p>
      <CrisisBox />
    </>
  );
}
