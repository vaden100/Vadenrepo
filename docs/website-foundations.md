# Website foundations

The 16 pre-build artifacts required by the Website Build Specification (WBS), applied to
RUN ME MY MONEY. SPEC.md stays the product source of truth; where the WBS and SPEC.md
disagree, SPEC.md wins and the decision is recorded in section 17.

---

## 1. Sitemap

Live now (P = phase that fills it in, per SPEC 16):

```
/                         Home: what this is, live identifier check, how a report becomes a case
/lookup                   Scam Lookup. Identifier detection now; results in P4
/resources                Hub: guides people need before and after paying
  /resources/before-you-pay        Checklist (SPEC 4.2)
  /resources/report-it             FTC, IC3, state attorney general (SPEC 4.5)
  /resources/payment-disputes      Per payment rail (SPEC 4.1, 4.5)
/about                    The series, how reports are handled, who runs this
/contact                  Contact form (press, business response, legal, safety, other)
/auth                     Sign in with a one-time code
/onboarding               18+ age gate and terms
/account                  Account overview
  /account/delete         Data deletion request (SPEC 12)
/privacy-settings         Cookie and privacy preference center (WBS 102)
/legal/[slug]             privacy, terms, cookies, accessibility, subprocessors, dmca, refunds
/styleguide               Design system reference (noindex)
/sitemap.xml, /robots.txt, /opengraph-image (dynamic per page)
```

Arriving in later phases (not linked until real): `/report` (P2), `/admin` (P3),
`/entities/[slug]` (P4), `/cases`, `/cases/[slug]`, `/episodes`, `/episodes/[slug]` (P5),
`/business` (P4). Navigation only shows destinations that work today.

## 2. User flows

| Flow                  | Steps                                                                                      | Success                               | Failure paths                                                                   |
| --------------------- | ------------------------------------------------------------------------------------------ | ------------------------------------- | ------------------------------------------------------------------------------- |
| Check before paying   | Home → type handle/$tag/phone in hero → see what it is → Lookup → Before You Pay checklist | Knows what to check                   | Unrecognized input → treated as a name; offline → banner, nothing breaks        |
| Get help after paying | Home → Resources → Payment disputes (rail) / Report it (FTC, IC3)                          | Leaves with official link + steps     | Official site down → our page still lists phone/alt routes                      |
| Contact the team      | Any page → Contact → choose reason → message → Send                                        | Server confirms, reference shown      | Validation errors inline; 429 → wait message; 5xx → retry keeps text            |
| Sign in               | Account → email/phone → code → onboarding (18+, terms) → account                           | Session cookie, account page          | Bad code, expired code, under 18 (signed out, explained), suspended (explained) |
| Delete my data        | Account → Delete my data → confirm scope → request                                         | Request logged, 30-day promise stated | Not signed in → sign in first; network error → retry                            |
| Privacy choices       | First visit banner (only if optional categories exist) or footer "Privacy settings"        | Choice stored with version            | JS off → no optional cookies are ever set                                       |
| Navigate fast         | `Ctrl/Cmd+K` or `/` → command palette → type → Enter                                       | Lands on page                         | No match → empty state with suggestions                                         |

## 3. Design direction

**The evidence room.** Dark table, receipts, manila envelopes, rubber stamps (SPEC 13).
Signature moves that make it unmistakable:

- **Ink on paper.** Content that is _about_ reports lives on paper surfaces (receipts,
  envelopes); everything else is the dark room. The material tells you what kind of
  information you are reading.
- **Stamps as state.** Status is shown with real-text rubber stamps that slam on change.
- **Live classification.** Typing an identifier shows, as you type, what the system thinks it
  is (Cash App tag, phone, handle...) as a typed receipt line. It is the product's core idea
  made tangible on the first screen, and it is real (packages/search-core), not a demo.
- **Case-file storytelling.** "How a report becomes a case" is a sticky sequence of stamps
  driven by scroll (IntersectionObserver), fully readable as a plain ordered list without JS
  or with reduced motion.

Rejected on purpose: custom cursor, parallax, glass, gradients, shadows, neon (section 17).

## 4. Color system

Semantic tokens (CSS custom properties from `@rmmm/tokens`, mirrored in RN):

| Token                                                           | Dark                   | Light         | Use                                          |
| --------------------------------------------------------------- | ---------------------- | ------------- | -------------------------------------------- |
| `--color-background`                                            | ink #111111            | paper #F2EEE6 | Page                                         |
| `--color-surface`                                               | graphite #2A2A2A       | #E6E0D4       | Cards, inputs                                |
| `--color-surface-elevated`                                      | #333331                | #FBF9F4       | Menus, dialogs, palette                      |
| `--color-text-primary` (`--color-text`)                         | paper                  | paper-ink     | Body                                         |
| `--color-text-secondary`                                        | #C9C5BC                | #3D3C38       | Supporting copy                              |
| `--color-text-muted`                                            | mute #8A8A85 (16px+)   | #5E5D58       | Meta                                         |
| `--color-border`                                                | smoke #3A3A38          | #CFC8BA       | Dividers                                     |
| `--color-accent` (`--color-primary`)                            | stamp-red              | stamp-red     | Primary actions                              |
| `--color-accent-hover`                                          | #A91B24                | #A91B24       | Pressed state (no hover animation)           |
| `--color-focus`                                                 | caution                | paper-ink     | Focus ring                                   |
| `--color-success` / `-warning` / `-error` (`-danger`) / `-info` | tuned per theme for AA |               | Status messages, always with an icon or text |

Every text pair is asserted in `packages/tokens/src/contrast.test.ts` (WCAG AA). Status is
never color-only: stamps carry words, messages carry an icon and a label.

## 5. Typography system

- Display/headlines: **Archivo** variable (wght 100 to 900, wdth 62 to 125), condensed
  (`font-stretch: 70%`) for big titles. Body/UI: **IBM Plex Sans** 400/600. Data, codes,
  money, timestamps: **IBM Plex Mono** 400/600. All SIL OFL, self-hosted, `font-display: swap`,
  only the 5 faces used are shipped (Latin subsets split by unicode-range).
- Fluid scale: `--text-display: clamp(2.5rem, 1.6rem + 4.5vw, 5.5rem)`,
  `--text-h1: clamp(2rem, 1.5rem + 2.2vw, 3rem)`, `--text-h2: clamp(1.5rem, 1.3rem + 0.9vw, 2rem)`;
  body fixed at 16px/24px minimum (readability on cracked phones), small 14/20.
- HTML heading levels follow document structure; visual size comes from classes.

## 6. Component inventory

Web (`packages/ui/src/web` shared primitives + `apps/web/components` app components):

| Component                                                                                              | States                                                                                       | Notes                                                                             |
| ------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Button                                                                                                 | primary, secondary, ghost, danger, icon; default, focus, pressed, loading, success, disabled | `<button>` for actions; `ButtonLink` (`<a>`) for navigation                       |
| Field / TextArea / Select / Checkbox / RadioGroup                                                      | empty, focused, filled, invalid, valid, disabled                                             | Label + description + error wired with `aria-describedby`, correct `autocomplete` |
| Dialog                                                                                                 | open/close, focus trap, Escape, restore focus, inert background                              | Used by mobile nav, command palette, cookie preferences                           |
| Toast / StatusMessage                                                                                  | info, success, warning, error                                                                | `aria-live` polite/assertive                                                      |
| Header / MobileNav / Logo                                                                              | default, current page, scrolled, menu open                                                   | Logo has static, scrolled and pressed states (no load animation)                  |
| Footer                                                                                                 |                                                                                              | Legal, privacy settings, business details                                         |
| CommandPalette                                                                                         | closed, open, results, empty                                                                 | Combobox + listbox pattern                                                        |
| Breadcrumbs                                                                                            |                                                                                              | With BreadcrumbList JSON-LD                                                       |
| EmptyState / ErrorState / OfflineBanner                                                                |                                                                                              | Explain what, why, next action                                                    |
| Stamp, ReceiptCard, CaseEnvelope, EvidenceSummary, WhyMatched, LinkedPages, MarkerHighlight, Skeletons | (Phase 0)                                                                                    | Signature components                                                              |
| IdentifierProbe                                                                                        | empty, typing, detected (per kind), invalid                                                  | Live search-core classification                                                   |
| StorySequence                                                                                          | per-step active state                                                                        | Scroll-driven, reduced-motion = static list                                       |
| CookieBanner / PrivacySettings                                                                         |                                                                                              | Reject as prominent as accept                                                     |

## 7. Motion system

Tokens: `--duration-fast 120ms` (stamp slam), `--duration-normal 150ms` (fades),
`--duration-slow 240ms` (dialog/receipt enter); `--ease-standard`, `--ease-emphasized`,
`--ease-enter`, `--ease-exit`. Only `transform` and `opacity` animate. Motion exists for:
status change (slam), new evidence (receipt slide-in), dialog enter/exit, story step change.
`prefers-reduced-motion: reduce` zeroes every duration and stops the skeleton pulse.
No hover animation anywhere (SPEC 13).

## 8. Responsive strategy

Mobile first. Breakpoints 480 / 768 / 1024 / 1280. Grid: 4 columns + 16px gutter/margin on
mobile, 8 columns at 768 (24px), 12 columns at 1024+ (24px gutter, 1120px max content,
fluid side margins). Touch targets ≥ 48px. Navigation collapses to a dialog menu below 768.
Verified automatically at 320, 375, 390, 430, 768, 1024, 1280, 1440, 1920 (no horizontal
overflow, nav reachable) in Playwright.

## 9. Accessibility strategy

Target WCAG 2.2 AA. Semantic HTML first (landmarks, real buttons/links, labels), ARIA only
for patterns HTML lacks (combobox, dialog). Visible 3px focus ring everywhere, never removed.
Skip link. Logical headings. Dialogs trap focus, close on Escape, restore focus. Forms
identify errors in text and move focus to the first invalid field. Reduced motion honored.
Automated axe scans on every public page in both themes in CI, plus keyboard-only E2E
tests. Manual VoiceOver/NVDA/TalkBack passes are listed in the launch checklist (they
cannot be automated honestly). The `/legal/accessibility` statement states exactly that.

## 10. Security strategy

Defense in depth, all server-enforced:

- Edge: `proxy.ts` per request: request id, IP/CIDR + device ban (403), per-route token
  bucket (429), session refresh, **nonce-based CSP** (`script-src 'nonce-…' 'strict-dynamic'`,
  no `unsafe-inline`/`unsafe-eval` for scripts in production).
- Headers: CSP, HSTS (preload), X-Content-Type-Options, X-Frame-Options/frame-ancestors,
  Referrer-Policy, Permissions-Policy (camera/geolocation off, microphone self for voice notes),
  Cross-Origin-Opener-Policy.
- Data: Postgres RLS on every table, staff need 2FA, audit log append-only, service role only
  on the server. Route handlers validate with zod, return `{ error: code, message }` without
  internals, and never trust headers, cookies or client state for authorization.
- Forms: server validation, honeypot, rate limit, Turnstile when configured; CSRF covered by
  SameSite=Lax cookies + same-origin check on mutating route handlers.
- Sessions: Supabase httpOnly cookies via @supabase/ssr; nothing sensitive in localStorage.
  Private pages send `Cache-Control: no-store`.

## 11. Privacy and cookie strategy

| Cookie         | Category    | Purpose                                                          | Set when                                 |
| -------------- | ----------- | ---------------------------------------------------------------- | ---------------------------------------- |
| `sb-*`         | Necessary   | Sign-in session                                                  | Only after you sign in                   |
| `rmmm_did`     | Necessary   | Random device id for abuse prevention (bans), hashed server-side | First request                            |
| `rmmm_consent` | Necessary   | Remembers your privacy choices + policy version                  | When you choose                          |
| `rmmm_theme`   | Preferences | Remembers light/dark if you pick one                             | When you pick, only if Preferences is on |

No analytics or marketing cookies exist today. Analytics (Plausible, cookieless, IP
anonymized) only loads when `ANALYTICS_KEY` is set **and** the Analytics category is on.
Because no optional category is active by default, the banner only appears once an
optional category is configured; the preference center is always reachable from the
footer. Consent records store categories, policy version and timestamp; signed-in users'
choices are also written to `consents_log`.

## 12. SEO strategy

Per page: unique `<title>` via template, meta description, canonical (from
`NEXT_PUBLIC_SITE_URL`), Open Graph + Twitter card with a **dynamic OG image** per page
(brand fonts, page title, kind), descriptive URLs. Site: `sitemap.xml` (public pages only),
`robots.txt` (disallow `/account`, `/auth`, `/onboarding`, `/api`, `/styleguide`).
Structured data only where true: `Organization` (site-wide), `WebSite`, `BreadcrumbList`
(resources, legal), `HowTo`-free (guides are prose, not steps we can certify), no FAQ schema
unless a page is a real FAQ. Private and utility pages are `noindex`.

## 13. Data architecture

SPEC 7 schema (supabase/migrations) plus, for the website:

- `contact_messages` (id, reason enum, name, email citext, message ≤ 4000, status,
  created_at, handled_at, handled_by, ip_hash, device_hash). Inserted only by the server
  route (service role); readable by staff; audited on staff writes.
- `deletion_requests` (existing) gains self-service insert from `/account/delete`.
- Consent: cookie on the client; `consents_log` for signed-in users.

## 14. API architecture

Next.js route handlers under `/api`, each: zod-validated input → authorization (server)
→ rate limit (proxy) → typed JSON `{ ok: true, … } | { error, message }` with stable error
codes, no stack traces. Current endpoints: `GET /api/health`, `POST /api/contact`,
`POST /api/privacy/delete`, `POST /api/consent`. Contracts live in `packages/api`
(zod schemas shared with clients). Supabase PostgREST is used directly only for RLS-safe
reads/writes from signed-in clients.

## 15. Testing strategy

| Layer             | Tool                                                               | What                                                                                                                           |
| ----------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| Unit              | Vitest                                                             | tokens/contrast, formatters, copy rules, search-core classifier (every SPEC 8.1 row), API schemas, security proxy, CSP builder |
| Database          | pgTAP                                                              | RLS, audit, bans, rate limits, onboarding, publishing rules, contact table                                                     |
| Integration/E2E   | node:test + real Postgres/PostgREST/next start                     | bans on every route, rate limit, audit over HTTP, contact form round trip                                                      |
| Browser E2E       | Playwright (Chromium; WebKit/Firefox in CI matrix where available) | journeys, keyboard-only, dialogs, palette, theme no-flash, cookie choices, 404/500, no console errors or CSP violations        |
| Accessibility     | axe-core via Playwright                                            | every public page, both themes, mobile + desktop                                                                               |
| Responsive        | Playwright                                                         | 320 to 1920 widths, no horizontal overflow                                                                                     |
| Visual regression | Playwright screenshots                                             | home, lookup, resources, contact, 404, styleguide                                                                              |
| Performance       | build budget script + Playwright Web Vitals                        | JS/CSS/font budgets, LCP/CLS on throttled mobile profile                                                                       |

## 16. Deployment strategy

Environments: **development** (local, `.env.local`, Supabase CLI), **staging** (Vercel
preview per PR + Supabase staging project), **production** (Vercel production + Supabase
production). Migrations run with `supabase db push` from CI on merge to `main` (staging),
then promoted by tag (production). Secrets live in Vercel/Supabase/EAS secret stores, never
in git. Rollback: Vercel instant rollback; database changes are forward-only migrations
with tested down-scripts for risky changes. Details in `docs/operations.md`.

---

## 17. Decisions where the WBS and SPEC.md differ (documented assumptions)

| WBS item                 | Decision                                           | Why                                                                                                                            |
| ------------------------ | -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| 7 Custom cursor          | **Not built**                                      | SPEC 13 bans hover animation; audience is mobile-first ("3 AM on a cracked phone"); a cursor adds nothing to finding evidence. |
| 3/127 Shadows tokens     | Tokens exist and are all `none`                    | SPEC 13: depth from surface color only.                                                                                        |
| 127 Radius sm/md/lg      | All 2px (`--radius-sm/md/lg`)                      | SPEC 13 square-cornered paper.                                                                                                 |
| 11 Parallax              | Not used                                           | No meaning to carry; motion budget goes to stamps.                                                                             |
| 31 Cookie banner         | Shown only when an optional category is configured | Today only necessary cookies exist; showing a banner for nothing is noise. Preference center always available.                 |
| 38 Passwords             | No passwords at all                                | SPEC: OTP sign-in; nothing to hash, reset or leak. Passkeys later.                                                             |
| 66 Command palette       | Built (`Ctrl/Cmd+K`, `/`)                          | Power users (staff, journalists) navigate a lot of pages.                                                                      |
| 83 Payments, 106 Booking | Not applicable                                     | Nothing is sold; refund policy kept as SPEC requires.                                                                          |
| 108 Haptics, 109 Sound   | Not used                                           | No meaningful action needs them yet.                                                                                           |
| 113 WebGL                | Not used                                           | No story it would tell better than paper and ink.                                                                              |
| 35 CSP `style-src`       | `'unsafe-inline'` kept for styles only             | React style attributes; scripts are nonce-only. Style injection cannot execute code; documented risk.                          |
