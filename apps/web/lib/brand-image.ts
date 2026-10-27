import { logos, shapes, type BrandSvg } from '@ns1/ui';

/** A brand SVG as a data URI in one color, for server-rendered images (OG, touch icon). */
export function svgDataUri(asset: BrandSvg, color: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${asset.viewBox}" color="${color}">${asset.body}</svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg.replaceAll('currentColor', color)).toString('base64')}`;
}

export function aspect(asset: BrandSvg): number {
  const [, , w, h] = asset.viewBox.split(/\s+/).map(Number);
  return (w ?? 1) / (h ?? 1);
}

export const brandImages = { logos, shapes };
