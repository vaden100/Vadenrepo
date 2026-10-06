import type { Metadata } from 'next';
import { headers } from 'next/headers';
import Link from 'next/link';
import { buttonClass, en } from '@rmmm/ui/web';
import { explainPath } from '@/lib/notfound';

// Next adds <meta name="robots" content="noindex"> to not-found responses itself.
export const metadata: Metadata = { title: 'Page not found' };

function safeDecode(p: string) {
  try {
    return decodeURIComponent(p);
  } catch {
    return p;
  }
}

/** WBS 44: the broken address becomes a path you can still use. */
export default async function NotFound() {
  const path = safeDecode((await headers()).get('x-pathname') ?? '');
  const { parts, suggestions } = explainPath(path);
  return (
    <div className="container stack-lg notfound">
      <div className="stack">
        <p className="eyebrow">404</p>
        <h1 className="h1">{en.errors.notFoundTitle}</h1>
        <p className="lede">{en.errors.notFoundBody}</p>
      </div>
      {parts.length > 0 && (
        <nav aria-label={en.errors.notFoundPath} className="notfound__path">
          <ol>
            <li>
              <Link href="/">{en.nav.home}</Link>
            </li>
            {parts.map((p) => (
              <li key={p.href}>
                {p.exists ? (
                  <Link href={p.href}>{p.label}</Link>
                ) : (
                  <span className="notfound__missing">
                    <del>{p.label}</del>
                    <span className="rmmm-visually-hidden"> (not found)</span>
                  </span>
                )}
              </li>
            ))}
          </ol>
        </nav>
      )}
      {suggestions.length > 0 && (
        <section className="stack" aria-labelledby="nf-try">
          <h2 id="nf-try" className="h3">
            Did you mean
          </h2>
          <ul className="card-list">
            {suggestions.map((s) => (
              <li key={s.href}>
                <Link href={s.href} className="card-link">
                  <h3>{s.label}</h3>
                  <p className="mono">{s.href}</p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
      <div className="row">
        <Link href="/" className={buttonClass('primary')}>
          {en.errors.goHome}
        </Link>
        <Link href="/lookup" className={buttonClass('secondary')}>
          {en.nav.lookup}
        </Link>
      </div>
    </div>
  );
}
