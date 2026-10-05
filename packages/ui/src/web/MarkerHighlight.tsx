import type { ReactNode } from 'react';

/** Yellow marker swipe for the key line in an excerpt. */
export function MarkerHighlight({ children }: { children: ReactNode }) {
  return <mark className="rmmm-marker">{children}</mark>;
}
