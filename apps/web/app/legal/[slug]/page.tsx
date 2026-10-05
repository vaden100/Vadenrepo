import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getLegalDoc, legalDocs } from '@/lib/legal';

export const dynamicParams = false;

export function generateStaticParams() {
  return legalDocs.map((d) => ({ slug: d.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const doc = getLegalDoc((await params).slug);
  return { title: doc?.title };
}

export default async function LegalPage({ params }: { params: Promise<{ slug: string }> }) {
  const doc = getLegalDoc((await params).slug);
  if (!doc) notFound();
  return (
    <div className="container prose" style={{ paddingTop: 40 }}>
      <p className="mono" style={{ color: 'var(--rmmm-caution)', margin: 0 }}>
        DRAFT. PENDING LEGAL REVIEW.
      </p>
      <h1 className="h1" style={{ marginTop: 8 }}>
        {doc.title}
      </h1>
      <p className="lede">{doc.summary}</p>
      {doc.sections.map((s) => (
        <section key={s}>
          <h2>{s}</h2>
          <p style={{ color: 'var(--color-text-muted)' }}>[TO BE WRITTEN WITH COUNSEL]</p>
        </section>
      ))}
    </div>
  );
}
