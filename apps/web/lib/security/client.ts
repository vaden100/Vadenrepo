/** Who is calling: client IP and a hashed device id (SPEC 11). */

/** First address in the configured header. Returns null when missing or malformed. */
export function clientIp(headers: Headers, headerName = 'x-forwarded-for'): string | null {
  const raw = headers.get(headerName)?.split(',')[0]?.trim();
  if (!raw) return null;
  // Strip an IPv4 port ("1.2.3.4:5678") and IPv6 brackets ("[::1]:443").
  const v = raw.startsWith('[')
    ? raw.slice(1, raw.indexOf(']'))
    : raw.replace(/^(\d+\.\d+\.\d+\.\d+):\d+$/, '$1');
  return isIp(v) ? v : null;
}

const IPV4 = /^(25[0-5]|2[0-4]\d|1?\d?\d)(\.(25[0-5]|2[0-4]\d|1?\d?\d)){3}$/;
export function isIp(v: string): boolean {
  if (IPV4.test(v)) return true;
  // Loose IPv6 check; Postgres does the strict parse.
  return /^[0-9a-f:.]+$/i.test(v) && v.includes(':') && v.length <= 45;
}

/** Web: random id in an httpOnly cookie. App: hashed install id in this header. */
export const DEVICE_COOKIE = 'rmmm_did';
export const DEVICE_HEADER = 'x-rmmm-device';

export async function sha256Hex(input: string): Promise<string> {
  const bytes = new Uint8Array(
    await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input)),
  );
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

/** The value stored in device_bans.device_hash and reports.submitted_device. */
export async function deviceHash(
  source: 'web' | 'app',
  id: string | null | undefined,
): Promise<string | null> {
  if (!id || id.length > 200) return null;
  return sha256Hex(`${source}:${id}`);
}
