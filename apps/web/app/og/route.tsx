import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ImageResponse } from 'next/og';
import type { NextRequest } from 'next/server';

export const runtime = 'nodejs';

const fonts = Promise.all([
  readFile(join(process.cwd(), 'assets/fonts/archivo-latin-900-normal.woff')),
  readFile(join(process.cwd(), 'assets/fonts/ibm-plex-mono-latin-600-normal.woff')),
  readFile(join(process.cwd(), 'public/brand/wordmark-transparent.svg'), 'utf8'),
]);

const clip = (v: string | null, n: number, fallback: string) =>
  (v ?? fallback)
    .replace(/\p{Cc}/gu, ' ')
    .trim()
    .slice(0, n) || fallback;

/**
 * GET /og?title=&kind=  Per-page social card (WBS 27), 1200x630, brand fonts and wordmark.
 * Only renders the text it is given (escaped by Satori); cached by query string.
 */
export async function GET(req: NextRequest) {
  const title = clip(req.nextUrl.searchParams.get('title'), 90, 'RUN ME MY MONEY');
  const kind = clip(req.nextUrl.searchParams.get('kind'), 30, 'RUN ME MY MONEY').toUpperCase();
  const [archivo, mono, wordmark] = await fonts;
  const logo = `data:image/svg+xml;base64,${Buffer.from(wordmark).toString('base64')}`;
  const size = title.length > 60 ? 64 : title.length > 36 ? 80 : 96;

  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        background: '#111111',
        padding: 72,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logo} width={200} height={94} alt="" />
        <div
          style={{
            display: 'flex',
            fontFamily: 'Plex Mono',
            fontSize: 26,
            color: '#F5C518',
            letterSpacing: 4,
          }}
        >
          {kind}
        </div>
      </div>
      <div
        style={{
          display: 'flex',
          fontFamily: 'Archivo',
          fontSize: size,
          lineHeight: 1,
          color: '#F2EEE6',
          textTransform: 'uppercase',
          maxWidth: 1000,
        }}
      >
        {title}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', width: 220, height: 10, background: '#C8202B' }} />
        <div
          style={{
            display: 'flex',
            fontFamily: 'Archivo',
            fontSize: 26,
            color: '#C8202B',
            border: '5px solid #C8202B',
            padding: '10px 18px',
            letterSpacing: 4,
            transform: 'rotate(-4deg)',
          }}
        >
          RECEIPTS OVER RUMORS
        </div>
      </div>
    </div>,
    {
      width: 1200,
      height: 630,
      fonts: [
        { name: 'Archivo', data: archivo, weight: 900, style: 'normal' },
        { name: 'Plex Mono', data: mono, weight: 600, style: 'normal' },
      ],
      headers: {
        'cache-control': 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400',
      },
    },
  );
}
