import type { ReactNode } from 'react';

export function VisuallyHidden({ children }: { children: ReactNode }) {
  return <span className="visually-hidden">{children}</span>;
}

/** Loading placeholder for async lists and cards. `label` is announced once. */
export function Skeleton({ lines = 3, label }: { lines?: number; label: string }) {
  return (
    <div className="skeleton" role="status" aria-label={label}>
      {Array.from({ length: lines }, (_, i) => (
        <span key={i} className="skeleton__line" aria-hidden />
      ))}
    </div>
  );
}

/**
 * A fact we do not have yet (SPEC 0.3). Looks unmistakably like a placeholder and is listed in
 * docs/placeholders.md, so nothing fake ships.
 */
export function Placeholder({ name, note }: { name: string; note: string }) {
  return (
    <mark className="placeholder" data-placeholder={name}>
      [{name}: {note}]
    </mark>
  );
}
