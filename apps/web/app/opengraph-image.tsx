import { ImageResponse } from 'next/og';
import { strings } from '@ns1/i18n';
import { themes } from '@ns1/tokens';
import { aspect, brandImages, svgDataUri } from '@/lib/brand-image';

export const alt = strings().site.name;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

/** Default social card (SPEC 7.6): wordmark and marker line from brand/, token colors. */
export default function OpengraphImage() {
  const c = themes.light;
  const wordmark = brandImages.logos.wordmark;
  const line = brandImages.shapes['marker-line'];
  const w = 960;
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 40,
        background: c.background,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={svgDataUri(wordmark, c.text)}
        width={w}
        height={Math.round(w / aspect(wordmark))}
        alt=""
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={svgDataUri(line, c.accent)}
        width={480}
        height={Math.round(480 / aspect(line))}
        alt=""
      />
    </div>,
    size,
  );
}
