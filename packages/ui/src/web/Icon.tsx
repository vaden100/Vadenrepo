import { createElement, type SVGProps } from 'react';
import { iconShapes, type IconName } from '../icons/generated';

export interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'name'> {
  name: IconName;
  size?: number;
  /** Accessible label. Omit for decorative icons (hidden from screen readers). */
  label?: string;
}

/** Custom brand icon set (brand/icons). 24 px grid, 2 px stroke, square caps. */
export function Icon({ name, size = 24, label, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="square"
      strokeLinejoin="miter"
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
      {...rest}
    >
      {iconShapes[name].map((s, i) => createElement(s.tag, { key: i, ...s.attrs }))}
    </svg>
  );
}
