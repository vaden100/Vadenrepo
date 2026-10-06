import Link from 'next/link';
import { en } from '@rmmm/ui';

/**
 * The wordmark is outlined artwork (SPEC 13), never live text. Two files, one per theme,
 * switched by CSS (no filters, no flash). States: default, compact (after scrolling, via
 * the header's data-compact), pressed (:active nudge), keyboard focus ring. No load animation.
 */
export function Logo({ current }: { current: boolean }) {
  return (
    <Link
      href="/"
      className="site-logo"
      aria-label={en.site.home}
      aria-current={current ? 'page' : undefined}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- fixed-size SVG wordmark */}
      <img
        src="/brand/wordmark-transparent.svg"
        alt=""
        width={120}
        height={56}
        className="site-logo__img site-logo__img--dark"
      />
      {/* eslint-disable-next-line @next/next/no-img-element -- fixed-size SVG wordmark */}
      <img
        src="/brand/wordmark-light.svg"
        alt=""
        width={120}
        height={56}
        className="site-logo__img site-logo__img--light"
      />
    </Link>
  );
}
