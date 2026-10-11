import { useState } from 'react';
import { Linking, View } from 'react-native';
import type { SearchHit, SearchResponse } from '@rmmm/api';
import { space } from '@rmmm/tokens';
import {
  Button,
  en,
  EvidenceSummary,
  LinkedPages,
  WhyMatched,
  type MatchReason,
} from '@rmmm/ui/native';
import { Field, FormError } from '@/components/Field';
import { Screen } from '@/components/Screen';
import { api, WEB_URL } from '@/lib/api';

const t = en.lookup;
const ORDER = [
  'same_cashtag',
  'same_phone',
  'same_payment',
  'same_email',
  'same_website',
  'same_handle',
  'same_name',
  'possible_rebrand',
  'similar_handle',
  'similar_name',
  'story_match',
];
const known = (r: string): r is MatchReason => r in en.whyMatched && r !== 'title';
const chips = (h: SearchHit) =>
  h.reasons
    .filter(known)
    .sort((a, b) => ORDER.indexOf(a) - ORDER.indexOf(b))
    .map((reason, i) => ({ reason, strongest: i === 0 && reason.startsWith('same_') }));

/** SPEC 4.2 on the phone: same search and results as the website (GET /api/search). */
export default function LookupScreen() {
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<SearchResponse | null>(null);
  const [fetchedAt, setFetchedAt] = useState(0);

  async function run() {
    if (!q.trim() || busy) return;
    setBusy(true);
    setError(null);
    const r = await api<SearchResponse>('GET', `/api/search?q=${encodeURIComponent(q.trim())}`);
    setBusy(false);
    if (r.ok) {
      setFetchedAt(Date.now());
      setData(r.data);
    } else setError(r.message || t.unavailable);
  }

  return (
    <Screen title="Before you pay, look them up." lede={t.lede}>
      <Field
        label={t.label}
        value={q}
        onChangeText={setQ}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
        onSubmitEditing={run}
        maxLength={200}
      />
      <Button onPress={run} loading={busy} disabled={!WEB_URL}>
        {en.nav.lookup}
      </Button>
      <FormError>{error ?? (WEB_URL ? null : en.report.receipts.noWebUrl)}</FormError>
      {busy && <EvidenceSummary state="loading" />}
      {data && !busy && data.results.length === 0 && (
        <EvidenceSummary state={data.underReview ? 'under_review' : 'no_results'} />
      )}
      {data &&
        !busy &&
        data.results.map((h) => (
          <View key={h.slug} style={{ gap: space[3] }}>
            <EvidenceSummary
              state="ready"
              name={h.name}
              subtitle={[h.city, h.state].filter(Boolean).join(', ') || undefined}
              data={{
                reportCount: h.summary.reports,
                reviewedCount: h.summary.reviewed,
                amountLostCents: h.summary.amountCents,
                lastReportAt: new Date(h.summary.lastReportAt ?? fetchedAt),
                linkedPageCount: h.links.length,
              }}
            />
            <WhyMatched reasons={chips(h)} />
            {h.links.length > 0 && (
              <LinkedPages
                pages={h.links.map((l) => ({
                  label: l.name,
                  reason: known(l.reason) ? l.reason : 'staff_manual',
                }))}
              />
            )}
            <Button
              variant="ghost"
              onPress={() => Linking.openURL(`${WEB_URL}/entities/${h.slug}`)}
            >
              {t.openPage(h.name)}
            </Button>
          </View>
        ))}
      {data && !busy && data.results.length > 0 && data.underReview && (
        <EvidenceSummary state="under_review" />
      )}
    </Screen>
  );
}
