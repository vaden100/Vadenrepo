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

if (process.argv[2]) console.log(sign(JSON.parse(process.argv[2]), process.env.JWT_SECRET));
