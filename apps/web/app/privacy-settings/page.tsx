import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { en } from '@rmmm/ui/web';
import { PageHead } from '@/components/content/PageHead';
import { PrivacySettingsForm } from '@/components/forms/PrivacySettingsForm';
import { analyticsConfigured, CONSENT_COOKIE, CONSENT_VERSION, parseConsent } from '@/lib/consent';
import { getNonce } from '@/lib/nonce';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata({
  title: en.nav.privacySettings,
  description:
    'Choose which optional cookies and analytics you allow. Necessary cookies only by default.',
  path: '/privacy-settings',
  kind: 'Privacy',
  noindex: true,
});

export default async function PrivacySettingsPage() {
  const [jar, nonce] = await Promise.all([cookies(), getNonce()]);
  const consent = parseConsent(jar.get(CONSENT_COOKIE)?.value);
  return (
    <div className="container stack-lg">
      <PageHead
        nonce={nonce}
        crumbs={[{ label: en.nav.home, href: '/' }, { label: en.nav.privacySettings }]}
        title={en.nav.privacySettings}
        lede={
          <>
            Optional categories stay off until you turn them on. Details in the{' '}
            <Link href="/legal/cookies">Cookie Policy</Link>.
          </>
        }
      />
      <div className="prose">
        <PrivacySettingsForm
          initialAnalytics={consent?.analytics ?? false}
          analyticsAvailable={analyticsConfigured}
          version={CONSENT_VERSION}
          decidedAt={consent?.decidedAt ?? null}
        />
      </div>
    </div>
  );
}
