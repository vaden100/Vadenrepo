import '@fontsource-variable/atkinson-hyperlegible-next/wght.css';
import '@fontsource-variable/atkinson-hyperlegible-next/wght-italic.css';
import '@fontsource-variable/fraunces/wght.css';
import '@ns1/ui/styles.css';
import './app.css';
import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { strings } from '@ns1/i18n';
import { cssVariables, themes } from '@ns1/tokens';
import { SiteFooter } from '@/components/SiteFooter';
import { SiteHeader } from '@/components/SiteHeader';
import { getNonce } from '@/lib/nonce';
import { READING_INIT_SCRIPT } from '@/lib/reading';
import { SITE_URL } from '@/lib/site';

const t = strings();

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: t.site.name, template: `%s | ${t.site.name}` },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: themes.light.background },
    { media: '(prefers-color-scheme: dark)', color: themes.dark.background },
  ],
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const nonce = await getNonce();
  return (
    <html lang={t.meta.lang} suppressHydrationWarning>
      <head>
        <script nonce={nonce} dangerouslySetInnerHTML={{ __html: READING_INIT_SCRIPT }} />
        <style nonce={nonce} dangerouslySetInnerHTML={{ __html: cssVariables() }} />
      </head>
      <body>
        <a href="#main" className="skip-link">
          {t.nav.skip}
        </a>
        <SiteHeader />
        <main id="main" tabIndex={-1} className="site-main container">
          {children}
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}
