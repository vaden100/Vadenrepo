import Link from 'next/link';
import type { SearchResponse } from '@rmmm/api';
import { EvidenceSummary, LinkedPages, WhyMatched, en } from '@rmmm/ui/web';
import { OutsideRecords } from './OutsideRecords';
import { categoryLabel, linkedPages, officialChecks, place, reasonChips } from './results';

/** SPEC 4.2 results: evidence summary, why it matched, linked pages. Never a score. */
export function SearchResults({ data, now }: { data: SearchResponse; now: Date }) {
  const checks = officialChecks(data.results.map((r) => r.category));
  if (data.results.length === 0) {
    return (
      <div className="stack-lg">
        <OutsideRecords records={data.outside ?? []} />
        <EvidenceSummary state={data.underReview ? 'under_review' : 'no_results'} />
      </div>
    );
  }
  return (
    <section aria-labelledby="results-title" className="stack-lg">
      <h2 id="results-title" className="h3">
        {en.lookup.resultsTitle(data.results.length)}
      </h2>
      <ol className="results">
        {data.results.map((hit) => (
          <li key={hit.slug} className="results__item stack" data-testid="search-hit">
            <EvidenceSummary
              state="ready"
              name={hit.name}
              subtitle={place(hit.city, hit.state) || undefined}
              reportedFor={categoryLabel(hit.category)}
              now={now}
              data={{
                reportCount: hit.summary.reports,
                reviewedCount: hit.summary.reviewed,
                amountLostCents: hit.summary.amountCents,
                lastReportAt: new Date(hit.summary.lastReportAt ?? now),
                linkedPageCount: hit.links.length,
              }}
            />
            <WhyMatched reasons={reasonChips(hit)} />
            {hit.links.length > 0 && <LinkedPages pages={linkedPages(hit.links)} />}
            <p>
              <Link href={`/entities/${hit.slug}`}>{en.lookup.openPage(hit.name)}</Link>
            </p>
          </li>
        ))}
      </ol>
      {data.underReview && <EvidenceSummary state="under_review" />}
      <OutsideRecords records={data.outside ?? []} />
      {checks.length > 0 && (
        <section aria-labelledby="official" className="stack">
          <h3 id="official">{en.lookup.officialChecks}</h3>
          <ul>
            {checks.map((c) => (
              <li key={c.href}>
                <a href={c.href} rel="noopener noreferrer" target="_blank">
                  {c.label}
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}
    </section>
  );
}
