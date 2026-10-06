'use client';

import { useEffect } from 'react';
import { en } from '@rmmm/ui';
import { reportClientError } from '@/components/shell/report-error';

/**
 * Last-resort boundary when the root layout itself fails. It replaces <html>, so it carries
 * minimal inline styling and plain links (no app components that might be what broke).
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => reportClientError(error), [error]);
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          background: '#111111',
          color: '#F2EEE6',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <main style={{ maxWidth: 640, margin: '0 auto', padding: '64px 16px', lineHeight: 1.5 }}>
          <p style={{ fontFamily: 'monospace', letterSpacing: '0.08em' }}>500</p>
          <h1 style={{ fontSize: 36, lineHeight: 1.1, textTransform: 'uppercase' }}>
            {en.errors.serverTitle}
          </h1>
          <p>{en.errors.serverBody}</p>
          {error.digest && (
            <p style={{ fontFamily: 'monospace' }}>{en.errors.reference(error.digest)}</p>
          )}
          <p style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
            <button
              type="button"
              onClick={reset}
              style={{
                minHeight: 48,
                padding: '0 20px',
                background: '#C8202B',
                color: '#F2EEE6',
                border: 0,
                borderRadius: 2,
                fontSize: 16,
                fontWeight: 600,
              }}
            >
              {en.errors.retry}
            </button>
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- the app shell may be broken; use a full page load */}
            <a href="/" style={{ color: '#F5C518' }}>
              {en.errors.goHome}
            </a>
          </p>
        </main>
      </body>
    </html>
  );
}
