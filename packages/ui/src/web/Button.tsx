import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react';
import { Icon } from './Icon';

export type ButtonVariant =
  'primary' | 'secondary' | 'tertiary' | 'ghost' | 'text' | 'danger' | 'icon';

/** Class list for anything that should look like a button (e.g. a Next.js <Link>). */
export function buttonClass(
  variant: ButtonVariant = 'primary',
  opts: { block?: boolean; className?: string } = {},
) {
  return ['rmmm-btn', `rmmm-btn--${variant}`, opts.block && 'rmmm-btn--block', opts.className]
    .filter(Boolean)
    .join(' ');
}

export function Spinner({ size = 18 }: { size?: number }) {
  return (
    <svg
      className="rmmm-spinner"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeOpacity="0.3"
      />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="square"
      />
    </svg>
  );
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  /** Busy: keeps width, shows a spinner and `loadingLabel` (announced via aria-busy). */
  loading?: boolean;
  loadingLabel?: ReactNode;
  /** Confirmed by the server: shows a check and `successLabel`. Never set optimistically. */
  success?: boolean;
  successLabel?: ReactNode;
  icon?: ReactNode;
  block?: boolean;
}

export function Button({
  variant = 'primary',
  loading = false,
  loadingLabel,
  success = false,
  successLabel,
  icon,
  block,
  children,
  disabled,
  className,
  type = 'button',
  onClick,
  ...rest
}: ButtonProps) {
  const state = loading ? 'loading' : success ? 'success' : undefined;
  return (
    <button
      type={type}
      className={buttonClass(variant, { block, className })}
      data-state={state}
      disabled={disabled}
      // Busy buttons stay focusable (no focus loss) but ignore clicks: aria-disabled + CSS
      // pointer-events, and forms must also guard against double submission.
      aria-disabled={loading || undefined}
      aria-busy={loading || undefined}
      onClick={loading ? undefined : onClick}
      {...rest}
    >
      {loading ? <Spinner /> : success ? <Icon name="verified" size={20} /> : icon}
      {(children !== undefined || loading || success) && (
        <span>
          {loading ? (loadingLabel ?? children) : success ? (successLabel ?? children) : children}
        </span>
      )}
    </button>
  );
}

export interface ButtonLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  variant?: ButtonVariant;
  block?: boolean;
  icon?: ReactNode;
}

/** Navigation that looks like a button. Use <Button> for actions, this for links (WBS 131). */
export function ButtonLink({
  variant = 'primary',
  block,
  icon,
  className,
  children,
  ...rest
}: ButtonLinkProps) {
  return (
    <a className={buttonClass(variant, { block, className })} {...rest}>
      {icon}
      <span>{children}</span>
    </a>
  );
}
