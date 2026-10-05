import { en } from '../shared/strings.en';
import type { MatchReason } from '../shared/status';

export interface WhyMatchedProps {
  reasons: { reason: MatchReason; detail?: string; strongest?: boolean }[];
}

export function WhyMatched({ reasons }: WhyMatchedProps) {
  return (
    <section className="rmmm-why">
      <h3 className="rmmm-section-title">{en.whyMatched.title}</h3>
      <ul className="rmmm-chips">
        {reasons.map((r) => (
          <li
            key={r.reason + (r.detail ?? '')}
            className={r.strongest ? 'rmmm-chip rmmm-chip--strong' : 'rmmm-chip'}
          >
            {en.whyMatched[r.reason]}
            {r.detail ? ` ${r.detail}` : ''}
          </li>
        ))}
      </ul>
    </section>
  );
}
