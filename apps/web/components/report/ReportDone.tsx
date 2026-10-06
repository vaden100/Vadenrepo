'use client';

import { useState, type RefObject } from 'react';
import Link from 'next/link';
import type { SubmitResult } from '@rmmm/api';
import { Button, en, Stamp, StatusMessage } from '@rmmm/ui/web';

const t = en.report.done;
const RAILS_WITH_GUIDES = new Set([
  'card',
  'cashapp',
  'zelle',
  'venmo',
  'paypal',
  'apple_cash',
  'crypto',
  'cash',
]);

/** After submit (SPEC 4.1): case code, the one-time claim code, next steps, other places to report. */
export function ReportDone({
  result,
  member,
  headingRef,
}: {
  result: SubmitResult & { rail?: string };
  member: boolean;
  headingRef: RefObject<HTMLHeadingElement | null>;
}) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    const text = result.claimCode ? `${result.code} ${result.claimCode}` : result.code;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };
  const rail = result.rail && RAILS_WITH_GUIDES.has(result.rail) ? result.rail : null;

  return (
    <div className="report report--done stack-lg">
      <div className="done__head">
        <h2 ref={headingRef} tabIndex={-1} className="report__title">
          {t.title}
        </h2>
        <Stamp kind="reported" animate />
      </div>
      <dl className="codes">
        <div>
          <dt>{t.caseCode}</dt>
          <dd className="codes__value" data-testid="case-code">
            {result.code}
          </dd>
        </div>
        {result.claimCode && (
          <div>
            <dt>{t.claimCode}</dt>
            <dd className="codes__value" data-testid="claim-code">
              {result.claimCode}
            </dd>
          </div>
        )}
      </dl>
      {result.claimCode && <StatusMessage tone="warning" title={t.claimWarning} />}
      <div>
        <Button variant="secondary" onClick={copy} success={copied} successLabel={t.copied}>
          {result.claimCode ? t.copyBoth : t.copy}
        </Button>
      </div>

      <section aria-labelledby="next-title" className="stack">
        <h3 id="next-title">{t.next}</h3>
        <ol className="done__steps">
          {t.nextSteps.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="also-title" className="stack">
        <h3 id="also-title">{t.alsoReport}</h3>
        <ul className="done__links">
          <li>
            <a href="https://reportfraud.ftc.gov/" rel="noopener noreferrer" target="_blank">
              {t.ftc}
            </a>
          </li>
          <li>
            <a href="https://www.ic3.gov/" rel="noopener noreferrer" target="_blank">
              {t.ic3}
            </a>
          </li>
          <li>
            <Link href={`/resources/payment-disputes${rail ? `#${rail}` : ''}`}>
              {rail
                ? t.dispute(en.report.money.rails[rail as keyof typeof en.report.money.rails])
                : t.disputeAny}
            </Link>
          </li>
        </ul>
      </section>

      <p>
        <Link href={member ? '/account' : '/report/status'}>
          {member ? t.account : t.checkStatus}
        </Link>
      </p>
    </div>
  );
}
