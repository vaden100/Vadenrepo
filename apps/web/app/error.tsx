'use client';

import { strings } from '@ns1/i18n';
import { Button, LinkButton } from '@ns1/ui';

const t = strings().errors;

/** 500 inside the layout: header and footer stay, so help and contact links remain. */
export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="stack">
      <h1>{t.serverHeading}</h1>
      <p>{t.serverProse}</p>
      <div className="cluster">
        <Button onClick={reset}>{t.actions.retry}</Button>
        <LinkButton href="/" variant="secondary">
          {t.actions.home}
        </LinkButton>
      </div>
    </div>
  );
}
