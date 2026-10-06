/** About page content (SPEC 1). Only facts from the spec; no invented numbers or names. */
export const principles: { title: string; body: string }[] = [
  {
    title: 'Receipts over rumors',
    body: 'Nothing about a business goes public until a person on our team has reviewed the evidence: payment screenshots, messages, flyers.',
  },
  {
    title: 'Victims stay protected',
    body: 'No victim name, face, number or payment handle is ever public unless they agree to it in writing.',
  },
  {
    title: '“Alleged” until proven',
    body: 'Public pages use neutral, factual language: what was reported and what we reviewed. The street voice is for the show, not the data.',
  },
  {
    title: 'Businesses get a right of reply',
    body: 'Every public business page has a way to respond and to dispute what is shown. Disputes are reviewed within 7 days.',
  },
];

export const reviewSteps: {
  stamp:
    'reported' | 'verifying' | 'contacted' | 'response_received' | 'resolved_refunded' | 'closed';
  title: string;
  body: string;
}[] = [
  {
    stamp: 'reported',
    title: 'You send your story with receipts',
    body: 'Category, who they are, how much you paid and how, your screenshots, and your story in your own words. You can stay anonymous.',
  },
  {
    stamp: 'verifying',
    title: 'A person checks the evidence',
    body: 'Is there proof of payment? Do the handles, tags and numbers match across screenshots? If something is missing, we ask you. A moderator and an editor both have to approve before any business page goes public.',
  },
  {
    stamp: 'contacted',
    title: 'We reach out to the business',
    body: 'Every featured business is contacted and offered a chance to respond before and after anything is published.',
  },
  {
    stamp: 'response_received',
    title: 'Their side is shown',
    body: 'A response, or the fact that there was none, sits next to the reports. Businesses can dispute anything shown, and disputes are reviewed within 7 days.',
  },
  {
    stamp: 'resolved_refunded',
    title: 'Some cases end in a refund',
    body: 'When a business makes it right, the case says so. Resolved means resolved.',
  },
  {
    stamp: 'closed',
    title: 'Or the case is closed, on the record',
    body: 'Every update has a date, and people following the case are told when anything changes.',
  },
];
