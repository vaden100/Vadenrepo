import type { OutsideRecord } from '@rmmm/api';
import { en } from '@rmmm/ui/web';

const t = en.lookup;

/**
 * Outside lists (docs/open-data-sources.md): a sourced, neutral fact about a website, kept
 * apart from our own reviewed reports and never part of ranking.
 */
export function OutsideRecords({ records }: { records: OutsideRecord[] }) {
  if (!records.length) return null;
  return (
    <section
      aria-labelledby="outside-title"
      className="rmmm-notice stack"
      data-testid="outside-records"
    >
      <h2 id="outside-title" className="rmmm-notice__title">
        {t.outsideTitle}
      </h2>
      {records.map((r) => (
        <div key={r.source + r.value} className="stack">
          <p>
            {t.outsideFound(r.value, r.label)}{' '}
            {r.listUpdatedAt &&
              t.outsideUpdated(
                new Date(r.listUpdatedAt).toLocaleDateString('en-US', {
                  dateStyle: 'medium',
                  timeZone: 'UTC',
                }),
              )}
          </p>
          <p className="muted">{t.outsideCaveat}</p>
          <p className="muted">
            <a href={r.url} rel="noopener noreferrer" target="_blank">
              {r.label}
            </a>{' '}
            · {t.outsideSource(r.license)}
            {r.falsePositiveUrl && (
              <>
                {' '}
                ·{' '}
                <a href={r.falsePositiveUrl} rel="noopener noreferrer" target="_blank">
                  {t.outsideMistake}
                </a>
              </>
            )}
          </p>
        </div>
      ))}
    </section>
  );
}
