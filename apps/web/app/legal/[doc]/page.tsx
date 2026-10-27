import { notFound } from 'next/navigation';
import { strings } from '@ns1/i18n';
import { Notice } from '@ns1/ui';
import { PageHead } from '@/components/PageHead';
import { legalDocs } from '@/content/legal/generated';
import { page } from '@/content/pages';
import { Markdown } from '@/lib/markdown';
import { pageMetadata } from '@/lib/metadata';

type Doc = keyof typeof legalDocs;
const DOCS = Object.keys(legalDocs) as Doc[];
const isDoc = (d: string): d is Doc => Object.hasOwn(legalDocs, d);

export function generateStaticParams() {
  return DOCS.map((doc) => ({ doc }));
}
export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<{ doc: string }> }) {
  const { doc } = await params;
  return isDoc(doc) ? pageMetadata({ ...page(`/legal/${doc}`) }) : {};
}

/** Legal drafts (SPEC 5): marked pending counsel until a lawyer reviews them. */
export default async function LegalPage({ params }: { params: Promise<{ doc: string }> }) {
  const { doc } = await params;
  if (!isDoc(doc)) notFound();
  const meta = page(`/legal/${doc}`);
  return (
    <>
      <PageHead title={meta.title} />
      <Notice>{strings().legal.draftNotice}</Notice>
      <Markdown source={legalDocs[doc]} />
    </>
  );
}
