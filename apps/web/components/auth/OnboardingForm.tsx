'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { isAdult, TERMS_VERSION } from '@rmmm/api';
import { Button, Checkbox, EmptyState, en, StatusMessage, TextField } from '@rmmm/ui/web';
import { supabaseBrowser } from '@/lib/supabase/browser';

/** SPEC 12 age gate + terms. Neutral date entry; the date itself is never stored. */
export function OnboardingForm({ next = '/account' }: { next?: string }) {
  const router = useRouter();
  const [birth, setBirth] = useState('');
  const [terms, setTerms] = useState(false);
  const [busy, setBusy] = useState(false);
  const [dateError, setDateError] = useState<string | null>(null);
  const [termsError, setTermsError] = useState<string | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const [under18, setUnder18] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    const adult = isAdult(birth);
    setDateError(adult === null ? en.onboarding.invalidDate : null);
    setTermsError(terms ? null : en.onboarding.termsRequired);
    setFailure(null);
    if (adult === null || !terms) return;
    const supabase = supabaseBrowser();
    if (!supabase) return setFailure(en.auth.notConfigured);

    setBusy(true);
    const { data: ok, error: ageErr } = await supabase.rpc('confirm_age', { birth_date: birth });
    if (ageErr) {
      setBusy(false);
      return setFailure(en.common.tryAgain);
    }
    if (ok === false || adult === false) {
      await supabase.auth.signOut();
      setBusy(false);
      return setUnder18(true);
    }
    const { error: termsErr } = await supabase.rpc('accept_terms', { version: TERMS_VERSION });
    setBusy(false);
    if (termsErr) return setFailure(en.common.tryAgain);
    router.replace(next);
    router.refresh();
  }

  if (under18) {
    return (
      <EmptyState
        title={en.onboarding.under18Title}
        action={<Link href="/resources">{en.nav.resources}</Link>}
      >
        <p>{en.onboarding.under18Body}</p>
      </EmptyState>
    );
  }

  return (
    <form className="stack form" onSubmit={submit} noValidate>
      {failure && <StatusMessage tone="error" title={failure} />}
      <TextField
        type="date"
        label={en.onboarding.birthDateLabel}
        description={en.onboarding.birthDateHint}
        autoComplete="bday"
        value={birth}
        onChange={(e) => setBirth(e.target.value)}
        error={dateError}
        required
      />
      <Checkbox
        label={en.onboarding.termsLabel}
        description={<Link href="/legal/terms">{en.onboarding.termsLinks}</Link>}
        checked={terms}
        onChange={(e) => setTerms(e.target.checked)}
        error={termsError}
      />
      <div>
        <Button type="submit" loading={busy} loadingLabel={en.forms.sending}>
          {en.onboarding.submit}
        </Button>
      </div>
    </form>
  );
}
