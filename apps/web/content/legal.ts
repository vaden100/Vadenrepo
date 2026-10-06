/**
 * Legal pages (SPEC 12, WBS 32, 33, 43). DRAFTS written from how the product actually works,
 * pending review by counsel. They make no claim of compliance with any specific law.
 */
import { business } from '@/lib/business';

export const LEGAL_VERSION = '2026-10-05';

export interface LegalSection {
  heading: string;
  paragraphs?: string[];
  list?: string[];
  table?: { head: string[]; rows: string[][] };
}

export interface LegalDoc {
  slug: string;
  title: string;
  summary: string;
  sections: LegalSection[];
}

const contact = `${business.legalName}, ${business.address}. Email: ${business.contactEmail}.`;

export const legalDocs: LegalDoc[] = [
  {
    slug: 'privacy',
    title: 'Privacy Policy',
    summary:
      'What we collect, why, how long we keep it, who we share it with, and how to use your rights.',
    sections: [
      {
        heading: 'Who we are',
        paragraphs: [
          `RUN ME MY MONEY is a Vaden World series and website operated by ${business.legalName}. Contact: ${business.contactEmail}.`,
        ],
      },
      {
        heading: 'What we collect',
        table: {
          head: ['Data', 'When', 'Why'],
          rows: [
            [
              'Email or phone number',
              'You sign in or ask us to contact you',
              'Sign-in codes, replies, updates you asked for',
            ],
            [
              'Reports, receipts and stories',
              'You submit a report',
              'Review, the case tracker and the series, as described when you submit',
            ],
            ['Messages you send us', 'You use the contact form', 'To answer you'],
            [
              'Age confirmation (yes or no, not your birth date)',
              'You create an account',
              'Accounts and reports are 18+ only',
            ],
            [
              'Consent choices and their version',
              'You make a choice',
              'To respect it and show what you agreed to',
            ],
            [
              'IP address and a random device id',
              'Every request',
              'Security: blocking abuse, rate limits, bans. Stored hashed where possible.',
            ],
            [
              'Anonymous visit counts',
              'Only if you turn on Analytics',
              'Knowing which pages help people',
            ],
          ],
        },
      },
      {
        heading: 'What we do not collect',
        list: [
          'No contacts, no precise location, no advertising identifiers, no ad SDKs.',
          'We never sell personal data or share it for advertising.',
          'We do not store your birth date; we only record that you confirmed you are 18 or older.',
        ],
      },
      {
        heading: 'What is public',
        paragraphs: [
          'Nothing about you as a reporter is public unless you agree in writing. Public pages show reviewed, redacted excerpts about businesses. Phone numbers, emails and payment tags of businesses are shown masked unless cleared after legal review.',
        ],
      },
      {
        heading: 'Who receives data',
        paragraphs: [
          'Only the service providers we need to run the site, listed on the Subprocessors page, under contracts that limit their use of the data.',
        ],
      },
      {
        heading: 'How long we keep it',
        list: [
          'Account data: until you delete your account.',
          'Reports and evidence: as long as the related case is active, then deleted or anonymized, unless a legal hold requires us to keep them.',
          'Contact messages: up to 2 years.',
          'Security logs: up to 1 year. Audit logs of staff actions: kept for accountability.',
        ],
      },
      {
        heading: 'Your rights',
        paragraphs: [
          'You can ask to see, correct or delete your data. Signed-in users can request deletion from their account page; we complete requests within 30 days and tell you if any record must be kept by law. You can also contact us. Depending on where you live, you may have additional rights.',
        ],
      },
      {
        heading: 'Security',
        paragraphs: [
          'Encryption in transit, access limited by role, two-factor authentication for staff, and an audit log of staff actions.',
        ],
      },
      {
        heading: 'Children',
        paragraphs: [
          'This service is for people 18 and older. We do not knowingly collect data from children under 13.',
        ],
      },
      { heading: 'Contact', paragraphs: [contact] },
    ],
  },
  {
    slug: 'terms',
    title: 'Terms of Service',
    summary:
      'The rules for using the site and app, including what you agree to when you submit a story.',
    sections: [
      {
        heading: 'Who can use this',
        paragraphs: [
          'Anyone can search and read public pages. You must be 18 or older to create an account or submit a report.',
        ],
      },
      {
        heading: 'Truthful reports',
        paragraphs: [
          'When you submit a report you confirm that what you share is true to the best of your knowledge. Do not submit anything you do not have the right to share.',
        ],
      },
      {
        heading: 'Zero tolerance for abuse',
        list: [
          'No harassment, threats, hate, sexual content involving minors, doxxing or personal attacks.',
          'No fake reports, impersonation or attempts to manipulate results.',
          'We remove content that breaks these rules and ban accounts, IP addresses and devices that abuse the service. Reports of objectionable content are acted on within 24 hours.',
        ],
      },
      {
        heading: 'License to use your submission',
        paragraphs: [
          'You keep ownership of what you submit. You give us permission to review it, store it, show redacted excerpts publicly as described when you submit, and use it in the series only with the consent you chose.',
        ],
      },
      {
        heading: 'Right of reply',
        paragraphs: [
          'Businesses can claim their page, post a response and dispute what is shown. Disputes are reviewed within 7 days.',
        ],
      },
      {
        heading: 'Not legal or financial advice',
        paragraphs: [
          'Guides on this site are general information. Talk to a lawyer about your situation.',
        ],
      },
      { heading: 'Contact', paragraphs: [contact] },
    ],
  },
  {
    slug: 'cookies',
    title: 'Cookie Policy',
    summary:
      'Every cookie we set, what it does, and when. Optional categories stay off until you turn them on.',
    sections: [
      {
        heading: 'Cookies we set',
        table: {
          head: ['Cookie', 'Category', 'Purpose', 'Lifetime'],
          rows: [
            [
              'sb-* (Supabase)',
              'Necessary',
              'Keeps you signed in. Only set after you sign in.',
              'Session, refreshed while active',
            ],
            [
              'rmmm_did',
              'Necessary',
              'Random device id used to stop abuse (rate limits, bans). Hashed before we store or compare it.',
              '1 year',
            ],
            [
              'rmmm_consent',
              'Necessary',
              'Remembers your privacy choices and the policy version.',
              '1 year',
            ],
            [
              'rmmm_theme',
              'Preferences',
              'Remembers light or dark mode, only when you pick one.',
              '1 year',
            ],
          ],
        },
      },
      {
        heading: 'Analytics',
        paragraphs: [
          'If enabled on this site and only if you turn it on, we count visits with Plausible, which does not use cookies or collect personal data. Turn it off any time in Privacy settings.',
        ],
      },
      { heading: 'Marketing', paragraphs: ['We do not use marketing or advertising cookies.'] },
      {
        heading: 'Changing your choices',
        paragraphs: [
          'Use Privacy settings in the footer. If this policy changes materially, we ask again.',
        ],
      },
    ],
  },
  {
    slug: 'accessibility',
    title: 'Accessibility statement',
    summary:
      'Our commitment, the standard we target, what we have tested, known limits, and how to tell us about a problem.',
    sections: [
      {
        heading: 'Our commitment',
        paragraphs: [
          'People should be able to check a business and get help no matter how they use the web: phone, keyboard, screen reader, zoom or reduced motion.',
        ],
      },
      { heading: 'Standard', paragraphs: ['We target WCAG 2.2 level AA.'] },
      {
        heading: 'How we test',
        list: [
          'Automated axe checks on every public page, in light and dark mode, on desktop and mobile sizes, in every build.',
          'Keyboard-only tests for navigation, menus, dialogs, the command palette and forms.',
          'Color contrast checks for every text and background pair in our design tokens.',
          'Reduced-motion and 320px-wide layout checks.',
        ],
      },
      {
        heading: 'Known limitations',
        list: [
          'Manual screen reader testing with VoiceOver, NVDA and TalkBack has not been completed for every page yet. It is scheduled before launch.',
          'Episodes and evidence viewing are not live yet; they will ship with captions and alt text requirements.',
        ],
      },
      {
        heading: 'Report a problem',
        paragraphs: [
          `Use the contact form (choose “Something on the site is broken”) or email ${business.contactEmail}. Tell us the page and what happened.`,
        ],
      },
    ],
  },
  {
    slug: 'subprocessors',
    title: 'Subprocessors',
    summary: 'Every third-party service that handles data for us, what it receives and why.',
    sections: [
      {
        heading: 'Current providers',
        table: {
          head: ['Provider', 'What it does', 'Data it receives', 'Cookies'],
          rows: [
            [
              'Supabase',
              'Database, sign-in, file storage',
              'Account data, reports, evidence, messages',
              'Sign-in session cookie',
            ],
            ['Vercel', 'Hosting the website', 'Request data (IP address, pages requested)', 'None'],
            [
              'Cloudflare Turnstile',
              'Bot protection on sign-in and forms (when enabled)',
              'Browser signals for the challenge',
              'Set by Cloudflare during the challenge',
            ],
            [
              'Plausible',
              'Anonymous visit counts (only with your consent)',
              'Page, referrer, browser type; no IP storage',
              'None',
            ],
          ],
        },
      },
      {
        heading: 'Coming later',
        paragraphs: [
          'Media processing, video streaming, email and push providers will be added here before they are used.',
        ],
      },
    ],
  },
  {
    slug: 'dmca',
    title: 'DMCA and takedowns',
    summary: 'How to send a copyright takedown notice, and how to respond to one.',
    sections: [
      {
        heading: 'Designated agent',
        paragraphs: [
          `Pending registration. Until then, send notices to ${business.contactEmail} or use the contact form (choose “Legal notice or takedown”).`,
        ],
      },
      {
        heading: 'What to include',
        list: [
          'The work you believe is infringed and where it appears on our site.',
          'Your contact information.',
          'A statement that you believe in good faith the use is not authorized, and that your notice is accurate, under penalty of perjury.',
          'Your physical or electronic signature.',
        ],
      },
      {
        heading: 'Counter-notice',
        paragraphs: [
          'If your content was removed and you believe it was a mistake, you can send a counter-notice with the same contact details.',
        ],
      },
    ],
  },
  {
    slug: 'refunds',
    title: 'Refund Policy',
    summary:
      'We do not sell anything today. If that changes (merch, memberships, donations), refund terms will be here before checkout opens.',
    sections: [
      {
        heading: 'Current status',
        paragraphs: ['Nothing is for sale on this site. No payments are taken.'],
      },
    ],
  },
];

export const getLegalDoc = (slug: string) => legalDocs.find((d) => d.slug === slug);
