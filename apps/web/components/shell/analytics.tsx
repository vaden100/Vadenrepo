'use client';

/**
 * Product analytics (WBS 41, 100). Privacy-first: Plausible (cookieless, no personal data),
 * loaded only when configured AND the person turned Analytics on. Events carry no personal
 * data: never pass names, emails, phone numbers, handles or free text as props.
 */
export type AnalyticsEvent =
  | 'cta_clicked'
  | 'form_started'
  | 'form_submitted'
  | 'form_failed'
  | 'navigation_opened'
  | 'navigation_closed'
  | 'search_started'
  | 'search_completed'
  | 'palette_opened'
  | 'theme_changed'
  | 'consent_saved';

type Props = Record<string, string | number | boolean>;

declare global {
  interface Window {
    plausible?: (event: string, opts?: { props?: Props }) => void;
  }
}

export function track(event: AnalyticsEvent, props?: Props) {
  if (typeof window === 'undefined' || !window.plausible) return;
  try {
    window.plausible(event, props ? { props } : undefined);
  } catch {
    // Analytics must never break the page.
  }
}
