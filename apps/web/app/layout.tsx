import type { Metadata, Viewport } from 'next';
import { cookies, headers } from 'next/headers';
import { cssVariables } from '@rmmm/tokens';
import { en, RoughFilterDefs, ToastProvider } from '@rmmm/ui/web';
import { AnalyticsLoader } from '@/components/shell/AnalyticsLoader';
import { CookieBanner } from '@/components/shell/CookieBanner';
import { JsonLd } from '@/components/shell/JsonLd';
import { OfflineBanner } from '@/components/shell/OfflineBanner';
import { SiteFooter } from '@/components/shell/SiteFooter';
import { SiteHeader } from '@/components/shell/SiteHeader';
import { business } from '@/lib/business';
import {
  analyticsConfigured,
  analyticsDomain,
  analyticsHost,
  CONSENT_COOKIE,
  parseConsent,
} from '@/lib/consent';
import { getSession } from '@/lib/session';
import { siteUrl } from '@/lib/site';
import { parseTheme, THEME_COOKIE } from '@/lib/theme';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: `${en.site.name}: ${en.site.tagline}`, template: `%s | ${en.site.name}` },
  description: en.site.description,
  applicationName: en.site.name,
  icons: { icon: '/brand/app-icon.svg' },
  formatDetection: { telephone: false, email: false, address: false },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#111111' },
    { media: '(prefers-color-scheme: light)', color: '#F2EEE6' },
  ],
  colorScheme: 'dark light',
};

const tokens = cssVariables();

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [h, jar, session] = await Promise.all([headers(), cookies(), getSession()]);
  const nonce = h.get('x-nonce') ?? undefined;
  const theme = parseTheme(jar.get(THEME_COOKIE)?.value);
  const consent = parseConsent(jar.get(CONSENT_COOKIE)?.value);

  return (
    // data-theme is set on the server from the cookie: the first paint is already correct.
    <html lang="en" data-theme={theme === 'system' ? undefined : theme} suppressHydrationWarning>
      <head>
        <style id="rmmm-tokens" nonce={nonce} dangerouslySetInnerHTML={{ __html: tokens }} />
      </head>
      <body>
        <a className="skip-link" href="#main">
          {en.site.skipToContent}
        </a>
        <div id="top-sentinel" aria-hidden="true" />
        <RoughFilterDefs />
        <ToastProvider>
          <SiteHeader theme={theme} signedIn={!!session} />
          <OfflineBanner />
          <main id="main" tabIndex={-1}>
            {children}
          </main>
          <SiteFooter />
          {analyticsConfigured && !consent && <CookieBanner />}
        </ToastProvider>
        {analyticsConfigured && consent?.analytics && (
          <AnalyticsLoader nonce={nonce} host={analyticsHost} domain={analyticsDomain} />
        )}
        <JsonLd
          nonce={nonce}
          data={{
            '@context': 'https://schema.org',
            '@graph': [
              {
                '@type': 'Organization',
                '@id': `${siteUrl}/#org`,
                name: 'Vaden World',
                legalName: business.legalName,
                url: siteUrl,
              },
              {
                '@type': 'WebSite',
                '@id': `${siteUrl}/#site`,
                name: en.site.name,
                url: siteUrl,
                publisher: { '@id': `${siteUrl}/#org` },
              },
            ],
          }}
        />
      </body>
    </html>
  );
}
