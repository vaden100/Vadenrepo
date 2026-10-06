import type { Metadata } from 'next';
import { en } from '@rmmm/ui/web';
import { PageHead } from '@/components/content/PageHead';
import { ContactForm } from '@/components/forms/ContactForm';
import { business } from '@/lib/business';
import { getNonce } from '@/lib/nonce';
import { pageMetadata } from '@/lib/seo';
import { getSession } from '@/lib/session';

export const metadata: Metadata = pageMetadata({
  title: en.contact.title,
  description:
    'Contact the RUN ME MY MONEY team about a case, a business response, press, a legal notice or a safety concern.',
  path: '/contact',
  kind: 'Contact',
});

export default async function ContactPage() {
  const [nonce, session] = await Promise.all([getNonce(), getSession()]);
  return (
    <div className="container grid">
      <div className="span-7 stack-lg">
        <PageHead
          nonce={nonce}
          crumbs={[{ label: en.nav.home, href: '/' }, { label: en.contact.title }]}
          title={en.contact.title}
          lede={en.contact.lede}
        />
        <ContactForm defaultEmail={session?.user.email ?? ''} />
      </div>
      <aside className="span-5 stack contact-aside" aria-label="Other ways to reach us">
        <h2 className="h3">Other ways</h2>
        <p className="muted">
          Email: <span className="mono">{business.contactEmail}</span>
        </p>
        <p className="muted">Mail: {business.address}</p>
        <p className="muted">{en.contact.safetyNote}</p>
      </aside>
    </div>
  );
}
