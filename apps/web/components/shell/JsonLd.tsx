/** Structured data, nonce'd so the CSP allows it. Only facts that are true (WBS 26). */
export function JsonLd({ data, nonce }: { data: object; nonce?: string }) {
  return (
    <script
      type="application/ld+json"
      nonce={nonce}
      // JSON.stringify output with </ escaped so content can never close the script tag.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }}
    />
  );
}
