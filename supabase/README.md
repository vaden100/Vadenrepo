# supabase/

- `migrations/`: schema, RLS, helpers and RPCs (SPEC 7, 10, 11, 12). Applied in order.
- `seed.sql`: obviously fake `*.demo` data for local development. Never load in production.
- `pgtap/`: database tests. `pnpm test:db` spins up a throwaway Postgres 16, applies
  `pgtap/setup/supabase_shim.sql` (a tiny stand-in for Supabase's auth schema and roles),
  every migration, then runs the suite with `pg_prove`.
  The shim is for local tests only: never run it against a Supabase project. It lives
  outside `supabase/tests/` on purpose so `supabase test db` never picks it up.
- `functions/`: edge functions (Phase 2 onward).

## Rules the schema enforces

| Rule                                                       | Where                                             |
| ---------------------------------------------------------- | ------------------------------------------------- |
| RLS on every table                                         | `20261005000400_rls.sql`, test `01`               |
| Anon sees only approved/published data, identifiers masked | policies + `public_entity_identifiers`, test `02` |
| Staff privileges need 2FA (`aal2`)                         | `private.is_staff()` and friends, test `03`       |
| Every staff write is audited; audit log is append-only     | `private.audit_write()`, test `04`                |
| IP (CIDR, expiry) and device bans                          | `is_banned()`, test `05`                          |
| Postgres token-bucket rate limiter                         | `check_rate_limit()`, test `05`                   |
| 18+ age gate, terms version logged                         | `confirm_age()`, `accept_terms()`, test `06`      |
| Two-person rule to publish an entity                       | `entities_publish_guard`, test `06`               |
| Legal hold freezes edits                                   | `legal_hold_guard`, test `06`                     |

## Local dev with the Supabase CLI

```sh
supabase start      # applies migrations + seed.sql
supabase db reset   # rebuild from scratch
```

Requires the CLI and Docker. `pnpm test:db` only needs Postgres 16 with the pgvector and
pgTAP packages (`apt install postgresql-16 postgresql-16-pgvector postgresql-16-pgtap`).
