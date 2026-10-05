import { en } from './strings.en';

export function formatMoney(cents: number, currency = 'USD', locale = 'en-US'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100);
}

const DAY = 86_400_000;

/** Coarse, calm relative time ("3 days ago"). Never more precise than a day. */
export function timeAgo(date: Date, now: Date = new Date()): string {
  const days = Math.floor((now.getTime() - date.getTime()) / DAY);
  if (days <= 0) return en.time.today;
  if (days === 1) return en.time.yesterday;
  if (days < 14) return en.time.daysAgo(days);
  if (days < 60) return en.time.weeksAgo(Math.floor(days / 7));
  if (days < 365) return en.time.monthsAgo(Math.floor(days / 30));
  return en.time.yearsAgo(Math.floor(days / 365));
}

export interface EvidenceSummaryData {
  reportCount: number;
  reviewedCount: number;
  amountLostCents: number;
  currency?: string;
  lastReportAt: Date;
  linkedPageCount: number;
}

/** Ordered evidence facts, e.g. "Reported 6 times", "4 reviewed", "$1,240 reported lost". */
export function evidenceFacts(d: EvidenceSummaryData, now?: Date): string[] {
  const facts = [en.evidence.reported(d.reportCount), en.evidence.reviewed(d.reviewedCount)];
  if (d.amountLostCents > 0)
    facts.push(en.evidence.lost(formatMoney(d.amountLostCents, d.currency)));
  facts.push(en.evidence.lastReport(timeAgo(d.lastReportAt, now)));
  if (d.linkedPageCount > 0) facts.push(en.evidence.linkedPages(d.linkedPageCount));
  return facts;
}

export const FACT_SEPARATOR = ' · ';
