import type { Metadata, Viewport } from 'next';
import { cssVariables } from '@rmmm/tokens';
import { RoughFilterDefs } from '@rmmm/ui/web';
import { SiteFooter } from '@/components/SiteFooter';
import { SiteHeader } from '@/components/SiteHeader';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'RUN ME MY MONEY', template: '%s | RUN ME MY MONEY' },
  description:
    'Look up a business before you pay a deposit, share your story with receipts, and follow the cases from the series.',
  icons: { icon: '/brand/app-icon.svg' },
};

export const viewport: Viewport = {
  themeColor: '#111111',
  colorScheme: 'dark light',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <style id="rmmm-tokens" dangerouslySetInnerHTML={{ __html: cssVariables() }} />
      </head>
      <body>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <RoughFilterDefs />
        <SiteHeader />
        <main id="main">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
