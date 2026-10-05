import { en } from '../shared/strings.en';
import { ReceiptEdge } from './ReceiptCard';

export function SkeletonLine({ width = '100%' }: { width?: string | number }) {
  return (
    <span className="rmmm-skeleton rmmm-skeleton--line" style={{ width }} aria-hidden="true" />
  );
}

export function SkeletonBlock({ height = 96 }: { height?: number }) {
  return (
    <span className="rmmm-skeleton rmmm-skeleton--block" style={{ height }} aria-hidden="true" />
  );
}

/** Receipt-shaped loading placeholder for any async list or card. */
export function ReceiptSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="rmmm-receipt rmmm-receipt--skeleton" role="status" aria-busy="true">
      <span className="rmmm-visually-hidden">{en.common.loading}</span>
      <div className="rmmm-receipt__body">
        <SkeletonLine width="45%" />
        {Array.from({ length: lines }, (_, i) => (
          <SkeletonLine key={i} width={i === lines - 1 ? '60%' : '100%'} />
        ))}
      </div>
      <ReceiptEdge />
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="rmmm-card rmmm-card--skeleton" role="status" aria-busy="true">
      <span className="rmmm-visually-hidden">{en.common.loading}</span>
      <SkeletonLine width="55%" />
      <SkeletonLine width="80%" />
    </div>
  );
}
