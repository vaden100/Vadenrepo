import { CardSkeleton, en, ReceiptSkeleton, SkeletonLine } from '@rmmm/ui/web';

/**
 * Loading state for account pages (WBS 16). Kept off the root on purpose: a root Suspense
 * boundary streams a 200 before notFound() runs, which turns real 404s into soft 404s.
 */
export default function Loading() {
  return (
    <div className="container stack-lg" aria-busy="true">
      <p className="rmmm-visually-hidden" role="status">
        {en.common.loading}
      </p>
      <div className="stack" style={{ paddingTop: 40, maxWidth: 640 }}>
        <SkeletonLine width="20%" />
        <SkeletonLine width="70%" />
        <SkeletonLine width="55%" />
      </div>
      <div className="card-list">
        <CardSkeleton />
        <CardSkeleton />
        <ReceiptSkeleton />
      </div>
    </div>
  );
}
