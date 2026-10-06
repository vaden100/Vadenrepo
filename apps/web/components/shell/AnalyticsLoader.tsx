import Script from 'next/script';

/** Rendered only when analytics is configured and consented (decided server-side in the layout). */
export function AnalyticsLoader({
  nonce,
  host,
  domain,
}: {
  nonce?: string;
  host: string;
  domain: string;
}) {
  return (
    <Script
      src={`https://${host}/js/script.js`}
      data-domain={domain}
      strategy="afterInteractive"
      nonce={nonce}
    />
  );
}
