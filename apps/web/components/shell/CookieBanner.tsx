'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button, en } from '@rmmm/ui/web';
import { saveConsent } from './consent-client';

/**
 * Shown only when an optional category exists and no choice has been made (WBS 31, 101).
 * Not a modal: the page stays usable. "Necessary only" has the same weight as "Allow".
 */
export function CookieBanner() {
  const router = useRouter();
  const [busy, setBusy] = useState<null | boolean>(null);
  const [error, setError] = useState(false);
  const [done, setDone] = useState(false);
  if (done) return null;

  const choose = async (analytics: boolean) => {
    setBusy(analytics);
    setError(false);
    const ok = await saveConsent(analytics);
    setBusy(null);
    if (!ok) return setError(true);
    setDone(true);
    router.refresh();
  };

  return (
    <section className="cookie-banner" aria-labelledby="cookie-banner-title">
      <div className="container cookie-banner__inner">
        <div>
          <h2 id="cookie-banner-title" className="cookie-banner__title">
            {en.cookies.bannerTitle}
          </h2>
          <p className="cookie-banner__body">{en.cookies.bannerBody}</p>
          {error && (
            <p className="rmmm-field__error" role="alert">
              {en.cookies.saveFailed}
            </p>
          )}
        </div>
        <div className="cookie-banner__actions">
          <Button variant="secondary" onClick={() => choose(false)} loading={busy === false}>
            {en.cookies.rejectAll}
          </Button>
          <Button variant="secondary" onClick={() => choose(true)} loading={busy === true}>
            {en.cookies.acceptAll}
          </Button>
          <Link href="/privacy-settings" className="rmmm-btn rmmm-btn--text">
            {en.cookies.customize}
          </Link>
        </div>
      </div>
    </section>
  );
}
