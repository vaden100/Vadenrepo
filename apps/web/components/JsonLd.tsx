import { getNonce } from '@/lib/nonce';

/** Structured data (SPEC 13). JSON is escaped so it cannot close the script element. */
export async function JsonLd({ data }: { data: Record<string, unknown> }) {
  const nonce = await getNonce();
  const json = JSON.stringify(data).replace(/</g, '\\u003c');
  return (
    <script type="application/ld+json" nonce={nonce} dangerouslySetInnerHTML={{ __html: json }} />
  );
}
