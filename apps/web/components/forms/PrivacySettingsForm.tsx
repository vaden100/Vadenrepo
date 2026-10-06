'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Button, en, RadioGroup, StatusMessage } from '@rmmm/ui/web';
import { saveConsent } from '@/components/shell/consent-client';

/** Preference center (WBS 102). Necessary is always on; optional categories default to off. */
export function PrivacySettingsForm({
  initialAnalytics,
  analyticsAvailable,
  version,
  decidedAt,
}: {
  initialAnalytics: boolean;
  analyticsAvailable: boolean;
  version: string;
  decidedAt: string | null;
}) {
  const router = useRouter();
  const [analytics, setAnalytics] = useState(initialAnalytics ? 'on' : 'off');
  const [state, setState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (state === 'saving') return;
    setState('saving');
    const ok = await saveConsent(analytics === 'on');
    setState(ok ? 'saved' : 'error');
    if (ok) router.refresh();
  }

  const onOff = [
    { value: 'off', label: en.cookies.off },
    { value: 'on', label: en.cookies.on },
  ];

  return (
    <form className="stack-lg" onSubmit={submit}>
      <section className="stack" aria-labelledby="cat-necessary">
        <h2 id="cat-necessary" className="h3">
          {en.cookies.necessary}
        </h2>
        <p className="muted">{en.cookies.necessaryBody}</p>
        <p className="mono">{en.cookies.alwaysOn}</p>
      </section>
      <section className="stack" aria-labelledby="cat-preferences">
        <h2 id="cat-preferences" className="h3">
          {en.cookies.preferences}
        </h2>
        <p className="muted">{en.cookies.preferencesBody}</p>
      </section>
      <section className="stack" aria-labelledby="cat-analytics">
        <h2 id="cat-analytics" className="h3">
          {en.cookies.analytics}
        </h2>
        <RadioGroup
          legend={en.cookies.analytics}
          description={
            analyticsAvailable
              ? en.cookies.analyticsBody
              : `${en.cookies.analyticsBody} ${en.cookies.analyticsUnavailable}`
          }
          name="analytics"
          value={analytics}
          onChange={(v) => {
            setAnalytics(v);
            setState('idle');
          }}
          options={onOff}
        />
      </section>
      <section className="stack" aria-labelledby="cat-marketing">
        <h2 id="cat-marketing" className="h3">
          {en.cookies.marketing}
        </h2>
        <p className="muted">{en.cookies.marketingBody}</p>
      </section>
      {state === 'saved' && <StatusMessage tone="success" title={en.cookies.saved} />}
      {state === 'error' && <StatusMessage tone="error" title={en.cookies.saveFailed} />}
      <div className="row">
        <Button type="submit" loading={state === 'saving'} loadingLabel={en.forms.sending}>
          {en.cookies.save}
        </Button>
        <p className="muted mono">
          {en.cookies.version(version)}
          {decidedAt
            ? ` · ${new Date(decidedAt).toLocaleDateString('en-US', { dateStyle: 'medium' })}`
            : ''}
        </p>
      </div>
    </form>
  );
}
