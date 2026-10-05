#!/usr/bin/env bash
# Throwaway local Postgres 16 with our migrations applied (tests and E2E only).
#   scripts/db/local-pg.sh start   -> prints DATABASE_URL; leaves server running
#   scripts/db/local-pg.sh stop
# Needs: postgresql-16, postgresql-16-pgvector, postgresql-16-pgtap.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
PGBIN="${PGBIN:-$(ls -d /usr/lib/postgresql/16/bin 2>/dev/null || dirname "$(command -v pg_ctl)")}"
PORT="${PGPORT:-54329}"
STATE="${RMMM_PG_DIR:-${TMPDIR:-/tmp}/rmmm-pg-$PORT}"
DATA="$STATE/data"

# initdb refuses to run as root; use the postgres OS user when we are root (containers).
as_pg() {
  if [ "$(id -u)" = "0" ]; then runuser -u postgres -- "$@"; else "$@"; fi
}

start() {
  if [ -f "$DATA/postmaster.pid" ]; then stop; fi
  rm -rf "$STATE"
  mkdir -p "$STATE"
  [ "$(id -u)" = "0" ] && chown postgres "$STATE"
  as_pg "$PGBIN/initdb" -D "$DATA" -U postgres --auth=trust --no-sync -E UTF8 --locale=C.UTF-8 >/dev/null
  as_pg "$PGBIN/pg_ctl" -D "$DATA" -l "$STATE/pg.log" -w \
    -o "-p $PORT -k $STATE -c listen_addresses=localhost -c fsync=off" start >/dev/null

  export PGHOST=localhost PGPORT="$PORT" PGUSER=postgres PGDATABASE=postgres PGOPTIONS="-c client_min_messages=warning"
  local psql=(psql -v ON_ERROR_STOP=1 -q -X)
  "${psql[@]}" -f "$ROOT/supabase/pgtap/setup/supabase_shim.sql" >/dev/null
  for f in "$ROOT"/supabase/migrations/*.sql; do
    "${psql[@]}" -f "$f" >/dev/null || { echo "migration failed: $f" >&2; exit 1; }
  done
  "${psql[@]}" -f "$ROOT/supabase/pgtap/setup/helpers.sql" >/dev/null
  echo "postgresql://postgres@localhost:$PORT/postgres"
}

stop() {
  [ -d "$DATA" ] && as_pg "$PGBIN/pg_ctl" -D "$DATA" -m fast -w stop >/dev/null 2>&1 || true
}

case "${1:-start}" in
  start) start ;;
  stop) stop ;;
  *) echo "usage: $0 start|stop" >&2; exit 2 ;;
esac
