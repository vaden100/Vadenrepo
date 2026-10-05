import type { ReactNode } from 'react';
import { en } from '../shared/strings.en';
import type { StampKind } from '../shared/status';
import { Stamp } from './Stamp';

export interface CaseEnvelopeProps {
  caseNumber: string;
  title: string;
  /** e.g. "Deposit taken / no-show · Atlanta, GA" */
  meta?: ReactNode;
  status: StampKind;
  animateStatus?: boolean;
  children?: ReactNode;
  href?: string;
}

export function CaseEnvelope({
  caseNumber,
  title,
  meta,
  status,
  animateStatus,
  children,
  href,
}: CaseEnvelopeProps) {
  const heading = href ? <a href={href}>{title}</a> : title;
  return (
    <article className="rmmm-envelope">
      <div className="rmmm-envelope__tab">
        <span className="rmmm-visually-hidden">{en.envelope.caseNumber} </span>
        {caseNumber}
      </div>
      <div className="rmmm-envelope__body">
        {meta && <p className="rmmm-envelope__meta">{meta}</p>}
        <h3 className="rmmm-envelope__title">{heading}</h3>
        <div className="rmmm-envelope__row">
          <div className="rmmm-envelope__clasp" aria-hidden="true" />
          <Stamp kind={status} animate={animateStatus} size="sm" tilt={-4} />
        </div>
        {children}
      </div>
    </article>
  );
}

export function EmptyCaseEnvelope({
  artSrc = '/brand/empty-case-envelope.svg',
  title = en.envelope.emptyTitle,
  body = en.envelope.emptyBody,
}: {
  artSrc?: string;
  title?: string;
  body?: string;
}) {
  return (
    <div className="rmmm-empty">
      <img src={artSrc} alt="" width={240} height={180} />
      <p className="rmmm-empty__title">{title}</p>
      <p className="rmmm-empty__body">{body}</p>
    </div>
  );
}
