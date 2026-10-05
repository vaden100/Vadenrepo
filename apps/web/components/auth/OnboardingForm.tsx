'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { isAdult, TERMS_VERSION } from '@rmmm/api';
import { Button, en } from '@rmmm/ui/web';
import { supabaseBrowser } from '@/lib/supabase/browser';
import s from './forms.module.css';

/** SPEC 12 age gate + terms. Neutral date entry; the date itself is never stored. */
export function OnboardingForm({ next = '/account' }: { next?: string }) {
  const router = useRouter();
  const [birth, setBirth] = useState('');
  const [terms, setTerms] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [under18, setUnder18] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const adult = isAdult(birth);
    if (adult === null) return setError(en.onboarding.invalidDate);
    if (!terms) return setError(en.onboarding.termsRequired);
    const supabase = supabaseBrowser();
    if (!supabase) return setError(en.auth.notConfigured);

    setBusy(true);
    const { data: ok, error: ageErr } = await supabase.rpc('confirm_age', { birth_date: birth });
    if (ageErr) {
      setBusy(false);
      return setError(en.common.tryAgain);
    }
    if (ok === false || adult === false) {
      await supabase.auth.signOut();
      setBusy(false);
      return setUnder18(true);
    }
    const { error: termsErr } = await supabase.rpc('accept_terms', { version: TERMS_VERSION });
    setBusy(false);
    if (termsErr) return setError(en.common.tryAgain);
    router.replace(next);
    router.refresh();
  }

  if (under18) {
    return (
      <section role="alert">
        <h2 className="h2">{en.onboarding.under18Title}</h2>
        <p className="lede">{en.onboarding.under18Body}</p>
      </section>
    );
  }

  return (
    <form className={s.form} onSubmit={submit} noValidate>
      <div className={s.field}>
        <label className={s.label} htmlFor="dob">
          {en.onboarding.birthDateLabel}
        </label>
        <input
          id="dob"
          type="date"
          className={s.input}
          value={birth}
          onChange={(e) => setBirth(e.target.value)}
          aria-describedby="dob-hint"
          required
        />
        <p id="dob-hint" className={s.hint}>
          {en.onboarding.birthDateHint}
        </p>
      </div>
      <label className={s.check}>
        <input
          type="checkbox"
          checked={terms}
          onChange={(e) => setTerms(e.target.checked)}
          required
        />
        <span>{en.onboarding.termsLabel}</span>
      </label>
      <p className={s.hint}>
        <Link href="/legal/terms">{en.onboarding.termsLinks}</Link>
      </p>
      {error && (
        <p className={s.error} role="alert">
          {error}
        </p>
      )}
      <Button type="submit" loading={busy}>
        {en.onboarding.submit}
      </Button>
    </form>
  );
}
