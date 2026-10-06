# CLAUDE.md

RUN ME MY MONEY: scam lookup, story submission, case tracker and episode hub for the
Vaden World documentary series. **SPEC.md is the source of truth.** Read the section you
are working on before changing anything.

## How we build

- One phase at a time (SPEC 16). A phase is done only when its acceptance checks pass.
- Current status: **Phase 3 done** (admin console at `/admin`: queue, report review with
  evidence viewer and redaction, entities with two-person approval, merge and link graph, flags
  with 24-hour timers, disputes inbox, bans, audit log), on top of Phases 1 and 2 and the Website
  Build Spec (`docs/website-foundations.md`, audit in `docs/self-audit.md`). Next: Phase 4 (deep search).
- Website criteria that conflict with SPEC.md are decided in `docs/website-foundations.md`
  section 17. SPEC.md wins.

## Layout

```
apps/web         Next.js 16 App Router (public site, /styleguide, /legal/*, later /admin)
apps/mobile      Expo SDK 57 + Expo Router (tabs: Lookup, Episodes, Report, Cases, Me)
apps/worker      Node media pipeline: job queue, magic bytes, ClamAV, EXIF/metadata strip, hashes, OCR/transcripts
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
pnpm test:e2e:security  # Postgres + PostgREST + next start + worker: bans, rate limits, audit, RLS,
                        # and the Phase 2 acceptance report in a real browser (e2e-stack/)
pnpm --filter @rmmm/web build:e2e && pnpm --filter @rmmm/web test:e2e   # Playwright + axe
```

Run `pnpm check && pnpm build` before every commit. CI runs the same plus `pnpm audit`.

## Rules that are easy to break

**Copy (SPEC 14, enforced by `pnpm copy:check` and ui tests)**

- UI strings live in `packages/ui/src/shared/strings.en.ts` (i18n-ready). No hardcoded copy in
  components. Long-form page content lives in `apps/web/content/*` (legal, guides, about).
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

**Website (docs/website-foundations.md)**

- Pages: unique title + description via `pageMetadata()`, breadcrumbs via `PageHead`, one `<h1>`.
  Add new public pages to `app/sitemap.ts`, `lib/site.ts` (palette) and `e2e/helpers.ts`.
- Use the shared form components (`TextField`, `SelectField`, `Checkbox`, `RadioGroup`) and
  `postJson()`; never report success before the server confirms.
- Scripts need the CSP nonce (`getNonce()`); never add `'unsafe-inline'` to `script-src`.
- New third party: CSP in `lib/security/headers.ts`, `/legal/subprocessors`, consent category,
  and the inventory in `docs/operations.md`, in the same PR.
- Every page must pass the Playwright suite: axe in both themes, no console errors, no
  horizontal overflow at 320px. Update visual baselines on purpose and review the diff.

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

**Admin console (SPEC 3, 5, 10)**

- Admin pages call `requireStaff()`, admin routes use `adminRoute()` (`lib/admin/`). Both act with the
  staff member's own Supabase session, never the service role, so RLS applies and the audit
  trigger records who did it. Non-staff get a 404.
- Approvals only through `approve_entity()`; `entities.approved_by` is a read-only mirror. The
  publish guard counts `entity_approvals` rows (moderator + editor, two different people).
- Staff never see a reporter's IP or device hash (column grants). Bans from a report go through
  `ban_report_source()` (admins only).

**Reports and evidence (SPEC 4.1, 6, 11)**

- Report routes check access with `reportAccess()` (account, draft token, or claim token; cookie
  on web, `x-rmmm-draft` / `x-rmmm-claim` headers in the app). Everyone else gets 404.
- Only token and claim-code hashes are stored. The claim code is shown once.
- Evidence never goes public from the raw upload: the worker overwrites each file with its
  cleaned version. `STORAGE_DRIVER=local` is for development and E2E only.

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
