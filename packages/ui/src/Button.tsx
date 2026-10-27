import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react';
import type { IconName } from './generated/brand';
import { Icon } from './Icon';

export type ButtonVariant = 'primary' | 'secondary' | 'give' | 'help' | 'quiet';

const cls = (variant: ButtonVariant, className?: string) =>
  ['btn', `btn--${variant}`, className].filter(Boolean).join(' ');

interface Common {
  variant?: ButtonVariant;
  icon?: IconName;
  children: ReactNode;
}

/** Labels are verb + object (SPEC 6.2). */
export function Button({
  variant = 'primary',
  icon,
  children,
  className,
  type = 'button',
  ...rest
}: Common & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type={type} className={cls(variant, className)} {...rest}>
      {icon && <Icon name={icon} />}
      <span>{children}</span>
    </button>
  );
}

export function LinkButton({
  variant = 'primary',
  icon,
  children,
  className,
  ...rest
}: Common & AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <a className={cls(variant, className)} {...rest}>
      {icon && <Icon name={icon} />}
      <span>{children}</span>
    </a>
  );
}
