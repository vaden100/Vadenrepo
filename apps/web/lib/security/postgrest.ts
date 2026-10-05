/** Minimal service-role RPC call to Supabase's PostgREST (server only). */
export async function rpc<T>(
  supabaseUrl: string,
  serviceRoleKey: string,
  fn: string,
  args: Record<string, unknown>,
  timeoutMs = 1_500,
): Promise<T> {
  const res = await fetch(`${supabaseUrl.replace(/\/$/, '')}/rest/v1/rpc/${fn}`, {
    method: 'POST',
    headers: {
      apikey: serviceRoleKey,
      authorization: `Bearer ${serviceRoleKey}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify(args),
    cache: 'no-store',
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!res.ok)
    throw new Error(`rpc ${fn} failed: ${res.status} ${await res.text().catch(() => '')}`);
  return (await res.json()) as T;
}
