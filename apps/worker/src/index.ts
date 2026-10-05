/**
 * Media pipeline worker (SPEC 6). Phase 2 adds: ClamAV scan, EXIF/GPS strip, OCR,
 * pHash/dHash, transcription. Phase 0 only provides the process and a health check
 * for Fly.io / Render.
 */
import { createServer } from 'node:http';
import { loadConfig } from './config.js';

const config = loadConfig();

const server = createServer((req, res) => {
  if (req.url === '/healthz') {
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ ok: true }));
    return;
  }
  res.writeHead(404).end();
});

server.listen(config.port, () => {
  console.log(`worker listening on :${config.port}`);
});
