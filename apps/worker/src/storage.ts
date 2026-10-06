import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { serviceRoleKey, type WorkerConfig } from './config.js';

const BUCKET = 'evidence';

/** Reads and overwrites evidence objects. Same layout as the web app's storage driver. */
export function createStorage(config: WorkerConfig) {
  const root = path.resolve(config.storageLocalDir, BUCKET);
  const local = (key: string) => {
    const file = path.resolve(root, key);
    if (!file.startsWith(root + path.sep)) throw new Error('bad key');
    return file;
  };
  const base = `${(config.supabaseUrl ?? '').replace(/\/$/, '')}/storage/v1/object`;
  const headers = () => ({ apikey: serviceRoleKey(), authorization: `Bearer ${serviceRoleKey()}` });

  return {
    async get(key: string): Promise<Buffer> {
      if (config.storageDriver === 'local') return readFile(local(key));
      const res = await fetch(`${base}/authenticated/${BUCKET}/${key}`, {
        headers: headers(),
        signal: AbortSignal.timeout(120_000),
      });
      if (!res.ok) throw new Error(`storage get ${res.status}`);
      return Buffer.from(await res.arrayBuffer());
    },
    async put(key: string, data: Uint8Array, mime: string): Promise<void> {
      if (config.storageDriver === 'local') {
        const file = local(key);
        await mkdir(path.dirname(file), { recursive: true });
        await writeFile(file, data);
        return;
      }
      const res = await fetch(`${base}/${BUCKET}/${key}`, {
        method: 'PUT',
        headers: { ...headers(), 'content-type': mime, 'x-upsert': 'true' },
        body: data,
        signal: AbortSignal.timeout(120_000),
      });
      if (!res.ok) throw new Error(`storage put ${res.status}`);
    },
    async remove(key: string): Promise<void> {
      if (config.storageDriver === 'local') {
        const { rm } = await import('node:fs/promises');
        await rm(local(key), { force: true });
        return;
      }
      await fetch(`${base}/${BUCKET}`, {
        method: 'DELETE',
        headers: { ...headers(), 'content-type': 'application/json' },
        body: JSON.stringify({ prefixes: [key] }),
        signal: AbortSignal.timeout(30_000),
      });
    },
  };
}
export type Storage = ReturnType<typeof createStorage>;
