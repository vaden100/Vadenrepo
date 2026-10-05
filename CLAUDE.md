# CLAUDE.md

RUN ME MY MONEY: scam lookup, story submission, case tracker and episode hub for the
Vaden World documentary series. **SPEC.md is the source of truth.** Read the section you
are working on before changing anything.

## How we build

- One phase at a time (SPEC 16). A phase is done only when its acceptance checks pass.
- Current status: **Phase 1 done** (schema + RLS, roles with 2FA for staff, audit log,
  IP/device bans, rate limiter, OTP sign-in, 18+ age gate and terms on web and mobile).
  Next: Phase 2 (submit a story).

## Layout

```
apps/web         Next.js 16 App Router (public site, /styleguide, /legal/*, later /admin)
apps/mobile      Expo SDK 57 + Expo Router (tabs: Lookup, Episodes, Report, Cases, Me)
apps/worker      Node media pipeline (Phase 2); has /healthz only for now
packages/tokens  design tokens -> CSS vars (cssVariables()) + RN values, WCAG tests
packages/ui      shared/ (strings, stamp meta, formatters), web/ (DOM + styles.css), native/ (RN)
packages/api     zod enums mirroring the Postgres enums in SPEC 7 (schemas + client later)
packages/search-core  identifier classifier + normalizers (Phase 4)
supabase/        migrations (schema, RLS, functions), seed.sql (*.demo), pgtap/ (DB tests)
brand/           SVG assets. Run `pnpm brand:sync` after changing anything here.
```

Workspace packages are consumed as TypeScript source (no build step). Web transpiles them
via `transpilePackages`; Metro handles them for mobile.

## Commands

```sh
pnpm install
pnpm dev:web            # http://localhost:3000, style guide at /styleguide
pnpm dev:mobile         # Expo
pnpm check              # lint, format, typecheck, unit tests, brand sync, copy rules
pnpm build              # web (next build), mobile (expo export JS bundles), worker (tsc)
pnpm test:db            # pgTAP suite on a throwaway Postgres 16 (needs pgvector + pgTAP)
pnpm test:e2e:security  # Postgres + PostgREST + next start: bans, rate limits, audit, RLS over HTTP
```

Run `pnpm check && pnpm build` before every commit. CI runs the same plus `pnpm audit`.

## Rules that are easy to break

**Copy (SPEC 14, enforced by `pnpm copy:check` and ui tests)**

- UI strings live in `packages/ui/src/shared/strings.en.ts` (i18n-ready). No hardcoded copy in components.
- No em dashes, no emojis in UI.
- Never "scammer" or "fraud" as fact about a named party. Use "reported", "alleged", "under review".
- Data about named parties is neutral: "6 reports, 4 reviewed." Street voice is for marketing only.

**Design (SPEC 13)**

- Use tokens, never raw hex in components (exception: documented paper-shade tints in `styles.css`).
- Radius 2 px. No drop shadows, gradients, glass, hover animations or emojis.
- Motion only with meaning (stamp slam on status change, receipt slide-in, 150 ms fades), always off under reduced motion.
- Every async list or card gets a skeleton.
- Icons come from `brand/icons` via `<Icon name>`. Never add a stock icon library.
- The wordmark is an image, never live text.
- Every text/background pair must pass WCAG AA. Add new pairs to `packages/tokens/src/contrast.test.ts`.
  `statusResolvedText` exists because paper on the spec's `statusResolved` is 4.37:1.

**Database and security (SPEC 7, 9, 11)**

- Every new table: enable RLS, add policies, add tests in `supabase/pgtap/`, and an audit trigger
  if staff write to it (`private.audit_write('always' | 'staff_only')`).
- Staff checks use `private.is_staff()/is_moderator()/is_editor()/is_admin()`. They require
  `aal2` (2FA). Never check `profiles.role` directly in a policy.
- `SECURITY DEFINER` functions: `set search_path = ''` and fully qualified names.
- Never store raw birth dates, never put story text in `audit_log` (the trigger redacts it).
- Web requests pass `proxy.ts`: ban check (IP/CIDR + device), then rate limit (`RATE_RULES`
  in `apps/web/lib/security/rate-limit.ts`), then session refresh. Add a rule for every new
  mutating API route. Lookups fail open; Postgres re-checks bans on writes.
- `supabase/pgtap/setup/supabase_shim.sql` is for local tests only. Never run it on Supabase.

**Privacy and safety (SPEC 1, 7, 11)**

- Nothing about a business is public until reviewed by a human; two-person rule for new public entities.
- Never expose victim identity, phone, email or payment handles. Mask identifiers in public responses.
- Service-role key only in the worker and server functions. Never `NEXT_PUBLIC_*` / `EXPO_PUBLIC_*`.
- Seed data is obviously fake (`*.demo`) and never shipped to production.
- New third-party SDKs: add to `/legal/subprocessors` and the CSP in `apps/web/next.config.ts`.

## Placeholders still open

- `brand/` art except icons is placeholder (see `brand/README.md`).
- Business address and contact email in `apps/web/lib/business.ts`.
- All legal pages are stubs pending counsel.
