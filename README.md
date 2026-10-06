# RUN ME MY MONEY

App and website for the Vaden World documentary series about scams and shady small
businesses: look a business up before you pay, submit your story with receipts, follow the
cases, watch the episodes.

| Read this                                                  | For                                                                             |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------- |
| [SPEC.md](SPEC.md)                                         | What the product is and the rules it follows (source of truth)                  |
| [docs/website-foundations.md](docs/website-foundations.md) | Sitemap, flows, design, security, privacy, SEO, data, API and test strategy     |
| [docs/operations.md](docs/operations.md)                   | Environments, deploy, budgets, monitoring, backups, third parties, QA checklist |
| [docs/self-audit.md](docs/self-audit.md)                   | Every Website Build Spec criterion and where it is met (or why not)             |
| [CLAUDE.md](CLAUDE.md)                                     | Working rules for contributors and Claude Code                                  |

## Architecture

```
apps/web         Next.js 16 (App Router, React 19). Public site, account, API route handlers.
                 proxy.ts: request id, IP/device bans, rate limits, nonce CSP, security headers.
apps/mobile      Expo SDK 57 + Expo Router (iOS/Android).
apps/worker      Node media pipeline (Phase 2).
packages/tokens  Design tokens → CSS variables + React Native values. WCAG contrast tests.
packages/ui      Shared UI: strings (i18n), web components + styles.css, React Native components.
packages/api     Shared zod contracts (enums, auth, website API).
packages/search-core  Identifier classifier + normalizers (SPEC 8.1).
supabase/        Postgres migrations (schema, RLS, functions), seed (fake *.demo data), pgTAP tests.
brand/           SVG brand assets (see brand/README.md).
```

Data lives in Supabase (Postgres with Row Level Security on every table, Auth, Storage).
The browser talks to our route handlers or to Supabase directly under RLS; the service role
key only exists on the server.

## Setup

```sh
corepack enable            # pnpm 10
pnpm install
cp apps/web/.env.example apps/web/.env.local   # fill in what you have; everything is optional locally
pnpm dev:web               # http://localhost:3000  (style guide at /styleguide)
pnpm dev:mobile            # Expo
```

Without Supabase variables the site runs fully; sign-in and forms explain that they are not
configured. For a local database use the Supabase CLI (`supabase start`, applies
`supabase/migrations` and `seed.sql`).

### Environment variables

Every variable is documented in [`.env.example`](.env.example) (all of them) and
`apps/*/.env.example` (per app). `NEXT_PUBLIC_*` / `EXPO_PUBLIC_*` are public;
`SUPABASE_SERVICE_ROLE_KEY`, `TURNSTILE_SECRET` and provider tokens are server-only and
must never be committed.

## Testing

```sh
pnpm check                 # lint, format, typecheck, unit tests, brand sync, copy rules
pnpm build                 # web, mobile JS bundles, worker
pnpm test:db               # pgTAP on a throwaway Postgres 16 (+ pgvector, pgTAP)
pnpm test:e2e:security     # Postgres + PostgREST + next start: bans on every route, rate limits,
                           # audit over HTTP, contact form round trip
pnpm --filter @rmmm/web build:e2e && pnpm --filter @rmmm/web test:e2e
                           # Playwright: journeys, axe (both themes), keyboard, responsive 320-1920,
                           # reduced motion, consent, 404/offline, visual regression, perf budget
```

Use a preinstalled Chromium with `PW_CHROMIUM_PATH=/path/to/chrome`, otherwise run
`pnpm --filter @rmmm/web exec playwright install chromium`.

## Content

- UI strings: `packages/ui/src/shared/strings.en.ts` (one place, ready for more languages).
- Legal pages: `apps/web/content/legal.ts` (drafts pending counsel; versioned).
- Resource guides: `apps/web/content/resources.ts` (each guide shows its review date).
- About page and principles: `apps/web/content/about.ts`.
- Cases, episodes and entities are database content managed in the admin console (Phase 3).

## Deploying

Vercel (web), Supabase (database/auth/storage), EAS (mobile). Details, rollback and the
pre-launch checklist are in [docs/operations.md](docs/operations.md).
