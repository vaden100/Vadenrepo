// E2E only: mimics Supabase's API gateway by serving PostgREST under /rest/v1.
import http from 'node:http';

const port = Number(process.env.GATEWAY_PORT ?? 54321);
const upstream = new URL(process.env.POSTGREST_URL ?? 'http://127.0.0.1:54330');

http
  .createServer((req, res) => {
    if (!req.url?.startsWith('/rest/v1/')) {
      res.writeHead(404).end();
      return;
    }
    const headers = { ...req.headers, host: upstream.host };
    const up = http.request(
      {
        host: upstream.hostname,
        port: upstream.port,
        path: req.url.slice('/rest/v1'.length),
        method: req.method,
        headers,
      },
      (r) => {
        res.writeHead(r.statusCode ?? 502, r.headers);
        r.pipe(res);
      },
    );
    up.on('error', () => res.writeHead(502).end());
    req.pipe(up);
  })
  .listen(port, '127.0.0.1');
