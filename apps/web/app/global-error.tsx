'use client';

import { strings } from '@ns1/i18n';

const t = strings();

/** Last resort when the root layout itself fails. Plain HTML, no dependencies. */
export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html lang={t.meta.lang}>
      <body>
        <main>
          <h1>{t.errors.serverHeading}</h1>
          <p>{t.errors.serverProse}</p>
          <button type="button" onClick={reset}>
            {t.errors.actions.retry}
          </button>{' '}
          {/* A full reload on purpose: the root layout and router may be what failed. */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a href="/">{t.errors.actions.home}</a>
        </main>
      </body>
    </html>
  );
}
