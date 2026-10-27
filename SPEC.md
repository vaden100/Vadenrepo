# BUILD PROMPT: nonprofit website and app

How to use this: open a new Claude Code session in an empty repository, paste this whole document,
and add one line at the very top:

```
ORGANIZATION WEBSITE: https://...   (the nonprofit's current site)
```

Fill in what you can of section 1. The builder reads the current site first (Phase 0) and fills in
the rest with a source link for every fact. Everything else here is already decided on purpose:
do not reopen these decisions during the build.

---

## 0. Instructions to the builder (read first, follow throughout)

1. **This document is the source of truth.** Save it as `SPEC.md` at the repo root. Create a
   `CLAUDE.md` with the rules that are easy to break (section 19) and the current phase. When this
   document conflicts with your defaults, it wins.
2. **Start with the organization, not the code.** Phase 0 reads the current website at the URL
   above and writes `docs/discovery.md` and `docs/facts.md` before any design or code. The mission,
   programs, people served and voice come from the organization, never from you.
3. **Never invent facts.** No made-up statistics, stories, quotes, partners, logos, awards, staff,
   board members, financial figures or "$25 provides X" claims. Every fact on the site has a
   source in `docs/facts.md` (a URL on their site, a document they gave, or "confirmed by {name}
   on {date}"). If a fact is missing, show a clearly marked placeholder
   (`[IMPACT FIGURE: needs source]`) and list it in `docs/placeholders.md`.
4. **Do not ask me to choose things this document decides.** If something is truly not covered,
   pick what best serves the people the organization serves (section 2), write it in
   `docs/decisions.md` (date, decision, reason) and keep going. Ask only about facts.
5. **Free first.** This is a nonprofit on a startup budget. Use free plans that allow this use, and
   apply for the nonprofit programs in section 15.2. Before using any service, check its current
   free plan and terms; if it changed, pick the next free option and record why. Never put a card
   on file. Paid upgrades are listed in `docs/costs.md`, never done.
6. **One phase at a time (section 18).** A phase is done only when its acceptance checks pass in
   automated tests. Commit and push at the end of every phase. Report what passed, what did not,
   and what is still placeholder, in plain language a non-developer understands.
7. **Verify, do not assume.** Read the framework's docs in `node_modules` before using an API;
   versions change. Run the full test suite before every commit.
8. **Secrets never go in chat.** Never ask me to paste a password, API key or token into the
   conversation. Tell me which environment variable to create and where (the hosting settings or
   the session's environment settings). If this session's network blocks a host you need, say
   which host and point me to the network settings; do not work around it.

---

## 1. Facts only the organization can provide

Leave a line empty if unknown. Phase 0 fills what it can from the current site (with a source
link) and lists the rest in `docs/placeholders.md` as questions for me.

```
ORGANIZATION WEBSITE:   (the current site; required)
LEGAL NAME + EIN:       (exactly as on the IRS determination letter)
TAX STATUS:             (e.g. 501(c)(3) public charity; state of incorporation)
MISSION (their words):  (do not rewrite it; the builder may suggest a shorter line, marked as a suggestion)
WHO YOU SERVE:          (people and places; languages they speak; any group that needs extra privacy or safety)
PROGRAMS:               (name, what happens, who it is for, where, how to join)
DIRECT SERVICES:        (do people ask you for help through the site? yes/no; what kind)
IMPACT FIGURES:         (each with source, period and how it was counted)
FINANCIALS:             (latest Form 990 year, audited statements if any, program/admin/fundraising split as reported)
BOARD + STAFF:          (names and titles cleared for the site)
DONATIONS TODAY:        (platform used now, if any; recurring donors; who has the login)
VOLUNTEERS:             (yes/no; roles; age limits; background checks; waiver text from counsel)
EVENTS:                 (yes/no; how often)
PARTNERS / SPONSORS:    (only with permission to name; logo files)
STORIES:                (only with signed consent; see section 9)
BRAND:                  (logo files if they exist, ideally SVG; colors; fonts; or "none yet")
DOMAIN + EMAIL:         (who controls the domain, where email is hosted today; do not break it)
ADMINS:                 (who will run the site; names and roles)
CONTACT:                (public email, phone, mailing address for checks)
SOCIAL:                 (links)
```

---

## 2. Positioning (decided)

**What the site is:** the organization's front door and working tool. It does four jobs, in this
order of importance, and the home page shows all four within the first screen and a half:

1. **Get help** (only if DIRECT SERVICES is yes): the people the organization serves find help fast,
   on any phone, in their language, without giving more information than needed.
2. **Give:** donors give once or monthly in under a minute and can see where money goes.
3. **Take part:** volunteers, event guests and partners sign up and know exactly what happens next.
4. **Trust:** funders, journalists and partners can check legitimacy in under a minute: legal
   name, EIN, 990s, board, financials, policies, real impact with sources.

**Who it is for (in this order):** the people served; individual donors (most on phones); volunteers;
institutional funders and corporate partners; press and the public.

**What "groundbreaking" means here (decided):** not effects for their own sake. It means
1) a signature, custom SVG system built from the organization's own story and data (section 7),
2) accessibility and language access beyond the usual (section 11), 3) radical transparency
about money and impact (section 8.3), 4) it works on a cheap phone on a weak connection and
offline (section 12), and 5) the data of the people served is protected like a bank would (section 14).
Any innovation that fails one of those five is cut.

**The primary conversion:** depends on the organization. If DIRECT SERVICES is yes, "Get help"
comes first and is never pushed below a donation ask. Otherwise "Give" is primary. The decision
and reason go in `docs/decisions.md` after Phase 0.

---

## 3. Non-negotiables

- WCAG 2.2 AA everywhere, plus the extras in section 11 (AAA text contrast for body text, plain
  language, cognitive accessibility), tested automatically and by keyboard and screen reader.
- No invented facts, no stock photos pretending to be the people served, no AI-generated images
  of people, no AI-written stories presented as real.
- Nothing about a real person (photo, name, story, quote) goes public without recorded consent
  (section 9). Consent can be withdrawn and the site removes it within 48 hours.
- The site never handles card numbers. Donations run through a donation platform (section 8.1).
- People asking for help are never tracked, never put into analytics, never added to a mailing list
  and never asked for more than the minimum (section 8.5).
- Monthly running cost: **$0** plus the domain name.
- Content Security Policy with per-request nonces; never `'unsafe-inline'` for scripts.
- No third-party scripts before consent, except strictly necessary ones (bot protection on forms,
  the donation form when the donor opens it).
- Never report "sent", "registered" or "thank you for your gift" before the server or the donation
  platform confirms.
- Self-hosted fonts. No Google Fonts requests at runtime.
- No dark patterns: no guilt pop-ups, no pre-ticked monthly giving, no fake urgency counters, no
  "only 3 spots left" unless true and computed from the database.
- Copy rules in section 6.2, checked in CI.

---

## 4. Phase 0: Discovery (read the current site before anything else)

1. **Crawl the current site** at ORGANIZATION WEBSITE: respect `robots.txt`, same domain only,
   at most 1 request per second, at most 500 pages. Save page titles, headings, text, links,
   image and PDF URLs into `discovery/` (not deployed). If the network blocks the site, say so,
   point me to the network settings, and ask me to paste the key pages instead. Do not guess.
2. **Write `docs/discovery.md`:** mission in their words; programs; who they serve; the voice they
   use; every page with its job; what works; what is missing; donation flow today (platform,
   steps, fees if visible); volunteer and event flows; legal and transparency pages present or missing.
3. **Baseline audit of the current site:** axe results, mobile layout at 320px, page weight and
   load time on a throttled phone profile, broken links, images without alt text, PDFs that are
   not accessible. Save as `docs/baseline.md`. The new site must beat every number.
4. **Write `docs/facts.md`:** every fact with its source URL. Anything found on the site but not
   dated or sourced is marked "needs confirmation".
5. **Module selection:** decide which modules from section 8 are on (always on: Give, Trust,
   Programs, Stories, Contact; on if the site or I confirm it: Get help, Volunteer, Events,
   Partners, Newsletter, Languages). Record each decision with its reason.
6. **Content and redirect map:** every old URL maps to a new URL (301) or to a deliberate 410.
   Old PDFs that are still useful are rebuilt as accessible HTML pages with the PDF kept as a download.
7. **Brand inventory:** logo files found (and whether a vector version exists), colors used, fonts,
   photography. Whether the photos have consent and rights on file is a question for me, not an assumption.
8. **Domain and email check:** read the current DNS records (public lookup), list MX, SPF, DKIM
   and DMARC records, and write the migration plan in `docs/launch-plan.md` so moving the website
   never breaks the organization's email.

*Accept:* every fact on the eventual site traces to `docs/facts.md`; the redirect map covers every
crawled URL; module decisions are recorded; `docs/placeholders.md` lists every open question for me
in plain language, grouped by who can answer it (director, finance, programs, counsel).

---

## 5. Sitemap (final list depends on modules; these are the templates)

| Path | Job | Primary action |
| --- | --- | --- |
| `/` | All four jobs in one screen and a half (order in section 5.1) | Get help or Give (section 2) |
| `/get-help` | Find the right help fast (module) | Start a request / Call |
| `/get-help/request` | Minimal, safe request form (module, section 8.5) | Send request |
| `/programs`, `/programs/[slug]` | What each program does, for whom, how to join | Join / Refer someone |
| `/give` | Donate once or monthly (section 8.1) | Give |
| `/give/thank-you` | Confirmation and what the gift does (only sourced facts) | Share / Monthly upgrade (once, polite) |
| `/give/other-ways` | Checks, donor-advised funds, stock, employer matching, in-kind, planned giving | Contact |
| `/impact` | Impact with sources and dates, the signature data stories (section 7.5) | Give |
| `/transparency` | Legal name, EIN, 990s, financials, board, policies (section 8.3) | Download |
| `/stories`, `/stories/[slug]` | Real stories with consent (section 9) | Give / Take part |
| `/volunteer`, `/volunteer/[shift]` | Roles and shifts with capacity (module) | Sign up |
| `/events`, `/events/[slug]` | Events with RSVP and access info (module) | RSVP |
| `/partners` | Corporate and foundation partnership, self-serve builder (module, section 8.4) | Build a partnership |
| `/partners/proposal/[token]` | Private proposal page for a partner (module) | Accept / Ask / Book a call |
| `/about`, `/about/team` | History, staff, board | Contact |
| `/news` | Updates and press releases | Subscribe |
| `/press` | Press kit, boilerplate, logos, one-page fact sheet PDF | Download |
| `/contact` | Contact form, address for checks, phone, hours | Send |
| `/search` | Search the whole site | none |
| `/legal/privacy`, `/legal/donor-privacy`, `/legal/terms`, `/legal/accessibility`, `/legal/cookies` | Required pages (drafts, marked pending counsel) | none |
| `/admin` | Staff console, passkeys or 2FA required (section 16) | none |
| `404`, `500`, offline | Helpful, in the visitor's language, with help contacts if the help module is on | Go home |

### 5.1 Home (order is fixed)

1. **Mission line** as the H1 (their words or an approved shorter version), one sentence on who they serve and where.
2. **Three or four doors** as large, plain cards: Get help (if on), Give, Volunteer or Take part, Partner.
3. **One signature SVG piece** (section 7.5) showing real impact data, with a text equivalent.
4. **One story** with consent (section 9).
5. **Programs** as plain cards.
6. **Trust strip:** legal name, EIN, "990s and financials" link, partner marks only with permission.
7. **Final band:** "Give monthly" and "Get help" (if on), plus newsletter sign-up.

If the help module is on, a fixed, small "Get help" link and a **Quick exit** button (section 8.5)
appear in the header on every page.

---

## 6. Brand system

### 6.1 Voice

Warm, direct and respectful. Write **with** people, not about them: "people experiencing
homelessness", not "the homeless"; follow the community's own preferred terms (Phase 0 records
them). Plain language, reading level grade 8 or lower for public pages and grade 6 for Get help,
checked in CI with a readability script. Donors are thanked, never guilted.

### 6.2 Copy rules (enforced by `copy:check` in CI)

- No em dashes. No emojis. No exclamation marks in headings or buttons.
- Banned: "less fortunate", "voiceless", "give them a voice", "victims" (unless the person chose
  that word), "at-risk youth" (use specific facts), "underprivileged", "save" as in rescuing people,
  "every dollar goes directly to" (unless audited and true), "game-changer", "cutting-edge",
  "revolutionary", "leverage", "synergy", "empower" (as filler).
- Numbers always have a period and a source: "1,240 families housed in 2025 (program records)".
- Buttons: verb plus object: "Give monthly", "Sign up for this shift", "Get help now".
- UI strings live in one strings file per language (i18n-ready from day one). No hardcoded copy in components.

### 6.3 Typography (open licenses, self-hosted, `font-display: swap`)

- If the organization has brand fonts with a web license, use them. Otherwise, decided:
  **Atkinson Hyperlegible Next** for text and interface (designed for low vision readers) and
  **Fraunces** (variable, open license) for display headings. Builder confirms both licenses.
- Body 18px desktop, 17px mobile, line height 1.6, max 68 characters per line.
- Subsets for every language the site supports (Latin Extended, Vietnamese, Cyrillic or others as needed).
- Users can switch to a larger text size and a dyslexia-friendly spacing mode (section 11).

### 6.4 Colors (one source of truth, `packages/tokens`)

- If the organization has brand colors, map them to tokens, adjusting lightness only as needed to pass
  contrast; record each adjustment. If not, the builder proposes one palette with three options
  shown in `/styleguide` and picks the one that best fits the mission; I can change it later.
- Tokens: `background`, `surface`, `text`, `textSecondary`, `border`, `accent`, `onAccent`,
  `give` (donation actions), `help` (get-help actions), `danger`, `success`, `focus`.
- Body text contrast at least **7:1** (AAA), large text and UI at least 4.5:1, focus indicator 3:1.
  Every pair is unit-tested in both themes and in high-contrast mode.
- Never raw hex in components.

### 6.5 Layout, shape and motion

- 12-column grid, 1200px content max. Spacing scale 4, 8, 12, 16, 24, 32, 48, 64, 96.
- Large touch targets (48px for primary actions). Generous white space.
- Motion only with meaning: a chart drawing itself once, a progress step advancing. Never motion
  that delays reading. All motion off under `prefers-reduced-motion` and in the site's own
  "reduce motion" setting. No parallax, no scroll-jacking, no autoplaying video with sound.

### 6.6 Logo

- If Phase 0 finds a vector logo, use it (outlined, `viewBox`, `currentColor` version made).
- If only a raster logo exists, do not trace it by hand and call it final: use a temporary wordmark
  (the name set in the display font, outlined to paths) and list "vector logo needed" in placeholders.
- Every logo use reads from `brand/logo/` through one `<Logo>` component and `pnpm brand:sync`.
  `docs/logo-swap.md` says how to drop in the real files: only `brand/` changes, then run sync and tests.
- Requirements for whoever designs the real logo: SVG with outlined text, one-color version,
  light version for dark backgrounds, square mark readable at 16px.

---

## 7. The signature SVG system (custom, accessible, from real data)

This is where the site stands out. Every SVG is made for this organization; no stock icons, no
template illustrations.

### 7.1 Files and pipeline

```
brand/
  logo/        wordmark.svg, wordmark-light.svg, mark.svg
  icons/       *.svg (24px grid, section 7.3)
  shapes/      the visual language primitives (section 7.2)
  maps/        service area base map, simplified
  diagrams/    how-it-works, where-money-goes masters
scripts/sync-brand.mjs   SVGO, typed components, checks; fails CI if anything is unoptimised
```

### 7.2 Visual language (decided method, organization-specific result)

- In Phase 1 the builder derives **a small set of geometric primitives** from the organization's
  own world (Phase 0 notes): for example the shape of their region, a building type, a symbol from
  their history, a pattern from the community they serve (only with the community's input).
- These primitives build everything: section dividers, card corners, empty states, illustrations,
  loading states and the generated social images. One motif element per screen section maximum.
- **Generative pattern from data:** a deterministic SVG pattern whose density, rhythm or color steps
  are driven by a real number (for example, one mark per 100 meals served last year). It is
  decorative (`aria-hidden`), and the number it encodes is always stated in text next to it.
- Every illustration is reviewed by at least one person from the community served before launch
  (listed in `docs/placeholders.md` until done).

### 7.3 Icons

24px grid, 2px padding, one stroke weight, round or square caps chosen to match the primitives.
Only the icons the site uses (about 25: arrows, external, menu, close, search, check, alert, info,
phone, mail, location, calendar, clock, language, heart for give, hand for help, people for
volunteer, download, play, pause, plus, minus, lock, exit). Rendered by `<Icon name>`; never a stock icon library.

### 7.4 Rules for every SVG

- `viewBox`, no fixed width/height; colors via `currentColor` or tokens so themes and high-contrast
  mode work (test in Windows forced colors mode: `forced-color-adjust` handled).
- No embedded rasters, external references, scripts or `foreignObject`. Uploaded SVG is never
  rendered inline (converted to PNG or rejected).
- Decorative: `aria-hidden="true"`, `focusable="false"`. Meaningful: `role="img"` with an accessible name.
- Meaningful strokes and fills meet 3:1 against the background in both themes.
- Nothing flashes more than 3 times per second. No SMIL animation.

### 7.5 Signature data stories (the groundbreaking part)

Built as inline SVG components with real, sourced data from `docs/facts.md`:

1. **Where the money goes:** the reported split (programs, management, fundraising) for the latest
   990 year as an SVG chart, with the 990 linked. Never estimated by the builder.
2. **Impact over time:** a simple, honest line or bar chart of a real measure with "as of" dates.
3. **Where we work:** a simplified SVG map of the service area. Every region on the map is also in a
   table below it; keyboard users move between regions with arrow keys; it is never the only way to find information.
4. **How it works:** a step diagram of the main program (the path a person takes), drawn once on first view.
5. **Your gift, honestly:** after a donation, an SVG "receipt" showing the gift amount next to the
   organization's reported spending split. Only shows "what $X does" if the organization documents
   the cost basis; otherwise it shows the split only.

Every data story has: a heading, a one-sentence takeaway, the chart, a data table toggle, the
source and date, and a "download the data (CSV)" link. Charts follow one style: no 3D, no
pie charts with more than 3 slices, direct labels instead of legends where possible, patterns or
labels so color is never the only signal.

### 7.6 Generated images

- Open Graph images rendered on the server from an SVG template (title, primitives, logo), 1200x630.
- Favicon set: SVG mark (adapts to dark mode), ICO fallback, apple-touch-icon, manifest icons 192/512 and maskable.
- Shareable impact cards (SVG to PNG) for social, with alt text supplied when shared.

---

## 8. Modules

### 8.1 Give (always on)

- **Donation platform, decided free option:** **Zeffy** (no platform or card fees for the nonprofit;
  funded by an optional donor tip). The builder confirms current terms first. Because donors have
  been surprised by the tip, the `/give` page states plainly, before the form: "Our donation form is
  free for us. It may ask you for an optional tip to the platform; you can set it to $0."
- If the organization already uses a platform with recurring donors, **do not migrate donors**.
  Keep it, and put switching in `docs/decisions.md` as a choice for the director.
- The site never sees card data. `/give` shows the amount choices, once/monthly, and opens the
  platform's form (embed or redirect) only when the donor acts; the platform domain is listed in
  the CSP and on the subprocessors page.
- Monthly is offered, never pre-selected. Suggested amounts come from the organization.
- Dedications (in honor, in memory) if the platform supports them.
- `/give/other-ways`: mailing address for checks, EIN for donor-advised funds and employer
  matching, stock and planned giving contact, in-kind wish list (if any).
- State charitable solicitation disclosure text, if counsel provides it, shown on `/give`
  (placeholder until then).
- Thank-you page and receipt come from the platform; the site's thank-you page shows the honest
  SVG receipt (7.5.5).
- Paid upgrade path (not done): Stripe with the nonprofit discount, built in, only if the
  organization decides the platform no longer fits.

### 8.2 Programs (always on)

Template: what happens, who it is for, eligibility in plain words, where and when, how to join or
refer someone, languages available, accessibility, one story (with consent), one real figure with
source, contact for this program.

### 8.3 Trust and transparency (always on)

- Legal name, EIN, tax status, state, determination letter (PDF, accessible), latest 990s linked to
  the IRS or ProPublica Nonprofit Explorer page for the organization (link only; ProPublica's data
  license is non-commercial with attribution and the builder checks it before using any data from it).
- Audited financials or annual reports if they exist; the "where the money goes" chart (7.5.1).
- Board and staff (cleared names), policies (privacy, donor privacy, conflict of interest,
  whistleblower, nondiscrimination, accessibility) as they exist; missing ones listed as placeholders, never drafted as if adopted.
- Charity rating or transparency seals only if the organization holds them, linked to the source.
- A one-page fact sheet PDF generated from the same content, for funders and press.

### 8.4 Partners: self-serve partnership builder (module)

For corporate and foundation partners who have no time for a call. Reuses the "build your production"
pattern from my studio site:

- Starting points from the organization's real offers: event sponsorship, team volunteer day,
  in-kind donation, program sponsorship, employee giving or matching. Admin edits them.
- Chapters: goal (what the company wants: employee engagement, community presence, specific
  cause), what they offer (money range, people and dates, goods), timing, recognition wanted
  (logo, none, anonymous), approvals and paperwork (W-9, certificate of insurance requests,
  vendor forms), how to reply (written proposal, short recorded walkthrough, ideas first, call only if needed).
- Live summary sheet, autosave, email-me-a-link to finish, read-only share link for their manager,
  PDF download.
- Staff reply with a private proposal page (`/partners/proposal/[token]`): plan, recognition,
  timeline, what is needed; the partner can Accept, Ask a question or Book a call. Money is
  handled by invoice or the donation platform, never on this page. Only the first-open time is recorded, and the page says so.
- No partner logo appears on the site without a recorded permission (who, when, how).

### 8.5 Get help (module; the most sensitive part of the site)

Design like the people using it may be in danger, in crisis, on a shared phone or watched.

- **Quick exit** button on every page (fixed, keyboard reachable, Escape key twice also exits):
  replaces the page with a neutral site and replaces the history entry. Explained once on `/get-help`
  with how to clear browsing history.
- Emergency and crisis contacts relevant to the mission and region at the top of `/get-help` (from
  the organization; the builder verifies each number at its official source and dates it).
- The request form asks only what the program needs to respond: first name or nickname, how to
  reach them safely (and when it is safe), what they need, language. Everything else optional.
  No account required. Saves progress in the browser only if they choose.
- Data: encrypted at rest; stored in its own table with Row Level Security so only staff with the
  "help" role can read it; never in analytics, logs, error reports, emails' subject lines or
  admin search results for other roles. Deleted after the retention period the organization sets
  (default 12 months after the case closes).
- Never send an email or text to the person unless they asked for that channel, and the message
  never says what it is about in the preview text.
- Works with no JavaScript, on a 2G connection, at 320px, and offline shows the help contacts.
- Language choice is the first control on the page; all help content is translated by a person,
  not only by machine (machine translation can be a temporary placeholder, labelled).

### 8.6 Volunteer (module)

- Roles (what you do, time, skills, age limits, accessibility of the role) and shifts.
- **Shift sign-up with capacity enforced in the database** (a constraint or locked counter), so a
  shift can never be overbooked even if many people sign up at once.
- Waiver: the organization's text from counsel, shown in full, accepted with a checkbox; the
  accepted version and time are stored. Under-18 volunteers need a guardian's acceptance; under-13
  data is not collected (COPPA).
- Calendar invite (`.ics`), reminder emails 48 and 24 hours before, cancel link that frees the spot.
- Hours log for volunteers (for their records and the organization's reports), visible only to them and staff.
- Background checks, if required, are handled outside the site; the site only records "required / done" set by staff.

### 8.7 Events (module)

RSVP with capacity in the database, `.ics` invites, reminders, a waitlist that offers freed spots
in order, and an access section on every event (step-free access, seating, restrooms, ASL or
captioning "on request by {date}", quiet room, parking, transit). Ticketed fundraisers use the
donation platform's event tickets; the site never takes payment.

### 8.8 Stories (always on; consent rules in section 9)

Story template: headline in the person's words, story, photo or illustration, program, the
person's chosen name or "Name changed", consent recorded, date. Option to show a story with no
photo, or with an illustration made from the primitives instead.

### 8.9 Newsletter (module)

Double opt-in, list kept in the site's own database, sent through the email provider's free plan
(section 15). One-click unsubscribe in every email, plain-text version, no tracking pixels. If the
list outgrows the free plan, the decision goes in `docs/costs.md` with options (nonprofit
discounts first). Never add donors, volunteers or help requests to the newsletter without their own opt-in.

### 8.10 Languages (module, on if Phase 0 shows the community uses other languages)

i18n from day one: localized URLs (`/es/...`), `lang` attributes, language switch in the header
(by language name in that language, never a flag), human-reviewed translations for all key
flows (Get help, Give, Volunteer), machine translation labelled as such where used temporarily.

---

## 9. Consent for stories, photos and names

- Every public story, photo of an identifiable person, quote and name has a **consent record**:
  who consented, for what (website, social, print, fundraising), for how long, signed how (form,
  paper scan stored privately), and for minors the guardian's consent.
- The CMS blocks publishing without a valid consent record; the website double-checks before rendering.
- **Withdrawal:** a person can withdraw by email or a form; staff mark it in admin and the content
  is removed from the site within 48 hours (and from the generated images and caches).
- Consent expires by default after 3 years and staff get a reminder 30 days before.
- Faces can be blurred, names changed, locations removed. Metadata (GPS, device) is stripped from every image.
- People are paid or thanked as the organization's policy says; that policy is linked in `docs/content-guide.md`.

---

## 10. Media pipeline

- Responsive images: AVIF and WebP with JPEG fallback, widths 480 to 2560, `srcset` and `sizes`,
  explicit dimensions, blurred placeholder, lazy below the fold. Hero under 200 KB.
- Strip GPS and device data from every image; keep photographer credit.
- Short video on Cloudflare R2 (free downloads) with captions and a poster; longer video on YouTube
  with the privacy-enhanced domain behind a click-to-load facade. No autoplay with sound; loops have a pause button.
- Every video has human-reviewed captions and a transcript; audio description where visuals carry meaning.
- Accessible lightbox: native `<dialog>`, focus management, Escape closes, arrows move, "Image 3 of 12" announced.
- PDFs: every PDF the site publishes is tagged and accessible, and the content also exists as an HTML page.

---

## 11. Accessibility (WCAG 2.2 AA, plus these)

- Body text 7:1 contrast (AAA). Targets 24px minimum, 48px for primary actions.
- **Cognitive accessibility:** plain language, one task per page in flows, help in the same place
  on every page, no time limits (or the user can extend them), progress saved, errors that say how
  to fix them, no CAPTCHA puzzles (Turnstile is invisible; a failure offers another route).
- **Reading settings** (stored in the browser only): larger text, extra letter and line spacing,
  reduce motion, high contrast. Available from the footer and the header menu, keyboard reachable.
- Works with Windows forced colors mode, 400% zoom (reflow at 320px), screen readers, voice
  control (visible labels match accessible names), switch access.
- Semantic landmarks, one H1 per page, skip link, visible focus (3:1, never removed).
- Forms: visible labels, hints with `aria-describedby`, error summary, focus to the first error,
  autocomplete attributes on personal fields.
- Captions, transcripts, audio description as in section 10. Sign language video for key pages if the
  community served includes Deaf people (Phase 0 decides; placeholder until filmed).
- Accessibility statement with known issues and a way to report problems that does not require an email account.
- Automated: axe on every page in both themes, high-contrast mode and every language, in CI.
  Manual before launch: VoiceOver (iOS, macOS), NVDA (Windows), TalkBack (Android) on home, Get help,
  Give, a program page, volunteer sign-up. If possible, a paid session with disabled testers from the community.

---

## 12. Performance, low bandwidth and offline

| Metric (throttled low-end Android, slow 4G) | Budget |
| --- | --- |
| Largest Contentful Paint (home, get help, give) | under 2.0 s |
| Cumulative Layout Shift | under 0.05 |
| Interaction to Next Paint | under 200 ms |
| JavaScript on first load (compressed) | under 100 KB |
| Get help page total weight | under 150 KB |
| Fonts | 4 faces, under 120 KB |
| Third-party requests before consent | 0 (Turnstile on form pages only) |

- Server-rendered pages; client JavaScript only where needed.
- **Progressive Web App:** installable, a service worker that caches the help contacts, program
  hours and addresses, and the last visited pages, and shows an offline page with them.
- **Lite mode:** respects `Save-Data` and offers "load images" buttons instead of auto-loading heavy media.
- Every core flow works without JavaScript (forms post to the server).

---

## 13. SEO and structured data

- Unique title and description per page from one `pageMetadata()` helper, canonical URLs, social cards.
- JSON-LD: `NGO` (or the closest type) with legal name, logo, address, `nonprofitStatus`,
  `taxID` only if the organization wants it in markup, `sameAs` socials; `Event` for events;
  `VolunteerAction` only if valid; `BreadcrumbList`; `FAQPage` only for real FAQs; `Article` for news.
- Sitemap (all languages with `hreflang`), robots.txt. Private pages (`/get-help/request`,
  proposals, admin, thank-you) are `noindex`.
- Every old URL redirects (Phase 0 map). No lost search traffic.
- Google Ad Grants (section 15.2) landing pages: Give, Volunteer, Programs, Get help, each fast and clear.

---

## 14. Security and privacy

- Security headers on every response: nonce CSP, HSTS, X-Content-Type-Options, Referrer-Policy
  `strict-origin-when-cross-origin`, Permissions-Policy (camera, mic, geolocation off), frame-ancestors `none`.
- Row Level Security on every table, tested with pgTAP. Staff checks happen in database functions
  that require a second factor; never trust a role column the client can write.
- Roles: admin, staff, help (can read help requests), volunteer coordinator, editor. Least access by default.
- Every staff write is audited (who, what, when), with sensitive text redacted in the audit log.
- Rate limits on every mutating route, same-origin checks, body size limits, uploads checked by
  magic bytes, size-limited, stripped of metadata and stored privately.
- Server-only secrets; never in `NEXT_PUBLIC_*`. The database service key only in server code.
- Analytics: Cloudflare Web Analytics (cookieless). Events only on Give and Volunteer funnels, never
  on Get help. No tracking pixels, no fingerprinting, no session recording, no ad retargeting.
- Data retention table in the privacy policy (help requests, volunteer records, RSVPs, contact
  messages, newsletter) and a data request route (see, correct, delete).
- Donor privacy: the donor privacy policy says the list is never sold, rented or traded.
- If the organization works on at-risk issues (human rights, journalism, civil society) and is
  attacked online, apply for Cloudflare Project Galileo (section 15.2).

---

## 15. Tech stack and free programs

### 15.1 Stack (decided, free plans)

| Need | Choice (free plan) | Limit to watch | First paid step, only if needed |
| --- | --- | --- | --- |
| Hosting | Cloudflare Workers with Next.js through the OpenNext Cloudflare adapter | 100k requests/day | Workers Paid ($5/mo) |
| Domain and DNS | Keep the current registrar unless moving is free and safe; Cloudflare DNS | none | the domain itself |
| Database, staff sign-in | Supabase Free, RLS everywhere, pgTAP | 500 MB, pauses after 7 days idle | Supabase Pro |
| Files and short video | Cloudflare R2 | 10 GB, free downloads | per GB above 10 GB |
| Content editing | Sanity Free (drafts private), with consent and source fields required | 10k documents, 20 editors | Sanity Growth |
| Long video | YouTube, privacy-enhanced, click to load | none | none |
| Email sending | Resend Free with the domain verified | 3,000/month, 100/day | Resend Pro, or a nonprofit-priced provider |
| Donations | Zeffy (section 8.1) | none for the nonprofit | Stripe nonprofit rate |
| Bot protection | Cloudflare Turnstile | none | none |
| Analytics | Cloudflare Web Analytics | none | none |
| Scheduled jobs (reminders, consent expiry, keep database active, backups) | GitHub Actions scheduled workflow | 2,000 min/month private repos | Cloudflare Cron Triggers |
| Uptime | UptimeRobot Free | 50 monitors | none |
| Errors | Sentry Free, personal data scrubbed, never on Get help payloads | 5,000 errors/month | none |
| Dependencies | Dependabot | none | none |

- **Not used:** Vercel Hobby (non-commercial only, and many nonprofits sell tickets or merchandise),
  Netlify Free (site pauses when credits run out), any paid analytics, any session recording tool.
- The daily job runs a small query so the free database never pauses.
- The admin dashboard shows usage against every free limit and emails admins at 80%.
- `docs/costs.md` lists every service, its free limit, usage and the first paid step.
- **Next.js** (App Router, latest stable), React, TypeScript strict, pnpm workspace; CSS with tokens
  as custom properties, no UI kit; Vitest, Playwright (Chromium, Firefox, WebKit), pgTAP.

Repository layout:

```
apps/web            Next.js site, /admin
apps/mobile         (Phase 7, only if needed) Expo app sharing packages
packages/tokens     colors, type, spacing -> CSS variables; contrast tests (AA and AAA)
packages/ui         components (Button, Field, Icon, Logo, Chart, Map, Dialog, QuickExit)
packages/content    Sanity schemas, typed queries
packages/i18n       strings per language, readability checks
supabase/           migrations, RLS, pgTAP
brand/              SVG masters (section 7)
scripts/            sync-brand, copy-check, readability, a11y and perf helpers
docs/               discovery, facts, decisions, operations, content-guide, placeholders, costs, accounts, self-audit
```

### 15.2 Free programs for nonprofits (apply in Phase 0 or 1; the builder checks current terms)

| Program | What it gives | Notes |
| --- | --- | --- |
| Google for Nonprofits | Google Workspace for Nonprofits; Ad Grants up to $10,000/month in search ads | Ad Grants has rules (click-through rate, quality); landing pages from section 13 |
| Canva for Nonprofits | Canva Pro features for a team | For social graphics; the site's SVG system stays in code |
| Cloudflare Project Galileo | Business-plan security for at-risk public interest groups | Only if eligible; applied through partner organizations |
| Apple Developer fee waiver | Free App Store membership | Only for free apps with no in-app purchases; needs EIN and D-U-N-S |
| Google Play | $25 one-time developer fee | Only if a native app is built |
| TechSoup and other donor programs | Discounted software | Checked when a paid need appears |
| GitHub, Microsoft, others | Nonprofit offers exist but are not verified here | Builder checks before relying on them |

Every account is applied for **by the organization, in its own name** (section 17.1).

---

## 16. Admin console (staff, passkeys or 2FA)

- Dashboard: new help requests (help role only), donations summary from the platform export or
  webhook (totals only), volunteer shifts filling, RSVPs, partner requests, free-plan usage, consent renewals due.
- Content stays in Sanity; operational data (help requests, shifts, RSVPs, partner requests,
  consent records, newsletter) lives in Supabase.
- Help requests: status (New, Contacted, In progress, Closed), assigned staff, notes, retention
  countdown. One-business-day reminder for New requests.
- Volunteers: shifts, capacity, sign-ups, hours, waivers accepted (version), export for reports.
- Partners: builder submissions, proposal pages, statuses (Proposal sent, Viewed, Accepted, Question asked, Declined).
- Numbers page: counts only, no personal data (help requests per month by program, volunteer hours,
  RSVPs, partner conversions, giving page visits to platform opens). Useful for grant reports.
- Every action audited. Non-staff get a 404 for every admin route.

---

## 17. Running it (owned, delivered, monitored)

### 17.1 The organization owns every account

- Every account is created by the organization with an organization email (ideally Google
  Workspace for Nonprofits), never a personal one and never the builder's. The builder works
  through invitations or tokens the organization creates.
- **Sign-in protection, two tiers:**
  - **Must have passkeys or 2FA:** domain registrar, Cloudflare, the main organization email,
    GitHub, Supabase, the donation platform, the site's admin console.
  - **Recommended:** Sanity, Resend, Sentry, UptimeRobot, YouTube, Canva.
  - Prefer passkeys (face or fingerprint) where offered; keep backup codes offline; at least two
    people from the organization have admin access to each critical account, so nobody leaving locks it out.
- `docs/accounts.md`: each service, purpose, owner email, who has admin, sign-in protection, which
  environment variables come from it, how to remove the builder's access.
- Secrets live in the hosting environment settings and a password manager (Bitwarden Free or the
  organization's), never in the repository or chat.

### 17.2 Email that lands in the inbox

Send from a subdomain through Resend with SPF, DKIM and DMARC (start `p=none`, then `p=quarantine`).
Do not change the organization's existing mail records except to add what is needed; test before
and after the DNS move (Phase 0 plan). Every email: plain-text part, real reply-to, no tracking pixels.

### 17.3 Monitoring, backups, maintenance

- UptimeRobot on home, `/give`, `/get-help` and a health endpoint; Sentry with scrubbing.
- Weekly encrypted database export to private R2, kept 8 weeks; restore drill before launch.
- `docs/maintenance.md`: weekly dependency updates; monthly free-plan check and consent expiry review;
  quarterly impact figures refresh (with sources), crisis numbers re-verified, accessibility suite re-run;
  yearly 990 and financials update.

---

## 18. Build phases (acceptance checks are automated where possible)

**Phase 0: Discovery** (section 4). *Accept:* as in section 4.

**Phase 1: Foundations.** Repo, CI, tokens with AA/AAA contrast tests, fonts self-hosted, SVG
pipeline, logo (real or temporary with swap procedure), primitives and icons, i18n scaffolding,
reading settings, `/styleguide` with every component and state in both themes, high contrast and
each language. `docs/accounts.md` started.
*Accept:* `/styleguide` passes axe in all modes; contrast tests pass; swapping test logo files
changes header, favicon and social images with no code edits; copy and readability checks run in CI.

**Phase 2: Core pages and migration.** Header with Quick exit (if help module), menu, footer, home,
programs, about, team, impact (text only), transparency, news, press, contact, search, legal drafts,
404/500/offline, metadata, social images, JSON-LD, sitemap, redirects, CSP and headers.
*Accept:* every crawled old URL returns a 301 to the right page or a deliberate 410; every page has a
unique title; axe clean everywhere; no horizontal scroll at 320px; budgets met on home; the new
site beats `docs/baseline.md` on every measure; every number on a page traces to `docs/facts.md`.

**Phase 3: Give and trust.** `/give` with the donation platform, other ways to give, thank-you with
the honest receipt, transparency data stories, fact sheet PDF.
*Accept:* no card field exists on the site; no platform script loads before the donor acts;
monthly is never pre-selected; the tip disclosure is shown; the "where the money goes" chart
matches the 990 figures exactly (unit test against the facts file); the fact sheet PDF is tagged.

**Phase 4: Take part.** Volunteer roles and shifts, events with RSVP and waitlist, newsletter
with double opt-in, partner builder and proposal pages (each only if its module is on).
*Accept:* 50 simultaneous sign-ups for a 10-person shift confirm exactly 10; a cancel frees the spot
and the first waitlisted person is offered it; waiver version is stored; under-13 data is refused;
unsubscribe works in one click; a partner logo without permission never renders.

**Phase 5: Get help and stories** (help module if on; stories always).
*Accept:* Quick exit works by click and double Escape and leaves no back-button return; the request
form works without JavaScript and on 2G; help request data is unreadable to any role but help
(pgTAP); nothing from Get help appears in analytics, logs or Sentry (test with a marker string);
offline mode shows help contacts; a story without a valid consent record never renders; a
withdrawal removes the story, its images and its social card within one scheduled run.

**Phase 6: Signature SVG and data stories** (section 7.5), map with table, generative pattern,
shareable impact cards, community review of illustrations recorded.
*Accept:* every chart has a takeaway, table, source, date and CSV; the map is fully keyboard operable
and has an equivalent table; forced colors mode keeps every chart readable; reduced motion shows
final states; values in charts match `docs/facts.md` (unit tests).

**Phase 7: App.** PWA install, offline caching, optional web push for volunteers and RSVPs (opt-in,
never for Get help). A native app (Expo, sharing packages) is built **only if** Phase 0 or usage shows
a need the PWA cannot meet; then apply for the store fee waivers (section 15.2).
*Accept:* installable on Android and iOS; offline page works in airplane mode; push permission is
asked only after a user action, with a concrete reason.

**Phase 8: Launch.** Real content swap, translations reviewed by people, screen reader and real
phone passes (a cheap Android and an iPhone), legal review, DNS move per `docs/launch-plan.md`
with email tested before and after, uptime and error monitoring live, backup restore drill, every
account confirmed in the organization's name with sign-in protection, `docs/costs.md` filled.
*Accept:* `docs/placeholders.md` empty (or each remaining item approved by the director in
writing); email still works after the DNS move; `docs/self-audit.md` marks every section of this
document met, partial or deferred with a reason.

---

## 19. Lessons from my previous builds (put these rules in `CLAUDE.md`)

From the RUN ME MY MONEY build and my studio site prompt:

1. **Decide early and write it down** in `docs/decisions.md`. Open questions caused rework; decided ones held.
2. **Automate the rules:** copy check (banned words, em dashes, emojis), readability check, SVG sync
   check, contrast tests. Symbols like © and ↗ count as emoji to some checkers: write "Copyright" and use an SVG icon.
3. **Contrast is tested, not eyeballed.** A brand green failed AA at 4.37:1 and needed a darker text variant.
4. **The browser's FileList is live.** Copy files (`Array.from(input.files)`) before any `await`.
5. **Server vs client code:** helpers in `'use client'` files cannot be called from the server; keep shared helpers in plain modules.
6. **SQL parameters can be shadowed by column names.** Name them distinctly and qualify them.
7. **Security lives in the database.** A rule that trusted a client-writable column let one person
   do a two-person action. Record approvals and consents as rows written by functions for the signed-in user.
8. **Never show success early.** Wait for the server; on failure keep what the person typed.
9. **Tests need isolation:** rate-limit tests sharing one IP flaked; give each test its own.
10. **Visual baselines change on purpose only;** look at the diff image first.
11. **Fix build warnings when they appear;** one dynamic path made the bundler trace the whole project.
12. **Placeholders must look like placeholders** and be listed, so nothing fake ships.
13. **Third parties come with paperwork:** CSP, consent category, privacy listing and operations
    inventory in the same change.
14. **Commit and push after every phase,** tests run, so nothing is lost between sessions.
15. **Free plans have catches:** Vercel Hobby is non-commercial; Netlify Free pauses sites;
    Supabase Free pauses idle projects; donation platforms funded by tips must disclose the tip.
16. **The build environment may block hosts** (government sites, hosting APIs). Say which host is
    blocked and how to allow it; never ask for tokens in chat; deployment needs the owner's tokens set
    as environment variables.
17. **Do not copy code from decompiled apps or other people's sites.** Learn the pattern, write your own,
    and refuse anything that fingerprints networks or devices.
18. **Outside data is shown with its source and date and never used to judge a person.**
19. **Sign-in protection where it matters,** passkeys first, two admins per critical account.
20. **Never break the organization's email** when moving DNS: copy every existing record first and test mail before and after.

---

## 20. Deliverables

- The site on Cloudflare (preview per branch, production on `main`) at $0/month plus the domain.
- `SPEC.md`, `CLAUDE.md`, and `docs/`: discovery, baseline, facts, decisions, placeholders,
  operations (env vars, deploy, third-party inventory), content-guide (alt text, consent, plain
  language, adding a story or program), costs, accounts, logo-swap, launch-plan, maintenance, self-audit.
- A one-page "How to run the site" guide for staff: publish a story with consent, update an impact
  figure with its source, add a volunteer shift, answer a help request, reply to a partner, read the
  numbers page, handle a consent withdrawal, where the data lives.
