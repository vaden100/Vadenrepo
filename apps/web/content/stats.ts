/**
 * Public, sourced figures (docs/open-data-sources.md). Aggregates only, never about a named
 * business. Re-check against the source when a new FTC Data Book comes out (usually March).
 */
export interface Stat {
  figure: string;
  label: string;
  source: { name: string; href: string };
}

export const STATS_REVIEWED = '2026-10-11';

export const stats: Stat[] = [
  {
    figure: '$15.9 billion',
    label:
      'reported lost to fraud by people in the US in 2025, across about 3 million fraud reports to the FTC.',
    source: {
      name: 'FTC testimony to the Joint Economic Committee, March 25, 2026',
      href: 'https://www.ftc.gov/system/files/ftc_gov/pdf/ftc-testimony-jec-hearing-on-the-rising-scam-economy.pdf',
    },
  },
  {
    figure: 'Bank payments, then crypto',
    label:
      'were how people reported losing the most money in 2025. Payment apps and wire-style transfers rarely come back.',
    source: {
      name: 'FTC testimony to the Joint Economic Committee, March 25, 2026',
      href: 'https://www.ftc.gov/system/files/ftc_gov/pdf/ftc-testimony-jec-hearing-on-the-rising-scam-economy.pdf',
    },
  },
  {
    figure: '38%',
    label:
      'of people who reported fraud in 2024 said they lost money, up from 27% the year before.',
    source: {
      name: 'FTC Consumer Sentinel Network Data Book 2024',
      href: 'https://www.ftc.gov/reports/consumer-sentinel-network-data-book-2024',
    },
  },
  {
    figure: 'Most go unreported',
    label:
      'The FTC estimates the full cost of fraud in 2024 was as high as $195.9 billion once unreported losses are counted.',
    source: {
      name: 'FTC testimony to the Joint Economic Committee, March 25, 2026',
      href: 'https://www.ftc.gov/system/files/ftc_gov/pdf/ftc-testimony-jec-hearing-on-the-rising-scam-economy.pdf',
    },
  },
];
