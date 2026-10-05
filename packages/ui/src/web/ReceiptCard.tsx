import { useId, type ReactNode } from 'react';

/**
 * Zigzag bottom edge, same geometry as brand/receipt-edge.svg (16 x 8 tile).
 * Colors come from the card's --receipt-bg / --receipt-line so light mode can outline it.
 */
export function ReceiptEdge({ color }: { color?: string }) {
  const id = `rmmm-zig-${useId().replace(/:/g, '')}`;
  return (
    <svg
      className="rmmm-receipt__edge"
      width="100%"
      height="8"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <pattern id={id} width="16" height="8" patternUnits="userSpaceOnUse">
          <path d="M0 0H16L12 8L8 0L4 8L0 0Z" style={{ fill: color ?? 'var(--receipt-bg)' }} />
          <path d="M0 0L4 8L8 0L12 8L16 0" fill="none" style={{ stroke: 'var(--receipt-line)' }} />
        </pattern>
      </defs>
      <rect width="100%" height="8" fill={`url(#${id})`} />
    </svg>
  );
}

export interface ReceiptCardProps {
  /** Mono header line, e.g. "SEP 2026 · ATLANTA". */
  meta?: ReactNode;
  /** Right side of the header, e.g. amount range. */
  aside?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}

export function ReceiptCard({ meta, aside, children, footer, className }: ReceiptCardProps) {
  return (
    <article className={['rmmm-receipt', className].filter(Boolean).join(' ')}>
      <div className="rmmm-receipt__body">
        {(meta || aside) && (
          <header className="rmmm-receipt__meta">
            <span>{meta}</span>
            {aside && <span>{aside}</span>}
          </header>
        )}
        <div className="rmmm-receipt__content">{children}</div>
        {footer && <footer className="rmmm-receipt__footer">{footer}</footer>}
      </div>
      <ReceiptEdge />
    </article>
  );
}
