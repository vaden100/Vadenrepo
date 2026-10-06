/**
 * Media pipeline worker (SPEC 6): polls the job queue (claim_media_jobs, SKIP LOCKED so
 * several workers can run), cleans each file and records the results. Health check at
 * /healthz for Fly.io / Render. `--once` drains the queue and exits (tests, cron).
 */
import { createServer } from 'node:http';
import { loadConfig } from './config.js';
import { createDb } from './db.js';
import { log } from './log.js';
import { processJob, type MediaJob } from './pipeline.js';
import { createStorage } from './storage.js';

const config = loadConfig();
const once = process.argv.includes('--once');
const deps = { config, db: createDb(config), storage: createStorage(config) };
let stopping = false;
let lastPoll = 0;

async function drain(): Promise<number> {
  let total = 0;
  for (;;) {
    const jobs = await deps.db.rpc<MediaJob[]>('claim_media_jobs', { batch: config.batch });
    lastPoll = Date.now();
    if (!jobs.length) return total;
    for (const job of jobs) await processJob(job, deps);
    total += jobs.length;
    if (stopping) return total;
  }
}

async function loop() {
  while (!stopping) {
    try {
      await drain();
    } catch (err) {
      log('error', 'worker.poll_failed', { err: err instanceof Error ? err.message : String(err) });
    }
    await new Promise((r) => setTimeout(r, config.pollMs));
  }
}

if (!config.supabaseUrl || !config.hasServiceRole) {
  log('error', 'worker.unconfigured', { hint: 'set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY' });
}

if (once) {
  drain()
    .then((n) => {
      log('info', 'worker.drained', { jobs: n });
      process.exit(0);
    })
    .catch((err: unknown) => {
      log('error', 'worker.failed', { err: err instanceof Error ? err.message : String(err) });
      process.exit(1);
    });
} else {
  const server = createServer((req, res) => {
    if (req.url === '/healthz') {
      const healthy = Date.now() - lastPoll < Math.max(60_000, config.pollMs * 10);
      res.writeHead(healthy ? 200 : 503, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ ok: healthy }));
      return;
    }
    res.writeHead(404).end();
  });
  server.listen(config.port, () =>
    log('info', 'worker.listening', { port: config.port, storage: config.storageDriver }),
  );
  void loop();
  const stop = () => {
    stopping = true;
    server.close();
    setTimeout(() => process.exit(0), 5000).unref();
  };
  process.on('SIGTERM', stop);
  process.on('SIGINT', stop);
}
