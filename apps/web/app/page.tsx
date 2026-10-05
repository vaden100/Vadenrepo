import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="container" style={{ paddingTop: 48, display: 'grid', gap: 24 }}>
      <h1 className="display">
        Before you pay,
        <br />
        look them up.
      </h1>
      <p className="lede">
        Search a business name, @handle, $cashtag, phone, email or website. Share your story with
        receipts. Follow the cases from the series.
      </p>
      <p className="mono" style={{ color: 'var(--color-text-muted)' }}>
        Lookup, reports, cases and episodes are being built. See the{' '}
        <Link href="/styleguide">style guide</Link>.
      </p>
    </div>
  );
}
