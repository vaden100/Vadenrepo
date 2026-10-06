#!/usr/bin/env bash
# Stack E2E: Postgres (migrations) + PostgREST + /rest/v1 gateway + `next start` + media worker.
#   Phase 1: bans, rate limits, audit, RLS over HTTP (node --test security.test.mjs)
#   Phase 2: anonymous report in a real browser with 2 images + voice note, EXIF removed,
#            claim code works, consent rows stored (Playwright, e2e-stack/)
# Needs: Postgres 16 (+pgvector, pgTAP), curl, xz, ffmpeg. Downloads PostgREST once.
# E2E_ONLY=node|browser runs one half.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
CACHE="${RMMM_CACHE:-$HOME/.cache/rmmm}"
PGRST_VERSION=v12.2.12
export PGPORT="${PGPORT:-54329}" PGHOST=localhost PGUSER=postgres PGDATABASE=postgres
export JWT_SECRET="${JWT_SECRET:-e2e-only-secret-that-is-at-least-32-characters}"
export SUPABASE_URL="http://127.0.0.1:54321"
WEB_PORT=3311
export WEB_URL="http://127.0.0.1:$WEB_PORT"
# Evidence goes to a local folder shared by Next and the worker (Supabase Storage stand-in).
export STORAGE_DRIVER=local ALLOW_LOCAL_STORAGE=1
export STORAGE_LOCAL_DIR="${TMPDIR:-/tmp}/rmmm-e2e-storage"
export UPLOAD_SIGNING_SECRET="e2e-only-upload-signing-secret-0123456789"
rm -rf "$STORAGE_LOCAL_DIR"

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

export SERVICE_KEY="$(node "$ROOT/scripts/e2e/jwt.mjs" '{"role":"service_role"}')"
if [ ! -f "$ROOT/apps/web/.next/BUILD_ID" ] || [ "${E2E_REBUILD:-0}" = "1" ]; then
  pnpm --dir "$ROOT/apps/web" build >/dev/null
fi
(
  cd "$ROOT/apps/web"
  SUPABASE_URL="$SUPABASE_URL" SUPABASE_SERVICE_ROLE_KEY="$SERVICE_KEY" BAN_CACHE_TTL_MS=0 PORT=$WEB_PORT \
    exec pnpm exec next start -H 127.0.0.1 >"${TMPDIR:-/tmp}/rmmm-next.log" 2>&1
) &
pids+=($!)

if [ ! -f "$ROOT/apps/worker/dist/index.js" ] || [ "${E2E_REBUILD:-0}" = "1" ]; then
  pnpm --dir "$ROOT/apps/worker" build >/dev/null
fi
SUPABASE_URL="$SUPABASE_URL" SUPABASE_SERVICE_ROLE_KEY="$SERVICE_KEY" POLL_MS=500 PORT=8788 \
  node "$ROOT/apps/worker/dist/index.js" >"${TMPDIR:-/tmp}/rmmm-worker.log" 2>&1 &
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

if [ "${E2E_ONLY:-}" != "browser" ]; then
  node --test "$ROOT/scripts/e2e/security.test.mjs"
fi
if [ "${E2E_ONLY:-}" != "node" ]; then
  pnpm --dir "$ROOT/apps/web" exec playwright test -c playwright.stack.config.ts
fi
