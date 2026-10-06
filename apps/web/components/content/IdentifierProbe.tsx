'use client';

import { useEffect, useId, useRef, useState } from 'react';
import type { ClassifiedQuery } from '@rmmm/search-core';
import { buttonClass, en, Icon, ReceiptEdge } from '@rmmm/ui/web';
import { track } from '@/components/shell/analytics';

type Classifier = (q: string) => ClassifiedQuery | null;

/** What we would search for, shown the way it is stored (masked style only for display). */
function display(c: ClassifiedQuery): string {
  if (c.kind === 'cashtag') return `$${c.norm}`;
  if (c.kind === 'handle') return `@${c.norm}`;
  return c.norm;
}

/**
 * The hero's live check (docs/website-foundations.md 3): as you type, the real search-core
 * classifier says what the input is and what would be searched. Progressive enhancement:
 * without JS it is a plain GET form to /lookup, which classifies on the server.
 * The classifier (phone metadata + domain list) is loaded on first focus, not on page load.
 */
export function IdentifierProbe({
  initial = '',
  initialResult = null,
  autoFocus = false,
  headingLevel = 2,
}: {
  initial?: string;
  /** Classified on the server, so the readout is there on first paint and without JS. */
  initialResult?: ClassifiedQuery | null;
  autoFocus?: boolean;
  headingLevel?: 2 | 3;
}) {
  const [q, setQ] = useState(initial);
  const [classify, setClassify] = useState<Classifier | null>(null);
  const [loading, setLoading] = useState(Boolean(initial));
  const started = useRef(false);
  const id = useId().replace(/:/g, '');

  const fetchClassifier = () =>
    import('@rmmm/search-core')
      .then((m) => setClassify(() => m.classify))
      .finally(() => setLoading(false));

  const load = () => {
    if (classify || loading) return;
    setLoading(true);
    void fetchClassifier();
  };

  // A query in the URL: load the classifier right away (state already says "loading").
  useEffect(() => {
    if (initial) void fetchClassifier();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const result = classify ? classify(q) : q === initial ? initialResult : null;
  const H = headingLevel === 2 ? 'h2' : 'h3';

  return (
    <form
      action="/lookup"
      method="get"
      role="search"
      className="probe"
      aria-label={en.lookup.title}
    >
      <label id={`${id}-label`} htmlFor={`${id}-q`} className="probe__label">
        {en.lookup.label}
      </label>
      <div className="probe__bar">
        <Icon name="lookup" size={24} className="probe__icon" />
        <input
          id={`${id}-q`}
          name="q"
          className="probe__input"
          value={q}
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          enterKeyHint="search"
          maxLength={200}
          autoFocus={autoFocus}
          aria-describedby={`${id}-readout`}
          onFocus={load}
          onChange={(e) => {
            if (!started.current) {
              started.current = true;
              track('search_started', { surface: 'probe' });
            }
            setQ(e.target.value);
          }}
        />
        <button type="submit" className={buttonClass('primary', { className: 'probe__go' })}>
          {en.nav.lookup}
        </button>
      </div>

      <div id={`${id}-readout`} className="probe__readout" aria-live="polite" aria-atomic="true">
        {loading && !classify && !result ? (
          <p className="probe__line probe__line--muted">{en.lookup.loadingProbe}</p>
        ) : result ? (
          <div className="rmmm-receipt probe__receipt">
            <div className="rmmm-receipt__body">
              <H className="rmmm-visually-hidden">{en.lookup.detected}</H>
              <dl className="probe__dl">
                <div>
                  <dt>{en.lookup.detected}</dt>
                  <dd>
                    {en.lookup.kinds[result.kind]}
                    {result.platform ? ` · ${en.lookup.platforms[result.platform]}` : ''}
                  </dd>
                </div>
                <div>
                  <dt>{en.lookup.normalized}</dt>
                  <dd className="mono">{display(result)}</dd>
                </div>
              </dl>
              <p className="probe__why">{en.lookup.whyKind[result.kind]}</p>
            </div>
            <ReceiptEdge />
          </div>
        ) : null}
      </div>
    </form>
  );
}
