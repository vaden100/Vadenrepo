#!/usr/bin/env bash
# Phase 1 E2E: Postgres (migrations) + PostgREST + /rest/v1 gateway + `next start`.
# Needs: Postgres 16 (+pgvector, pgTAP), curl, xz. Downloads PostgREST once into the cache.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
CACHE="${RMMM_CACHE:-$HOME/.cache/rmmm}"
PGRST_VERSION=v12.2.12
export PGPORT="${PGPORT:-54329}" PGHOST=localhost PGUSER=postgres PGDATABASE=postgres
export JWT_SECRET="${JWT_SECRET:-e2e-only-secret-that-is-at-least-32-characters}"
export SUPABASE_URL="http://127.0.0.1:54321"
WEB_PORT=3311
export WEB_URL="http://127.0.0.1:$WEB_PORT"

pids=()
cleanup() {
  for p in "${pids[@]}"; do kill "$p" 2>/dev/null || true; done
  "$ROOT/scripts/db/local-pg.sh" stop
}
trap cleanup EXIT

mkdir -p "$CACHE"
if [ ! -x "$CACHE/postgrest-$PGRST_VERSION" ]; then
  curl -fsSL "https://github.com/PostgREST/postgrest/releases/download/$PGRST_VERSION/postgrest-$PGRST_VERSION-linux-static-x86-64.tar.xz" \
    | tar -xJ -C "$CACHE"
  mv "$CACHE/postgrest" "$CACHE/postgrest-$PGRST_VERSION"
fi

"$ROOT/scripts/db/local-pg.sh" start >/dev/null

PGRST_DB_URI="postgres://authenticator:authenticator@localhost:$PGPORT/postgres" \
PGRST_DB_SCHEMAS=public PGRST_DB_ANON_ROLE=anon PGRST_DB_EXTRA_SEARCH_PATH="public,extensions" \
PGRST_JWT_SECRET="$JWT_SECRET" PGRST_SERVER_PORT=54330 PGRST_SERVER_HOST=127.0.0.1 \
  "$CACHE/postgrest-$PGRST_VERSION" >"${TMPDIR:-/tmp}/rmmm-postgrest.log" 2>&1 &
pids+=($!)
node "$ROOT/scripts/e2e/gateway.mjs" &
pids+=($!)

SERVICE_KEY="$(node "$ROOT/scripts/e2e/jwt.mjs" '{"role":"service_role"}')"
if [ ! -f "$ROOT/apps/web/.next/BUILD_ID" ] || [ "${E2E_REBUILD:-0}" = "1" ]; then
  pnpm --dir "$ROOT/apps/web" build >/dev/null
fi
(
  cd "$ROOT/apps/web"
  SUPABASE_URL="$SUPABASE_URL" SUPABASE_SERVICE_ROLE_KEY="$SERVICE_KEY" BAN_CACHE_TTL_MS=0 PORT=$WEB_PORT \
    exec pnpm exec next start -H 127.0.0.1 >"${TMPDIR:-/tmp}/rmmm-next.log" 2>&1
) &
pids+=($!)

ready=0
for _ in $(seq 1 120); do
  if curl -fs -o /dev/null "http://127.0.0.1:54330/" && curl -fs -o /dev/null -H 'x-forwarded-for: 198.18.0.1' "$WEB_URL/api/health"; then
    ready=1
    break
  fi
  sleep 0.5
done
if [ "$ready" != 1 ]; then
  echo "stack did not come up" >&2
  tail -20 "${TMPDIR:-/tmp}/rmmm-postgrest.log" "${TMPDIR:-/tmp}/rmmm-next.log" >&2 || true
  exit 1
fi

node --test "$ROOT/scripts/e2e/security.test.mjs"
