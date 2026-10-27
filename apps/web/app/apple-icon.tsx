import { ImageResponse } from 'next/og';
import { themes } from '@ns1/tokens';
import { brandImages, svgDataUri } from '@/lib/brand-image';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

/** Touch icon from brand/logo/mark.svg. */
export default function AppleIcon() {
  const c = themes.light;
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: c.background,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={svgDataUri(brandImages.logos.mark, c.text)} width={150} height={150} alt="" />
    </div>,
    size,
  );
}
