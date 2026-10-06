/**
 * Resource guides (SPEC 4.5). General information, not legal advice. Every external link
 * points to an official source. Payment-app rules change: each guide shows its review date
 * and sends people to the official page for the current process.
 */
export const RESOURCES_REVIEWED = '2026-10-05';

export interface LinkRef {
  label: string;
  href: string;
}

export interface Guide {
  slug: string;
  title: string;
  description: string;
  kind: string;
}

export const guides: Guide[] = [
  {
    slug: 'before-you-pay',
    title: 'Before You Pay',
    description: 'Seven checks to run before you send a deposit to a page you found online.',
    kind: 'Checklist',
  },
  {
    slug: 'payment-disputes',
    title: 'Dispute a payment',
    description:
      'What to do in the first hours after paying someone who did not deliver, by payment method.',
    kind: 'Guide',
  },
  {
    slug: 'report-it',
    title: 'Report it to the authorities',
    description: 'Where to file: the FTC, the FBI’s IC3, the CFPB and your state attorney general.',
    kind: 'Guide',
  },
];

export const beforeYouPay: { title: string; body: string }[] = [
  {
    title: 'Pay with buyer protection',
    body: 'A credit card, or a payment marked as goods and services where the app offers it, gives you a way to dispute. Peer-to-peer transfers (Cash App, Zelle, Venmo personal payments) usually cannot be reversed once sent.',
  },
  {
    title: 'Never send “friends and family” to a business',
    body: 'If a business asks you to mark a payment as friends and family, that removes your protection. Treat the request itself as a warning sign.',
  },
  {
    title: 'Ask for terms in writing',
    body: 'Deposit amount, what it covers, the date, and the refund rule if they cancel. A screenshot of a DM counts. If they will not put it in writing, that tells you something.',
  },
  {
    title: 'Check how old the page is',
    body: 'Look at the first posts, the account’s join date and whether comments are turned off. Brand-new pages with a lot of “books open” posts deserve extra care.',
  },
  {
    title: 'Reverse-search their photos',
    body: 'Use a reverse image search on their work photos. Stolen portfolio pictures are common on deposit-only pages.',
  },
  {
    title: 'Look up the payment tag, not just the name',
    body: 'Pages change names. The Cash App tag, Zelle phone or email usually stays the same. Search the tag.',
  },
  {
    title: 'Watch for pressure',
    body: '“Only two spots left”, “price goes up tonight” and “send it now to hold your spot” are pressure, not information.',
  },
];

export interface Rail {
  id: string;
  name: string;
  summary: string;
  steps: string[];
  links: LinkRef[];
}

export const rails: Rail[] = [
  {
    id: 'card',
    name: 'Credit or debit card',
    summary:
      'Cards give you the strongest dispute rights, especially credit cards when goods or services were not delivered.',
    steps: [
      'Call the number on the back of your card or use your bank’s app, and say you want to dispute a charge for services not provided.',
      'Have the date, amount, merchant name and your screenshots ready.',
      'Do it quickly. For credit cards, federal law sets a deadline of 60 days after the statement with the charge was sent to you. Your bank may have its own deadlines for debit cards.',
    ],
    links: [
      {
        label: 'CFPB: How to dispute a credit card charge',
        href: 'https://www.consumerfinance.gov/ask-cfpb/how-do-i-dispute-a-charge-on-my-credit-card-bill-en-61/',
      },
    ],
  },
  {
    id: 'cashapp',
    name: 'Cash App',
    summary:
      'Cash App payments are usually instant and final. You can still report the account and ask for help.',
    steps: [
      'Open the payment in your Cash App activity and use the option to get help or report it.',
      'Ask the recipient for a refund in writing and keep the reply.',
      'Report the $cashtag to Cash App so the account can be reviewed.',
      'If you also paid by linked card, ask your card issuer whether a dispute is possible.',
    ],
    links: [{ label: 'Cash App support', href: 'https://cash.app/help' }],
  },
  {
    id: 'zelle',
    name: 'Zelle',
    summary: 'Zelle runs inside your bank’s app. Your bank is the one to call.',
    steps: [
      'Call your bank right away and tell them you were scammed using Zelle. Ask them to try to stop or recover the payment.',
      'Report the recipient’s email or phone number in your banking app or to Zelle.',
      'Write down the date, amount, the name shown on the payment and the reference number.',
    ],
    links: [{ label: 'Zelle: Report a scam', href: 'https://www.zellepay.com/support' }],
  },
  {
    id: 'venmo',
    name: 'Venmo',
    summary:
      'Payments marked as goods and services may be eligible for purchase protection. Personal payments generally are not.',
    steps: [
      'In the Venmo app, open the payment and contact support from there.',
      'If you marked it as a goods and services payment, ask about purchase protection.',
      'Report the account so it can be reviewed.',
    ],
    links: [{ label: 'Venmo help center', href: 'https://help.venmo.com/' }],
  },
  {
    id: 'paypal',
    name: 'PayPal',
    summary:
      'Goods and services payments may be covered by Purchase Protection. Friends and family payments generally are not.',
    steps: [
      'Open a dispute in the PayPal Resolution Center. PayPal sets the window (currently up to 180 days after the payment).',
      'Upload your screenshots and the seller’s messages.',
      'If the dispute is not resolved, you can escalate it to a claim from the same page.',
    ],
    links: [
      { label: 'PayPal Resolution Center help', href: 'https://www.paypal.com/us/cshelp/personal' },
    ],
  },
  {
    id: 'apple_cash',
    name: 'Apple Cash',
    summary: 'Contact Apple Support from the Wallet app or online, and report the sender.',
    steps: [
      'In Wallet, open your Apple Cash card, find the payment and choose the option to report or contact support.',
      'Keep screenshots of the conversation.',
    ],
    links: [{ label: 'Apple Cash support', href: 'https://support.apple.com/apple-cash' }],
  },
  {
    id: 'crypto',
    name: 'Crypto',
    summary:
      'Crypto transfers are very hard to reverse. Report quickly, and be careful of anyone offering to “recover” your money for a fee.',
    steps: [
      'Save the wallet address, transaction ID and the exchange or app you used.',
      'Report to the exchange you sent from and to the FBI’s IC3.',
      'Do not pay anyone who contacts you promising recovery. Recovery offers are a common follow-up scam.',
    ],
    links: [{ label: 'FBI IC3', href: 'https://www.ic3.gov/' }],
  },
  {
    id: 'cash',
    name: 'Cash',
    summary:
      'Cash cannot be disputed. Your options are a written demand, small claims court or a police report.',
    steps: [
      'Ask for a refund in writing and keep proof you asked.',
      'File a police report if you were deceived.',
      'Small claims court may be an option for the amount you lost.',
    ],
    links: [
      { label: 'USA.gov: Small claims court', href: 'https://www.usa.gov/small-claims-court' },
    ],
  },
];

export const reportPlaces: { name: string; when: string; href: string }[] = [
  {
    name: 'FTC (ReportFraud.ftc.gov)',
    when: 'Any scam, bad business practice or fraud. Reports help law enforcement spot patterns.',
    href: 'https://reportfraud.ftc.gov/',
  },
  {
    name: 'FBI Internet Crime Complaint Center (IC3)',
    when: 'Scams that happened online: social media pages, websites, DMs, crypto.',
    href: 'https://www.ic3.gov/',
  },
  {
    name: 'Consumer Financial Protection Bureau (CFPB)',
    when: 'Problems with your bank, card or payment app, for example if they will not help with a dispute.',
    href: 'https://www.consumerfinance.gov/complaint/',
  },
  {
    name: 'Your state attorney general',
    when: 'Businesses operating in your state. Many AG offices mediate consumer complaints.',
    href: 'https://www.naag.org/find-my-ag/',
  },
];
