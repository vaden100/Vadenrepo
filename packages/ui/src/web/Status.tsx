import type { ReactNode } from 'react';
import type { IconName } from '../icons/generated';
import { Icon } from './Icon';

export type Tone = 'info' | 'success' | 'warning' | 'error';

const toneIcon: Record<Tone, IconName> = {
  info: 'notify',
  success: 'verified',
  warning: 'flag',
  error: 'block',
};

/**
 * Inline status message. Tone is shown with an icon AND a text label, never color alone.
 * Errors use role="alert" (assertive); everything else role="status" (polite).
 */
export function StatusMessage({
  tone = 'info',
  title,
  children,
  action,
  className,
}: {
  tone?: Tone;
  title?: ReactNode;
  children?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={['rmmm-status', `rmmm-status--${tone}`, className].filter(Boolean).join(' ')}
      role={tone === 'error' ? 'alert' : 'status'}
    >
      <Icon name={toneIcon[tone]} size={20} className="rmmm-status__icon" />
      <div className="rmmm-status__body">
        {title && <p className="rmmm-status__title">{title}</p>}
        {children && <div className="rmmm-status__text">{children}</div>}
        {action && <div className="rmmm-status__action">{action}</div>}
      </div>
    </div>
  );
}

/** What is missing, why, and what to do next (WBS 18). */
export function EmptyState({
  title,
  children,
  action,
  art,
  headingLevel = 2,
}: {
  title: ReactNode;
  children?: ReactNode;
  action?: ReactNode;
  art?: ReactNode;
  headingLevel?: 2 | 3;
}) {
  const H = headingLevel === 2 ? 'h2' : 'h3';
  return (
    <section className="rmmm-state">
      {art}
      <H className="rmmm-state__title">{title}</H>
      {children && <div className="rmmm-state__body">{children}</div>}
      {action && <div className="rmmm-state__action">{action}</div>}
    </section>
  );
}

export interface Crumb {
  label: string;
  href?: string;
}

export function Breadcrumbs({ items, label = 'Breadcrumb' }: { items: Crumb[]; label?: string }) {
  return (
    <nav aria-label={label} className="rmmm-crumbs">
      <ol>
        {items.map((c, i) => {
          const last = i === items.length - 1;
          return (
            <li key={`${c.label}-${i}`}>
              {last || !c.href ? (
                <span aria-current={last ? 'page' : undefined}>{c.label}</span>
              ) : (
                <a href={c.href}>{c.label}</a>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
