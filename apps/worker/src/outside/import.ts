import type { Db } from '../db.js';
import { log } from '../log.js';
import { LIST_URL, parseHosts, SOURCE } from './phishing-database.js';

const BATCH = 5000;

/**
 * Full refresh of an outside list: upsert every current host with this run's timestamp, then
 * finish_outside_import() removes hosts that are no longer listed. A failed run leaves the
 * previous data in place.
 */
export async function importPhishingDatabase(
  db: Db,
  opts: { limit?: number; fetchImpl?: typeof fetch } = {},
) {
  const started = new Date().toISOString();
  const res = await (opts.fetchImpl ?? fetch)(LIST_URL, { signal: AbortSignal.timeout(120_000) });
  if (!res.ok) throw new Error(`list download failed: ${res.status}`);
  let hosts = parseHosts(await res.text());
  if (opts.limit) hosts = hosts.slice(0, opts.limit);
  if (hosts.length < 100 && !opts.limit)
    throw new Error(`list looks empty (${hosts.length} hosts); keeping the old data`);
  for (let i = 0; i < hosts.length; i += BATCH) {
    await db.upsert(
      'outside_records',
      hosts
        .slice(i, i + BATCH)
        .map((norm) => ({ source: SOURCE, type: 'domain', norm, seen_at: started })),
      'source,type,norm',
    );
  }
  const removed = await db.rpc<number>('finish_outside_import', {
    src: SOURCE,
    run_started: started,
  });
  log('info', 'outside.imported', { source: SOURCE, hosts: hosts.length, removed });
  return { hosts: hosts.length, removed };
}
