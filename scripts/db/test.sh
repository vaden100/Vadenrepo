#!/usr/bin/env bash
# Applies every migration to a fresh Postgres and runs the pgTAP suite (SPEC 17).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
export PGPORT="${PGPORT:-54329}"
trap '"$ROOT/scripts/db/local-pg.sh" stop' EXIT
"$ROOT/scripts/db/local-pg.sh" start >/dev/null
PGHOST=localhost PGUSER=postgres PGDATABASE=postgres \
  pg_prove --ext .sql --failures "$ROOT/supabase/pgtap" "$@"
