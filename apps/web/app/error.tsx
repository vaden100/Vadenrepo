'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Button, buttonClass, en } from '@rmmm/ui/web';
import { reportClientError } from '@/components/shell/report-error';

/** WBS 45: branded error state. No stack traces; the digest lets us find the server log. */
export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => reportClientError(error), [error]);
  return (
    <div className="container stack-lg" role="alert">
      <div className="stack">
        <p className="eyebrow">500</p>
        <h1 className="h1">{en.errors.serverTitle}</h1>
        <p className="lede">{en.errors.serverBody}</p>
        {error.digest && <p className="mono muted">{en.errors.reference(error.digest)}</p>}
      </div>
      <div className="row">
        <Button onClick={reset}>{en.errors.retry}</Button>
        <Link href="/" className={buttonClass('secondary')}>
          {en.errors.goHome}
        </Link>
        <Link href="/contact" className={buttonClass('text')}>
          {en.errors.contactUs}
        </Link>
      </div>
    </div>
  );
}
