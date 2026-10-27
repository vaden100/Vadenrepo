import { strings } from '@ns1/i18n';
import { LinkButton } from '@ns1/ui';
import type { Metadata } from 'next';

const t = strings().errors;

export const metadata: Metadata = { title: t.notFoundTitle, robots: { index: false } };

export default function NotFound() {
  return (
    <div className="stack">
      <h1>{t.notFoundHeading}</h1>
      <p>{t.notFoundProse}</p>
      <LinkButton href="/" icon="arrow-left" variant="secondary">
        {t.actions.home}
      </LinkButton>
    </div>
  );
}
