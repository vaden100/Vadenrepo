# CLAUDE.md

Website and app for **The NS1 Gallery** (The Nonsocial One Gallery, Indianapolis).
**SPEC.md is the source of truth.** Read the section you are working on before changing anything.

## How we build

- One phase at a time (SPEC 18). A phase is done only when its acceptance checks pass in tests.
- Current status: **Phase 0 partial** (from a pasted home page and a screen recording; crawl and
  baseline blocked by the build environment's network), **Phase 1 done** (foundations),
  **Phase 2 done except the parts that need the crawl** (redirect map, beating `docs/baseline.md`).
  Next: Phase 3 (Give with Zeffy, once the organization has an account).
- Stack Over Shine (S.O.S) is the nonprofit; it owns The NS1 Gallery. EIN, 501(c) type and
  registered name are placeholders until the director sends them.
- Decide early and write it down in `docs/decisions.md` (date, decision, reason).
- Never invent facts. Every fact on the site is in `docs/facts.md` with a source and in
  `apps/web/content/facts.ts`. Missing facts render as `<Placeholder>` and are listed in
  `docs/placeholders.md`.
- Commit and push after every phase, with `pnpm check && pnpm build` and the browser suite green.

## Layout

```
apps/web          Next.js 16 App Router (public site, /styleguide; later /admin)
packages/tokens   colors per theme (light, dark, high contrast x2), scale -> CSS vars; contrast tests
packages/i18n     strings per language (strings.en.ts), format(), flatten()
packages/ui       Button, LinkButton, TextField, Checkbox, Notice, Skeleton, Placeholder,
                  Icon, Logo, Shape, Roundtable; styles.css; generated/brand.ts (do not edit)
brand/            SVG masters: logo/, icons/, shapes/. Run `pnpm brand:sync` after any change.
scripts/          sync-brand, check-copy, readability (+ unit tests), make-temp-wordmark.py
docs/             discovery, facts, decisions, placeholders, accounts, costs, operations, logo-swap
discovery/        raw Phase 0 material, not deployed
```

Workspace packages are consumed as TypeScript source (no build step); web transpiles them.

## Commands

```sh
pnpm install
pnpm dev                 # http://localhost:3000, style guide at /styleguide
pnpm check               # lint, format, typecheck, unit tests, brand check, copy check, readability
pnpm build
PW_CHROMIUM_PATH=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome pnpm test:e2e   # builds with SITE_URL for the test server
```

## Rules that are easy to break

**Facts, consent, honesty (SPEC 0.3, 3, 9)**

- No invented statistics, stories, quotes, partners, people, or "$X provides Y" claims.
- Nothing about a real person (photo, name, story, quote) goes public without a consent record.
  The screen recording and session photos are NOT cleared yet: never commit them.
- "Nonprofit" is confirmed. Never say "tax-deductible" or "501(c)(3)" until the determination
  letter is on file (a browser test enforces this).
- "Need A Lawyer?" stays off the site until counsel reviews it.

**Copy (SPEC 6, enforced by `pnpm copy:check` and `pnpm readability`)**

- UI strings live in `packages/i18n/src/strings.en.ts`. No hardcoded copy in components.
- No em dashes, no emojis. Symbols like the copyright sign and arrows count: write "Copyright",
  use an `<Icon>`.
- No "!" in headings or buttons. Buttons are verb + object ("Save my spot").
- Banned phrases list in `scripts/lib/copy.mjs`. Prose keys read at grade 8 or lower (6 for Get help).
- Keep the gallery's own voice in headings and calls to action; plain words for facts and forms.

**Design (SPEC 6, 7)**

- Tokens only, never raw hex in components. Add every new text/background pair to
  `requiredPairs` in `packages/tokens/src/colors.ts`: body text 7:1, UI 4.5:1, borders and focus 3:1,
  in all four themes.
- Icons only from `brand/icons` via `<Icon name>`. Never a stock icon library.
- Every logo use goes through `<Logo>`. The wordmark is an image, never live text. The current
  logo is TEMPORARY (Fraunces outlined); see `docs/logo-swap.md`.
- SVG rules (SPEC 7.4) are enforced by `pnpm brand:check`: viewBox, no fixed size, currentColor,
  no scripts, foreignObject, images, external refs or SMIL.
- Motion only with meaning; always off under `prefers-reduced-motion` and `data-motion="reduce"`.
- Large targets: 48px for primary actions, 24px minimum.
- No inline `style` attributes in server-rendered HTML: the production CSP blocks them. Use classes,
  or a `<style nonce={await getNonce()}>` block.

**Website**

- Pages: add every public page to `apps/web/content/pages.ts` (one list feeds the sitemap, search,
  titles and the browser suite). Unique title + description via `pageMetadata()`, exactly one
  `<h1>` (from `PageHead` on inner pages, with breadcrumbs and JSON-LD).
- Every number shown on a page must appear in `docs/facts.md` (a browser test checks).
- Long-form content: Markdown in `apps/web/content/legal/`, then `pnpm content:sync` (bundled, no
  runtime file reads, because Cloudflare Workers have no filesystem).
- Forms: shared `TextField` / `Checkbox`; never report success before the server confirms.
- Scripts need the CSP nonce (`getNonce()`); never `'unsafe-inline'` or `'unsafe-eval'` in production.
- New third party: CSP in `lib/security/headers.ts`, `/legal/subprocessors`, consent category, and
  `docs/operations.md`, in the same change.
- Every page passes the browser suite: axe (WCAG 2.2 AA + AAA contrast) in light, dark, both high
  contrast modes, forced colors and with every reading setting on; no console errors; no
  horizontal scroll at 320px, also with the largest text and wide spacing.
- Self-hosted fonts only (fontsource packages). No Google Fonts at runtime.

**Code**

- Helpers in `'use client'` files cannot be called from the server: shared logic goes in plain
  modules (see `lib/reading.ts`).
- The browser's FileList is live: copy files (`Array.from(input.files)`) before any `await`.
- SQL parameters can be shadowed by column names: name them distinctly and qualify them.
- Fix build warnings when they appear.

**Accounts and secrets (SPEC 0.8, 17)**

- Never ask for a password, key or token in chat. Say which environment variable to set and where.
- Every account is created by the organization in its own name; see `docs/accounts.md`.
- No paid upgrades; list them in `docs/costs.md`.
