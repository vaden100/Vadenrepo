import { en } from '@rmmm/ui/web';
import { stats, STATS_REVIEWED } from '@/content/stats';

/** Sourced FTC figures so people know the scale, with every number linked to its source. */
export function ByTheNumbers({ headingLevel = 2 }: { headingLevel?: 2 | 3 }) {
  const H = headingLevel === 2 ? 'h2' : 'h3';
  return (
    <section aria-labelledby="numbers-title" className="stack">
      <H id="numbers-title" className="h2">
        {en.lookup.byNumbersTitle}
      </H>
      <ul className="numbers">
        {stats.map((s) => (
          <li key={s.figure} className="numbers__item">
            <p className="numbers__figure">{s.figure}</p>
            <p>{s.label}</p>
            <p className="muted numbers__source">
              {en.lookup.byNumbersSource}:{' '}
              <a href={s.source.href} rel="noopener noreferrer" target="_blank">
                {s.source.name}
              </a>
            </p>
          </li>
        ))}
      </ul>
      <p className="muted">{en.pages.reviewed(STATS_REVIEWED)}</p>
    </section>
  );
}
