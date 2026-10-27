import { logos } from './generated/brand';
import { BrandSvgElement } from './svg';

/**
 * Every logo use goes through here (SPEC 6.6). The files live in brand/logo/; swap them and
 * run `pnpm brand:sync` (docs/logo-swap.md). The wordmark is an image, never live text.
 */
export function Logo({
  variant = 'wordmark',
  label,
  className,
}: {
  variant?: 'wordmark' | 'mark';
  /** Accessible name. Omit only when the logo sits next to the same text. */
  label?: string;
  className?: string;
}) {
  return (
    <BrandSvgElement
      asset={logos[variant]}
      label={label}
      className={['logo', `logo--${variant}`, className].filter(Boolean).join(' ')}
    />
  );
}
