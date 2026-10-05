import { en } from '../shared/strings.en';
import type { MatchReason } from '../shared/status';
import { Icon } from './Icon';

export interface LinkedPage {
  label: string;
  href?: string;
  reason: MatchReason;
}

/** Rebrand graph as a simple node list. Only staff-confirmed links are public. */
export function LinkedPages({ pages }: { pages: LinkedPage[] }) {
  return (
    <section className="rmmm-linked">
      <h3 className="rmmm-section-title">
        {pages.length ? en.evidence.linkedPages(pages.length) : en.linkedPages.title}
      </h3>
      {pages.length === 0 ? (
        <p className="rmmm-muted">{en.linkedPages.empty}</p>
      ) : (
        <ul className="rmmm-linked__list">
          {pages.map((p) => (
            <li key={p.label} className="rmmm-linked__item">
              <Icon name="linked-pages" size={22} className="rmmm-linked__icon" />
              <div>
                {p.href ? (
                  <a className="rmmm-linked__label" href={p.href}>
                    {p.label}
                  </a>
                ) : (
                  <span className="rmmm-linked__label">{p.label}</span>
                )}
                <span className="rmmm-linked__reason">{en.whyMatched[p.reason]}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
