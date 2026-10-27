import type { SVGProps } from 'react';
import type { BrandSvg } from './generated/brand';

const camel = (s: string) => s.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());

/**
 * Renders a build-time brand asset. The markup comes only from brand/ through
 * scripts/sync-brand.mjs, which rejects scripts, external references and foreignObject
 * (SPEC 7.4), so it is safe to inline. Never pass user content here.
 */
export function BrandSvgElement({
  asset,
  label,
  ...rest
}: { asset: BrandSvg; label?: string } & Omit<SVGProps<SVGSVGElement>, 'dangerouslySetInnerHTML'>) {
  const attrs = Object.fromEntries(Object.entries(asset.attrs).map(([k, v]) => [camel(k), v]));
  const a11y = label
    ? { role: 'img', 'aria-label': label }
    : { 'aria-hidden': true as const, focusable: 'false' as const };
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={asset.viewBox}
      {...attrs}
      {...a11y}
      {...rest}
      dangerouslySetInnerHTML={{ __html: asset.body }}
    />
  );
}
