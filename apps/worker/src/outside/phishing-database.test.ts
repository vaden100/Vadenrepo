import { describe, expect, it, vi } from 'vitest';
import { importPhishingDatabase } from './import.js';
import { parseHosts } from './phishing-database.js';

describe('Phishing.Database list', () => {
  it('keeps well-formed hosts only, lowercased and deduplicated', () => {
    const text =
      '# comment\nLogin-CashApp-Verify.demo\nlogin-cashapp-verify.demo.\n\nnot a host\n-bad-.demo\nhttp://x.demo/path\n1.2.3.4\nok.example.co.uk\n';
    expect(parseHosts(text)).toEqual(['login-cashapp-verify.demo', 'ok.example.co.uk']);
  });

  it('refuses to wipe the data when the download looks empty', async () => {
    const db = { upsert: vi.fn(), rpc: vi.fn() };
    const fetchImpl = vi.fn(async () => new Response('a.demo\n')) as unknown as typeof fetch;
    await expect(importPhishingDatabase(db as never, { fetchImpl })).rejects.toThrow(/looks empty/);
    expect(db.upsert).not.toHaveBeenCalled();
  });

  it('upserts in batches, then removes hosts that left the list', async () => {
    const db = { upsert: vi.fn(async () => []), rpc: vi.fn(async () => 3) };
    const list = Array.from({ length: 12_001 }, (_, i) => `host${i}.demo`).join('\n');
    const fetchImpl = vi.fn(async () => new Response(list)) as unknown as typeof fetch;
    expect(await importPhishingDatabase(db as never, { fetchImpl })).toEqual({
      hosts: 12_001,
      removed: 3,
    });
    expect(db.upsert).toHaveBeenCalledTimes(3);
    expect(db.rpc).toHaveBeenCalledWith(
      'finish_outside_import',
      expect.objectContaining({ src: 'phishing_database' }),
    );
  });
});
