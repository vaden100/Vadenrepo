// E2E only: mimics Supabase's API gateway by serving PostgREST under /rest/v1, plus the one
// Auth endpoint the web app calls to validate a session (GET /auth/v1/user). Tokens are the
// HS256 JWTs minted by jwt.mjs; there is no sign-in here.
import { createHmac, timingSafeEqual } from 'node:crypto';
import http from 'node:http';

const secret = process.env.JWT_SECRET ?? '';

function verify(token) {
  const [h, b, sig] = (token ?? '').split('.');
  if (!h || !b || !sig) return null;
  const expected = createHmac('sha256', secret).update(`${h}.${b}`).digest();
  const given = Buffer.from(sig, 'base64url');
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
  const claims = JSON.parse(Buffer.from(b, 'base64url').toString('utf8'));
  return claims.exp && claims.exp * 1000 > Date.now() ? claims : null;
}

function authUser(req, res) {
  const claims = verify(req.headers.authorization?.replace(/^Bearer\s+/i, ''));
  if (!claims?.sub) {
    res
      .writeHead(401, { 'content-type': 'application/json' })
      .end(JSON.stringify({ code: 401, msg: 'invalid JWT' }));
    return;
  }
  const verified =
    claims.aal === 'aal2'
      ? [{ id: `factor-${claims.sub}`, factor_type: 'totp', status: 'verified' }]
      : [];
  res.writeHead(200, { 'content-type': 'application/json' }).end(
    JSON.stringify({
      id: claims.sub,
      aud: 'authenticated',
      role: 'authenticated',
      email: claims.email ?? `${claims.sub}@e2e.demo`,
      app_metadata: {},
      user_metadata: {},
      factors: verified,
      created_at: '2026-10-01T00:00:00Z',
    }),
  );
}

const port = Number(process.env.GATEWAY_PORT ?? 54321);
const upstream = new URL(process.env.POSTGREST_URL ?? 'http://127.0.0.1:54330');

http
  .createServer((req, res) => {
    if (req.method === 'GET' && req.url === '/auth/v1/user') return authUser(req, res);
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
