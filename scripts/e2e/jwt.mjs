// E2E only: HS256 JWTs like Supabase issues (service_role, authenticated + aal).
import { createHmac } from 'node:crypto';

const b64 = (o) => Buffer.from(typeof o === 'string' ? o : JSON.stringify(o)).toString('base64url');

export function sign(claims, secret) {
  const head = b64({ alg: 'HS256', typ: 'JWT' });
  const body = b64({
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600,
    ...claims,
  });
  const sig = createHmac('sha256', secret).update(`${head}.${body}`).digest('base64url');
  return `${head}.${body}.${sig}`;
}

/** A cookie @supabase/ssr accepts as a signed-in session (storage key from the Supabase URL). */
export function sessionCookie(supabaseUrl, accessToken, sub) {
  const name = `sb-${new URL(supabaseUrl).hostname.split('.')[0]}-auth-token`;
  const now = Math.floor(Date.now() / 1000);
  const session = {
    access_token: accessToken,
    refresh_token: 'e2e-refresh',
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: now + 3600,
    user: {
      id: sub,
      aud: 'authenticated',
      role: 'authenticated',
      app_metadata: {},
      user_metadata: {},
    },
  };
  return { name, value: `base64-${Buffer.from(JSON.stringify(session)).toString('base64url')}` };
}

if (process.argv[2]) console.log(sign(JSON.parse(process.argv[2]), process.env.JWT_SECRET));
