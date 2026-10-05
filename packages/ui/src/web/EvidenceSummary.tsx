import { en } from '../shared/strings.en';
import { evidenceFacts, type EvidenceSummaryData } from '../shared/format';
import { ReceiptEdge } from './ReceiptCard';
import { Stamp } from './Stamp';
import { SkeletonLine } from './Skeleton';

export type EvidenceSummaryProps =
  | { state: 'loading' }
  | { state: 'under_review' }
  | { state: 'no_results' }
  | {
      state: 'ready';
      name: string;
      subtitle?: string;
      data: EvidenceSummaryData;
      /** e.g. "deposit taken, no-show" */
      reportedFor?: string;
      now?: Date;
    };

/** Never a score. Only what was reported and reviewed (SPEC 4.2). */
export function EvidenceSummary(props: EvidenceSummaryProps) {
  if (props.state === 'loading') {
    return (
      <div className="rmmm-evidence" role="status" aria-busy="true">
        <div className="rmmm-evidence__body">
          <span className="rmmm-visually-hidden">{en.common.loading}</span>
          <SkeletonLine width="30%" />
          <SkeletonLine width="70%" />
          <SkeletonLine width="100%" />
          <SkeletonLine width="85%" />
        </div>
        <ReceiptEdge />
      </div>
    );
  }
  if (props.state === 'under_review' || props.state === 'no_results') {
    const review = props.state === 'under_review';
    return (
      <section className="rmmm-notice" aria-live="polite">
        <p className="rmmm-notice__title">
          {review ? en.evidence.underReviewTitle : en.evidence.noResultsTitle}
        </p>
        <p className="rmmm-notice__body">
          {review ? en.evidence.underReviewBody : en.evidence.noResultsBody}
        </p>
      </section>
    );
  }
  const facts = evidenceFacts(props.data, props.now);
  return (
    <section className="rmmm-evidence" aria-label={`Evidence summary for ${props.name}`}>
      <div className="rmmm-evidence__body">
        <div className="rmmm-evidence__head">
          <div>
            <p className="rmmm-evidence__eyebrow">Evidence summary</p>
            <h2 className="rmmm-evidence__name">{props.name}</h2>
            {props.subtitle && <p className="rmmm-evidence__sub">{props.subtitle}</p>}
          </div>
          <Stamp kind="alleged" size="sm" tilt={-6} />
        </div>
        <hr className="rmmm-evidence__rule" />
        <ul className="rmmm-evidence__facts">
          {facts.map((f) => (
            <li key={f}>{f}</li>
          ))}
        </ul>
        {props.reportedFor && (
          <p className="rmmm-evidence__sub">Reported for: {props.reportedFor}.</p>
        )}
      </div>
      <ReceiptEdge />
    </section>
  );
}
