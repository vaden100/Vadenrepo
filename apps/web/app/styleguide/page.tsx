import type { Metadata } from 'next';
import type { CSSProperties, ReactNode } from 'react';
import { colors, contrastRatio, typeScale, space } from '@rmmm/tokens';
import {
  Button,
  CardSkeleton,
  CaseEnvelope,
  EmptyCaseEnvelope,
  EvidenceSummary,
  Icon,
  iconShapes,
  LinkedPages,
  MarkerHighlight,
  ReceiptCard,
  ReceiptSkeleton,
  SkeletonBlock,
  SkeletonLine,
  Stamp,
  STAMP_KINDS,
  WhyMatched,
  type IconName,
} from '@rmmm/ui/web';
import { StampSlamDemo, ThemeFrame } from './client';

export const metadata: Metadata = { title: 'Style guide', robots: { index: false } };

const NOW = new Date('2026-10-05T12:00:00Z');
const demoSummary = {
  reportCount: 6,
  reviewedCount: 4,
  amountLostCents: 124_000,
  lastReportAt: new Date('2026-10-02T12:00:00Z'),
  linkedPageCount: 2,
};

const grid: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 320px), 1fr))',
  gap: 24,
  alignItems: 'start',
};

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section style={{ padding: '40px 0', borderTop: '1px solid var(--color-border)' }}>
      <h2 className="h2" style={{ marginBottom: 24 }}>
        {title}
      </h2>
      {children}
    </section>
  );
}

function Label({ children }: { children: ReactNode }) {
  return (
    <p
      className="mono"
      style={{
        fontSize: 12,
        color: 'var(--color-text-muted)',
        margin: '0 0 8px',
        textTransform: 'uppercase',
      }}
    >
      {children}
    </p>
  );
}

export default function StyleguidePage() {
  return (
    <div className="container" style={{ paddingTop: 32 }}>
      <h1 className="display">Style guide</h1>
      <p className="lede">
        Every token and every component state from @rmmm/tokens and @rmmm/ui. Demo data only.
      </p>

      <ThemeFrame>
        <Section title="Color">
          <div style={grid}>
            {Object.entries(colors).map(([name, hex]) => (
              <div key={name} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <span
                  style={{
                    width: 56,
                    height: 56,
                    background: hex,
                    border: '1px solid var(--color-border)',
                    borderRadius: 2,
                    flexShrink: 0,
                  }}
                  aria-hidden="true"
                />
                <div className="mono" style={{ fontSize: 14 }}>
                  <div>{name}</div>
                  <div style={{ color: 'var(--color-text-muted)' }}>
                    {hex} · {contrastRatio(hex, colors.ink).toFixed(1)}:1 on ink ·{' '}
                    {contrastRatio(hex, colors.paper).toFixed(1)}:1 on paper
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Type">
          <div style={{ display: 'grid', gap: 16 }}>
            {Object.entries(typeScale).map(([name, t]) => (
              <div key={name}>
                <Label>
                  {name} · {t.family} · {t.size}/{t.lineHeight} · {t.weight}
                  {t.condensed ? ' · condensed' : ''}
                </Label>
                <p
                  style={{
                    margin: 0,
                    fontFamily: `var(--font-${t.family})`,
                    fontSize: t.size,
                    lineHeight: `${t.lineHeight}px`,
                    fontWeight: t.weight,
                    fontStretch: t.condensed ? '70%' : undefined,
                    textTransform: t.family === 'headline' ? 'uppercase' : undefined,
                  }}
                >
                  {t.family === 'mono'
                    ? 'RMMM-26-0412 · $1,240 · SEP 28'
                    : 'They thought nobody was watching.'}
                </p>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Spacing and shape">
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end', flexWrap: 'wrap' }}>
            {Object.entries(space)
              .filter(([, v]) => v > 0)
              .map(([k, v]) => (
                <div key={k} style={{ textAlign: 'center' }}>
                  <div
                    style={{
                      width: v,
                      height: v,
                      background: 'var(--rmmm-caution)',
                      borderRadius: 2,
                    }}
                  />
                  <span className="mono" style={{ fontSize: 12 }}>
                    {v}
                  </span>
                </div>
              ))}
          </div>
          <p className="rmmm-muted" style={{ marginTop: 16 }}>
            Radius 2 px. No shadows, no gradients. Depth comes from surface color.
          </p>
        </Section>

        <Section title="Icons">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24 }}>
            {(Object.keys(iconShapes) as IconName[]).map((n) => (
              <div key={n} style={{ display: 'grid', justifyItems: 'center', gap: 8, width: 88 }}>
                <Icon name={n} size={32} />
                <span className="mono" style={{ fontSize: 12 }}>
                  {n}
                </span>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Stamp">
          <Label>All kinds</Label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, marginBottom: 32 }}>
            {STAMP_KINDS.map((k) => (
              <Stamp key={k} kind={k} />
            ))}
          </div>
          <Label>Sizes</Label>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 20,
              alignItems: 'center',
              marginBottom: 32,
            }}
          >
            <Stamp kind="alleged" size="sm" />
            <Stamp kind="alleged" size="md" />
            <Stamp kind="alleged" size="lg" />
          </div>
          <Label>Status change (slam, off with reduced motion)</Label>
          <StampSlamDemo />
        </Section>

        <Section title="Button">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center' }}>
            <Button>Submit report</Button>
            <Button variant="secondary">Watch this page</Button>
            <Button variant="ghost">Before You Pay checklist</Button>
            <Button icon={<Icon name="lookup" size={20} />}>Look it up</Button>
            <Button disabled>Disabled</Button>
            <Button loading>Submit</Button>
          </div>
        </Section>

        <Section title="Receipt card">
          <div style={grid}>
            <div>
              <Label>Default</Label>
              <ReceiptCard
                meta="Sep 2026 · Atlanta"
                aside="$50 to $100"
                footer="Deposit taken / no-show"
              >
                <p>
                  &ldquo;Sent the $75 deposit Friday.{' '}
                  <MarkerHighlight>Day of, the page blocked me</MarkerHighlight> and the booking
                  link was gone.&rdquo;
                </p>
              </ReceiptCard>
            </div>
            <div>
              <Label>Minimal</Label>
              <ReceiptCard>
                <p>Paid through Cash App. No appointment, no refund, no reply.</p>
              </ReceiptCard>
            </div>
            <div>
              <Label>Loading</Label>
              <ReceiptSkeleton />
            </div>
          </div>
        </Section>

        <Section title="Case envelope">
          <div style={grid}>
            <div>
              <Label>Published case</Label>
              <CaseEnvelope
                caseNumber="RMMM-26-0412"
                title="The $75 booking that never happened"
                meta="Deposit taken / no-show · Atlanta, GA"
                status="contacted"
                href="#"
              />
            </div>
            <div>
              <Label>Resolved</Label>
              <CaseEnvelope
                caseNumber="RMMM-26-0388"
                title="Refund came through"
                meta="Not delivered · Decatur, GA"
                status="resolved_refunded"
              />
            </div>
            <div>
              <Label>Empty state</Label>
              <EmptyCaseEnvelope />
            </div>
          </div>
        </Section>

        <Section title="Evidence summary">
          <div style={grid}>
            <div>
              <Label>Ready</Label>
              <EvidenceSummary
                state="ready"
                name="Nailz by Tee"
                subtitle="Atlanta, GA · demo data"
                data={demoSummary}
                reportedFor="deposit taken, no-show"
                now={NOW}
              />
            </div>
            <div>
              <Label>Loading</Label>
              <EvidenceSummary state="loading" />
            </div>
            <div style={{ display: 'grid', gap: 24 }}>
              <div>
                <Label>Under review</Label>
                <EvidenceSummary state="under_review" />
              </div>
              <div>
                <Label>No results</Label>
                <EvidenceSummary state="no_results" />
              </div>
            </div>
          </div>
        </Section>

        <Section title="Why matched and linked pages">
          <div style={grid}>
            <WhyMatched
              reasons={[
                { reason: 'shared_cashtag', strongest: true },
                { reason: 'shared_phone' },
                { reason: 'same_flyer_phash' },
                { reason: 'name_similarity', detail: '"nailz"' },
              ]}
            />
            <LinkedPages
              pages={[
                { label: '@nailz2.atl', reason: 'shared_cashtag', href: '#' },
                { label: '@teeslaced_', reason: 'same_flyer_phash' },
              ]}
            />
            <LinkedPages pages={[]} />
          </div>
        </Section>

        <Section title="Skeletons">
          <div style={grid}>
            <div style={{ display: 'grid', gap: 8 }}>
              <Label>Lines</Label>
              <SkeletonLine width="40%" />
              <SkeletonLine />
              <SkeletonLine width="70%" />
            </div>
            <div>
              <Label>Block</Label>
              <SkeletonBlock height={120} />
            </div>
            <div>
              <Label>Card</Label>
              <CardSkeleton />
            </div>
            <div>
              <Label>Receipt</Label>
              <ReceiptSkeleton lines={4} />
            </div>
          </div>
        </Section>
      </ThemeFrame>
    </div>
  );
}
