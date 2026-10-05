import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { en } from '../shared/strings.en';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  loading?: boolean;
  icon?: ReactNode;
  block?: boolean;
}

export function Button({
  variant = 'primary',
  loading = false,
  icon,
  block,
  children,
  disabled,
  className,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={['rmmm-btn', `rmmm-btn--${variant}`, block && 'rmmm-btn--block', className]
        .filter(Boolean)
        .join(' ')}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {icon}
      <span>{loading ? en.common.loading : children}</span>
    </button>
  );
}
