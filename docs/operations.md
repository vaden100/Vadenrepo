# Operations

How RUN ME MY MONEY is built, shipped, watched and kept healthy (WBS 74, 79 to 81, 121,
122, 124 to 126). Product rules live in SPEC.md; the website plan in
`docs/website-foundations.md`.

## Environments

|          | Development                                                          | Staging                            | Production                    |
| -------- | -------------------------------------------------------------------- | ---------------------------------- | ----------------------------- |
| Web      | `pnpm dev:web`                                                       | Vercel preview (every PR)          | Vercel production (`main`)    |
| Database | Supabase CLI (`supabase start`) or `pnpm test:db` throwaway Postgres | Supabase staging project           | Supabase production project   |
| Mobile   | Expo Go / dev client                                                 | EAS internal distribution          | App Store / Play (EAS submit) |
| Indexing | n/a                                                                  | `NEXT_PUBLIC_ALLOW_INDEXING=false` | default (allowed)             |
| Secrets  | `.env.local` (never committed)                                       | Vercel + Supabase env              | Vercel + Supabase env         |

Every variable is listed with its purpose in `.env.example` and `apps/*/.env.example`.
`NEXT_PUBLIC_*` and `EXPO_PUBLIC_*` values are public by definition; the service role key,
Turnstile secret and provider tokens are server-only.

## Deploying

1. PR opens → CI: lint, format, typecheck, unit tests, brand sync, copy rules, build,
   pgTAP, E2E security stack, Playwright (axe, keyboard, responsive, visual, perf), audit.
2. Merge to `main` → Vercel deploys production; database migrations are applied with
   `supabase db push` against staging first, then production (manual approval).
3. Never edit production by hand. Changes go through migrations and git.
4. Rollback: Vercel "instant rollback" to the previous deployment. Migrations are forward
   only; a bad migration is fixed by a new migration (risky ones ship with a tested down
   script in the PR).

## Performance budget

Checked in CI by `apps/web/e2e/perf.spec.ts` on a throttled profile (150 ms latency,
1.6 Mbps, 4x CPU slowdown):

| Metric                                               | Budget                                           | Last measured                           |
| ---------------------------------------------------- | ------------------------------------------------ | --------------------------------------- |
| Largest Contentful Paint (home)                      | < 2.5 s                                          | 0.8 s                                   |
| Cumulative Layout Shift (home)                       | < 0.1                                            | 0.003                                   |
| JavaScript on the wire (compressed), home first load | < 170 KB                                         | 150 KB (Next.js + React ≈ 117 KB of it) |
| Fonts                                                | 5 faces, Latin-split woff2, `font-display: swap` | ≈ 90 KB for a Latin page                |
| Third-party requests before consent                  | 0                                                | 0 (asserted in `privacy.spec.ts`)       |

Heavy code is lazy: the identifier classifier (phone metadata + domain list) loads on
first focus of the search field, not with the page. After launch, real-user Web Vitals
(Vercel Speed Insights or Plausible's custom events) are the source of truth; lab numbers
catch regressions.

## Logging and monitoring

- Server logs are single JSON lines: `ts`, `level`, `event`, `requestId` and fields with
  sensitive keys redacted (`apps/web/lib/log.ts`). Every response carries `x-request-id`.
- Browser errors from error boundaries are posted to `/api/client-errors` (message, digest,
  path only; rate limited).
- Never logged: passwords (there are none), tokens, cookies, emails, phone numbers, story
  text, message bodies, raw IPs outside the security proxy.
- To add Sentry: set `SENTRY_DSN`, install `@sentry/nextjs`, enable `beforeSend` scrubbing
  of request bodies and cookies, add Sentry to `/legal/subprocessors` and the CSP
  `connect-src`. Until then, Vercel log drains carry the JSON logs.
- Watch after launch: 5xx rate, 4xx spikes on `/api/*`, 429 rate (abuse or limits too
  tight), ban hits, LCP/INP/CLS, uptime of `/api/health`, contact backlog older than 3
  days, flags older than 24 hours (SPEC 10.7), deletion requests older than 25 days.

## Backups and restore

- Supabase daily backups + point-in-time recovery enabled on production (SPEC 11).
- Restore drill (quarterly, and before launch): restore the latest backup into a scratch
  project, run `pnpm test:db` against it, spot-check counts of reports, entities, audit
  rows, and record the time it took in the drill log below. A backup that has never been
  restored is not trusted.

| Date                  | Backup restored | Duration | Result | By  |
| --------------------- | --------------- | -------- | ------ | --- |
| (pending first drill) |                 |          |        |     |

## Retention

| Data               | Kept                            | Then                                            |
| ------------------ | ------------------------------- | ----------------------------------------------- |
| Account            | until deletion requested        | deleted within 30 days                          |
| Reports + evidence | while the case is active        | deleted or anonymized unless under legal hold   |
| Abandoned drafts   | 30 days (draft cookie lifetime) | deleted with their files (cleanup job, Phase 3) |
| Contact messages   | 2 years                         | deleted                                         |
| Rate-limit buckets | 1 day idle                      | pruned (`prune_rate_limits()`)                  |
| Audit log          | indefinitely                    | append-only, never edited                       |

## Third-party inventory (WBS 76, 121)

| Service                  | Why                                                                  | Data it gets                  | Cookies                        | Consent needed                       | Performance cost              |
| ------------------------ | -------------------------------------------------------------------- | ----------------------------- | ------------------------------ | ------------------------------------ | ----------------------------- |
| Supabase                 | Database, auth, storage                                              | Account, reports, messages    | `sb-*` session (after sign-in) | No (necessary)                       | API calls only                |
| Vercel                   | Hosting                                                              | Request data                  | None                           | No                                   | n/a                           |
| Cloudflare Turnstile     | Bot checks on sign-in, contact and report submit (when keys are set) | Browser signals               | During challenge               | No (security)                        | ~1 script on those pages only |
| Media worker host        | Runs `apps/worker` (Fly.io or Render, chosen at deploy)              | Evidence files while cleaning | None                           | No (necessary)                       | n/a (server side)             |
| Transcription (optional) | Voice-note text, only when `TRANSCRIBE_API_URL` is set               | Voice-note audio              | None                           | Listed on /legal/subprocessors first | n/a                           |
| Plausible                | Anonymous visit counts (when configured)                             | Page, referrer, browser type  | None                           | Yes, asked first                     | 1 small script after opt-in   |

Fonts are self-hosted. No ad, tracking, chat, map or social SDKs.

## Change management

- Dependencies: Renovate/Dependabot weekly; `pnpm audit` blocks high/critical in CI.
- Policies: bump `LEGAL_VERSION` (legal pages) and `CONSENT_VERSION` (cookie choices) on a
  material change; everyone is asked again for cookies, and `TERMS_VERSION` for terms.
- Security config: CSP and headers live in `apps/web/lib/security/headers.ts` with unit
  tests; add each new third party there and in `/legal/subprocessors` in the same PR.
- Design: tokens in `packages/tokens` (contrast-tested), components in `packages/ui`,
  visual baselines in `apps/web/e2e/visual.spec.ts-snapshots` (update deliberately with
  `pnpm --filter @rmmm/web test:e2e:update` and review the diff).
- Content: legal pages in `apps/web/content/legal.ts`, guides in `content/resources.ts`.
  Resource guides carry a review date; re-check official links every quarter.

## Pre-launch QA checklist (WBS 99)

Automated in CI (✓) or manual (□):

- ✓ Desktop, tablet, mobile widths 320 to 1920 (responsive.spec)
- ✓ Chromium; □ Safari (macOS + iOS), Firefox, Edge manual pass
- ✓ Keyboard (keyboard.spec); □ VoiceOver, NVDA, TalkBack pass
- ✓ Reduced motion (motion.spec)
- ✓ Forms: validation, success, rate limit, network failure, server errors (forms.spec + E2E stack)
- ✓ Loading, empty, error, offline states; 404 status and page (errors.spec)
- ✓ SEO: titles, descriptions, canonical, OG images, sitemap, robots, structured data (smoke.spec)
- ✓ Cookies and consent, no third parties before consent (privacy.spec)
- ✓ Security headers + CSP on every page (smoke.spec, security tests)
- ✓ No console errors or CSP violations on any public page (smoke.spec)
- ✓ Bans, rate limits, audit, RLS over HTTP (E2E security stack)
- □ HTTPS + HSTS preload on the production domain; HTTP redirects to HTTPS (Vercel)
- □ Backup restore drill completed and logged
- □ Lawyer sign-off on legal pages (SPEC 12)
- □ Real business address and contact email in `apps/web/lib/business.ts`
- □ Production env vars set; `NEXT_PUBLIC_SITE_URL` points at the real domain
