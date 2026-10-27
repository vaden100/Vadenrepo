import { icons, type IconName } from './generated/brand';
import { BrandSvgElement } from './svg';

/** Icons from brand/icons only (SPEC 7.3). Decorative unless `label` is given. */
export function Icon({
  name,
  label,
  size = 24,
  className,
}: {
  name: IconName;
  label?: string;
  size?: number;
  className?: string;
}) {
  return (
    <BrandSvgElement
      asset={icons[name]}
      label={label}
      className={['icon', className].filter(Boolean).join(' ')}
      width={size}
      height={size}
    />
  );
}
