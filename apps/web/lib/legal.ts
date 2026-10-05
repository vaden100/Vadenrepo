/** Legal page stubs (SPEC 12). Every page is a DRAFT until counsel signs off. */
export interface LegalDoc {
  slug: string;
  title: string;
  summary: string;
  sections: string[];
}

export const legalDocs: LegalDoc[] = [
  {
    slug: 'privacy',
    title: 'Privacy Policy',
    summary: 'What we collect, why, how long we keep it, who we share it with, and your rights.',
    sections: [
      'What we collect',
      'Why we collect it',
      'Retention',
      'Sharing and subprocessors',
      'Your rights, including deletion within 30 days',
      'Children (18+ to submit; no data knowingly collected from under-13s)',
      'Contact',
    ],
  },
  {
    slug: 'terms',
    title: 'Terms of Service',
    summary:
      'The rules for using the app and site, including what you agree to when you submit a story.',
    sections: [
      'Zero tolerance for objectionable content and abusive users',
      'Reports must be true to the best of your knowledge',
      'License to use your submission',
      'Right of reply and disputes for businesses',
      'Reporting content and blocking users',
      'Age requirement (18+)',
    ],
  },
  {
    slug: 'refunds',
    title: 'Refund Policy',
    summary: 'Applies if we ever sell anything: merch, memberships or donations.',
    sections: ['What can be refunded', 'How to ask', 'Timing'],
  },
  {
    slug: 'cookies',
    title: 'Cookie Policy',
    summary: 'Which cookies we use. No non-essential cookies are set before you consent.',
    sections: [
      'Essential cookies',
      'Optional analytics (only with consent)',
      'How to change your choice',
    ],
  },
  {
    slug: 'subprocessors',
    title: 'Subprocessors',
    summary: 'Every third-party service that handles data for us, and why.',
    sections: [
      'Hosting and database',
      'Media processing',
      'Email and push',
      'Error monitoring and analytics',
    ],
  },
  {
    slug: 'dmca',
    title: 'DMCA and Takedowns',
    summary: 'How to send a copyright takedown notice to our designated agent.',
    sections: ['Designated agent', 'What to include in a notice', 'Counter-notice'],
  },
  {
    slug: 'accessibility',
    title: 'Accessibility',
    summary: 'Our commitment to WCAG AA, and how to tell us when something does not work for you.',
    sections: ['Standard we follow', 'Known issues', 'Contact'],
  },
];

export const getLegalDoc = (slug: string) => legalDocs.find((d) => d.slug === slug);
