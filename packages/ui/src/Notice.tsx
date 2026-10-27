import type { ReactNode } from 'react';
import type { IconName } from './generated/brand';
import { Icon } from './Icon';

const icon: Record<'info' | 'error' | 'success', IconName> = {
  info: 'info',
  error: 'alert',
  success: 'check',
};

/** A note in the page. Color is never the only signal: each tone has its own icon. */
export function Notice({
  tone = 'info',
  children,
  live,
}: {
  tone?: 'info' | 'error' | 'success';
  children: ReactNode;
  /** Announce to screen readers when it appears after a user action. */
  live?: boolean;
}) {
  return (
    <div
      className={`notice notice--${tone}`}
      role={live ? (tone === 'error' ? 'alert' : 'status') : undefined}
    >
      <Icon name={icon[tone]} />
      <div>{children}</div>
    </div>
  );
}
