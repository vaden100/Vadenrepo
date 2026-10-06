import { headers } from 'next/headers';

/** The per-request CSP nonce set by proxy.ts. */
export async function getNonce(): Promise<string | undefined> {
  return (await headers()).get('x-nonce') ?? undefined;
}
