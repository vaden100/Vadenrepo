# RUN ME MY MONEY: App + Web Build Spec

A Vaden World product. Version 1.0 build spec for Claude Code.

**How to use this file:** put this folder at the root of a new repo, open Claude Code, and say:
"Read CLAUDE.md and SPEC.md, then build Phase 0." Build one phase at a time. Each phase ends with acceptance checks that must pass before the next one starts.

## 1. What we are building

RUN ME MY MONEY is a documentary series about scams and shady small businesses (deposit scams, no-shows, rebranded pages, credit repair hustles, forex "gurus", fake clout, money schemes). The app is the series' home base and its evidence room.

Four pillars:

1. **Submit a story.** Victims send their story with receipts (payment screenshots, DMs, texts, voice notes, flyers). Anonymous option. Goes to a private review queue.
2. **Scam Lookup (deep search).** Before you pay a deposit, search anything: a business name, @handle, Cash App $tag, Zelle email/phone, phone number, website, or upload a screenshot of their flyer. See reports, linked pages (rebrands), and a plain-language summary.
3. **Episode Hub.** Watch episodes, teasers and cold opens. Each episode links to its case.
4. **Case Tracker.** Public status for every featured case: Reported → Verifying → Contacted → Response / No response → Resolved (refunded) or Closed.

Platforms: iOS + Android app and a responsive website, sharing one backend.

### Product principles

- **Receipts over rumors.** Nothing about a business is public until evidence is reviewed by a human.
- **Victims stay protected.** No victim name, face, number, or payment handle is ever public unless they opt in, in writing.
- **"Alleged" until proven.** Public data uses factual, neutral language. The street voice lives in marketing and episodes, not in data fields.
- **Businesses get a right of reply.** Every public entity page has a response option and a dispute path.
- **Works at 3 AM on a cracked phone.** Fast, dark, readable, one-handed.

## 2. Research: what similar platforms do (and what we take)

| Platform | What they do well | What we adopt |
|---|---|---|
| BBB Scam Tracker | Search scams by URL, email, phone and more; guided questionnaire that categorizes reports; review and edit before submitting; share via social and email; browse similar scams | Universal search across identifiers; guided multi-step report; review screen before submit; share cards; "similar reports" |
| FTC ReportFraud (Consumer Sentinel) | Structured fields (payment method, amount lost, contact method) that roll up into national data | Structured money fields (amount, payment rail, date) so we can show totals and trends; we also link victims to file with the FTC and IC3 |
| ScamAdviser / ScamCheck | Trust signals with transparent sources ("where the score comes from") | No numeric "trust score" (defamation risk). Instead an evidence summary that shows exactly what matched and why |
| Apple App Store Guideline 1.2 (user-generated content) | Requires: terms with zero tolerance for objectionable content, content filtering, a way to report content, a way to block users, contact info, and acting on reports within 24 hours | All built into v1 or the app gets rejected |
| Section 230 (US) | Sites generally are not treated as publisher of content users submit | Keep user reports as user content (no rewriting meaning). Our own editorial (episodes, case write-ups) is ours and needs legal review before publishing |

Deep-search ideas no one in this space does well (our edge):

- **Rebrand linking.** "nailz" and "nailz2" share a Cash App tag, the same flyer image, and the same phone. We link them and show "Linked pages: 3."
- **Flyer check.** Upload a screenshot of a "BOOKS OPEN" flyer; we match it by image fingerprint and OCR'd text to flyers already reported.
- **Payment-tag lookup.** Cash App $tags, Zelle emails/phones, Venmo/PayPal handles are the most reliable identifier because scammers change names but reuse payment accounts.
- **Watchlist.** Paste a handle you're about to book with; get notified if a report comes in.

## 3. Roles

| Role | Can do |
|---|---|
| Visitor (no account) | Search, read public entity pages, watch episodes, read case tracker, start a report (finishes with email/phone verification or anonymous claim code) |
| Member | Everything above + track their own reports, watchlist, follow cases, notifications, block/report users |
| Reporter (member with submitted report) | Add evidence to their report, message the team inside the report thread, withdraw report, request deletion |
| Business rep | Claim an entity page (verification required), post a right-of-reply statement, open a dispute |
| Moderator | Triage queue, redact, request more evidence, approve/reject, link entities |
| Editor | Publish cases and episodes, case status updates |
| Admin | All of the above + bans (user, IP, device), settings, audit log, legal holds |

**Two-person rule:** publishing a new named entity publicly requires approval by two different staff (moderator + editor).

## 4. Features in detail

### 4.1 Submit a story (guided, 6 steps, save-as-you-go)

1. **What happened** (category picker): Deposit taken / no-show, Paid but never delivered, Bad service + no refund, Credit repair, Forex / trading / "investment", Fake giveaway / fake clout, Romance / catfish, Other.
2. **Who** (the business/person): name, @handles (IG, TikTok, FB, X), phone, website, city/state, and payment tags they used ($cashtag, Zelle email/phone, Venmo, PayPal, Apple Pay number). Live search runs as they type: "This might match a page already reported. Same one?"
3. **Money:** amount, currency, date paid, payment rail, was it a deposit, did they ask for a refund, refund response.
4. **Receipts:** upload images, screenshots, PDFs, voice notes (m4a/mp3), short video (≤60 s). Built-in redaction tool (draw black boxes; one-tap "blur faces" and "hide my name/number" suggestions from OCR). EXIF/GPS stripped on device before upload when possible and always on server.
5. **Your story:** free text (up to 5,000 chars) + optional 60-second voice note. Prompt copy: "Tell it like you'd tell your homegirl. What happened, when, and what they said."
6. **You + consent:** contact method (email or phone, verified with a one-time code) OR anonymous with a claim code; checkboxes (all unchecked by default, each required where marked):
   - [required] "Everything I shared is true to the best of my knowledge."
   - [required] "I agree to the Terms and Privacy Policy."
   - [optional] "Vaden World can contact me about being featured."
   - [optional] "I'm open to being on camera." / "Voice only." / "Anonymous only."
   - Review screen showing everything before submit (BBB pattern). Edit any step.

After submit: case number (e.g. RMMM-26-0412), what happens next, and links to file with the FTC (reportfraud.ftc.gov), IC3 (ic3.gov) for internet fraud, and a "how to dispute the payment" guide per payment rail.

### 4.2 Scam Lookup (deep search)

- One search bar that accepts anything. The input is classified automatically: phone, $cashtag, @handle, email, URL/domain, or free text name.
- Flyer / screenshot check: upload an image → OCR + image fingerprint → matches.
- Results page:
  - **Evidence summary card** for the best-matching entity: "Reported 6 times · 4 reviewed · $1,240 reported lost · Last report 3 days ago · Linked pages: 2." Never a score, never the word "scammer" in system copy.
  - **Why this matched** chips: "Same Cash App tag", "Same phone", "Same flyer image", "Name similar to".
  - **Linked pages** (rebrand graph) with the evidence for each link.
  - **Report list** (redacted excerpts, category, amount range, month/year, city).
  - Business right-of-reply statement if posted.
  - Actions: Watch this page, Share a warning card, I was scammed by them too (prefills report).
- No-results state: "No reports yet. That's not a guarantee." + the Before You Pay checklist (pay with a method that has buyer protection, never send "friends & family", ask for a contract, check if the page is new, reverse-search their photos).
- Public only shows approved entities. Unapproved matches return "Reports under review" without details.

### 4.3 Episode Hub

- Seasons → episodes → cold opens, teasers, behind-the-scenes. Streaming via Mux (HLS, captions required, thumbnails).
- Each episode page: description, linked case(s), "Got a story like this?" CTA.
- Follow series → push/email when a new episode drops.

### 4.4 Case Tracker

- Public case page: case title, category, city, status stamp, timeline of dated updates ("Sep 28: Reached out to the business. No response."), linked episode, total reported, entity link.
- Statuses (exact set): `reported`, `verifying`, `contacted`, `response_received`, `no_response`, `resolved_refunded`, `resolved_other`, `closed`.
- Follow case → notified on every update.

### 4.5 Extras every app like this should have

- Watchlist + alerts on handles/tags/phones.
- Share warning cards: generated image (story/post sizes) with the entity's public evidence summary and our wordmark; text stays factual.
- Resources: how to file with FTC/IC3/state AG, chargeback and payment-dispute guides per rail, how to spot a deposit scam, small claims basics. Clearly "not legal advice."
- Right of reply + disputes for businesses with a 7-day review SLA.
- Report content / block user on anything user-generated (Apple 1.2).
- Multi-language ready (EN first; strings in i18n files).
- Offline draft of a report on mobile.
- Admin analytics: reports per week, top categories, top cities, money reported lost, time-to-review.

## 5. Screens

### Mobile app (Expo Router tabs)

1. **Lookup (home):** search bar, flyer check button, recent public alerts, "Before You Pay" link.
2. **Episodes:** featured episode, season list, cold opens.
3. **Report** (center tab, red): starts the 6-step flow; resumes drafts.
4. **Cases:** tracker list with status stamps and filters.
5. **Me:** my reports (with thread), watchlist, followed cases, notifications, settings, legal, delete my data.

Plus: entity page, case page, episode player, report detail/thread, onboarding (terms + age gate), auth (email/phone OTP, passkeys later), share-card composer, resources.

### Website (Next.js)

Same public screens + SEO pages, `/report` flow, `/lookup?q=`, `/cases/[slug]`, `/episodes/[slug]`, `/entities/[slug]`, `/business` (claim + reply), `/legal/*`, and `/admin` (staff only).

### Admin console (web, staff only, 2FA required)

Queue (new → triage → needs evidence → ready for review → approved / rejected), report detail with evidence viewer + redaction editor, entity merge/link tool with graph view, case editor with timeline, episode CMS, disputes inbox, bans (user / IP / IP range / device), flagged content (24-hour SLA timer), audit log, settings.

## 6. Architecture

```
repo/
  apps/
    web/        Next.js (App Router, TypeScript, server components) public site + /admin
    mobile/     Expo (React Native, Expo Router, TypeScript)
    worker/     Node service: media pipeline (scan, strip, OCR, fingerprint, transcribe)
  packages/
    tokens/     design tokens (colors, type, spacing) exported to CSS vars + RN
    ui/         shared primitives (Stamp, ReceiptCard, CaseEnvelope, Skeleton)
    search-core/ identifier normalizers + classifier (shared by web, mobile, DB functions tests)
    api/        typed API client + zod schemas
  supabase/
    migrations/ SQL (schema, RLS, functions, indexes)
    functions/  edge functions (report submit, search, notify, share-card)
    seed.sql    fake demo data only
  brand/        SVG assets (provided)
```

- **Backend:** Supabase (Postgres, Auth, Storage, Row Level Security, Edge Functions). Extensions: pg_trgm, unaccent, fuzzystrmatch, pgvector, citext.
- **Media:** Supabase Storage private buckets; signed URLs only. Worker runs ClamAV (malware), strips EXIF/GPS, OCR (Google Cloud Vision or Tesseract), perceptual hash (pHash/dHash via sharp), audio transcription (Whisper-class model) for voice notes.
- **Video:** Mux (upload from admin, signed playback for unreleased, captions).
- **Bot protection:** Cloudflare Turnstile on report submit, search bursts, auth.
- **Email:** Postmark or Resend (transactional + digest) with one-click unsubscribe.
- **Push:** Expo Notifications (mobile), Web Push (web).
- **Hosting:** Vercel (web), Supabase cloud, Fly.io or Render (worker), EAS (mobile builds).
- **Observability:** Sentry (errors), privacy-friendly analytics (Plausible/PostHog with IP anonymization, no session replay on report flow).

## 7. Data model (Postgres)

```sql
create extension if not exists pg_trgm; create extension if not exists unaccent;
create extension if not exists fuzzystrmatch; create extension if not exists vector; create extension if not exists citext;

create type role as enum ('member','moderator','editor','admin','business');
create type report_status as enum ('draft','submitted','triage','needs_evidence','ready_for_review','approved','rejected','withdrawn');
create type case_status as enum ('reported','verifying','contacted','response_received','no_response','resolved_refunded','resolved_other','closed');
create type ident_type as enum ('name','handle_ig','handle_tiktok','handle_fb','handle_x','cashtag','zelle','venmo','paypal','phone','email','domain','url','address');
create type pay_rail as enum ('cashapp','zelle','venmo','paypal','apple_cash','card','bank','crypto','cash','other');
create type category as enum ('deposit_no_show','not_delivered','bad_service_no_refund','credit_repair','forex_trading','fake_giveaway_clout','romance_catfish','other');

create table profiles (
  id uuid primary key references auth.users on delete cascade,
  role role not null default 'member',
  display_name text, age_confirmed_at timestamptz, terms_accepted_at timestamptz,
  banned_at timestamptz, ban_reason text, created_at timestamptz default now()
);

create table entities (                      -- a business / person / page
  id uuid primary key default gen_random_uuid(),
  slug text unique, display_name text not null,
  category category, city text, state text,
  is_public boolean not null default false,   -- only true after two-person approval
  approved_by uuid[] default '{}', approved_at timestamptz,
  reply_statement text, reply_updated_at timestamptz,
  claimed_by uuid references profiles, created_at timestamptz default now()
);

create table entity_identifiers (
  id uuid primary key default gen_random_uuid(),
  entity_id uuid references entities on delete cascade,
  type ident_type not null, raw text not null,
  norm text not null,                          -- normalized value (see section 8)
  norm_loose text,                             -- handle with trailing digits / separators removed
  source_report_id uuid, verified boolean default false, created_at timestamptz default now()
);
create index on entity_identifiers (type, norm);
create index on entity_identifiers using gin (norm gin_trgm_ops);
create index on entity_identifiers using gin (norm_loose gin_trgm_ops);

create table entity_links (                  -- rebrand / alias graph
  a uuid references entities on delete cascade, b uuid references entities on delete cascade,
  reason text not null,                        -- 'shared_cashtag' | 'shared_phone' | 'same_flyer_phash' | 'name_similarity' | 'staff_manual'
  confidence real not null, evidence jsonb, created_by uuid, created_at timestamptz default now(),
  primary key (a, b, reason)
);

create table reports (
  id uuid primary key default gen_random_uuid(),
  public_code text unique,                     -- RMMM-26-0412
  reporter_id uuid references profiles,        -- null when anonymous
  anon_claim_hash text,                        -- hash of claim code for anonymous follow-up
  status report_status not null default 'draft',
  category category, story text, story_tsv tsvector,
  amount_cents int, currency char(3) default 'USD', paid_on date, rail pay_rail,
  was_deposit boolean, refund_requested boolean, refund_response text,
  city text, state text,
  consent_truth boolean not null default false, consent_terms boolean not null default false,
  consent_contact boolean not null default false, on_camera text check (on_camera in ('yes','voice_only','anonymous_only','no')),
  submitted_ip inet, submitted_device text,    -- abuse prevention only, never public
  public_excerpt text,                          -- moderator-redacted excerpt shown publicly
  embedding vector(768),                        -- for "similar stories"
  created_at timestamptz default now(), submitted_at timestamptz, reviewed_at timestamptz
);
create index on reports using gin (story_tsv);

create table report_entities (report_id uuid references reports on delete cascade, entity_id uuid references entities on delete cascade, primary key (report_id, entity_id));

create table media (
  id uuid primary key default gen_random_uuid(),
  report_id uuid references reports on delete cascade,
  kind text check (kind in ('image','pdf','audio','video')), storage_path text not null, redacted_path text,
  sha256 text, phash bigint, ocr_text text, transcript text, extracted jsonb,   -- extracted identifiers + amounts
  scan_status text default 'pending', exif_stripped boolean default false, created_at timestamptz default now()
);
create index on media (phash);

create table cases (
  id uuid primary key default gen_random_uuid(), slug text unique, title text not null,
  entity_id uuid references entities, category category, city text, state text,
  status case_status not null default 'reported', summary text, legal_reviewed_at timestamptz,
  published boolean default false, created_at timestamptz default now()
);
create table case_updates (id uuid primary key default gen_random_uuid(), case_id uuid references cases on delete cascade,
  status case_status, body text not null, happened_on date not null, created_by uuid, created_at timestamptz default now());

create table episodes (id uuid primary key default gen_random_uuid(), slug text unique, season int, number int, title text,
  kind text check (kind in ('episode','cold_open','teaser','bts')), mux_playback_id text, captions_url text,
  description text, publish_at timestamptz, published boolean default false);
create table episode_cases (episode_id uuid references episodes on delete cascade, case_id uuid references cases on delete cascade, primary key (episode_id, case_id));

create table watchlist (user_id uuid references profiles on delete cascade, type ident_type, norm text, created_at timestamptz default now(), primary key (user_id, type, norm));
create table follows (user_id uuid references profiles on delete cascade, target_type text, target_id uuid, primary key (user_id, target_type, target_id));
create table notifications (id uuid primary key default gen_random_uuid(), user_id uuid references profiles on delete cascade, kind text, payload jsonb, read_at timestamptz, created_at timestamptz default now());
create table push_tokens (user_id uuid references profiles on delete cascade, token text primary key, platform text);

create table content_flags (id uuid primary key default gen_random_uuid(), target_type text, target_id uuid, reason text, details text,
  reporter_id uuid, created_at timestamptz default now(), resolved_at timestamptz, resolution text);  -- 24h SLA
create table user_blocks (blocker uuid references profiles on delete cascade, blocked uuid references profiles on delete cascade, primary key (blocker, blocked));
create table disputes (id uuid primary key default gen_random_uuid(), entity_id uuid references entities, contact_email citext, body text,
  evidence_paths text[], status text default 'open', created_at timestamptz default now(), resolved_at timestamptz);

create table ip_bans (id uuid primary key default gen_random_uuid(), cidr cidr not null, reason text, expires_at timestamptz,
  created_by uuid, created_at timestamptz default now());
create index on ip_bans using gist (cidr inet_ops);
create table device_bans (device_hash text primary key, reason text, created_by uuid, created_at timestamptz default now());

create table consents_log (id bigserial primary key, user_id uuid, report_id uuid, consent text, value boolean, version text, created_at timestamptz default now());
create table deletion_requests (id uuid primary key default gen_random_uuid(), user_id uuid, contact citext, status text default 'open', created_at timestamptz default now(), completed_at timestamptz);
create table audit_log (id bigserial primary key, actor uuid, action text, target_type text, target_id uuid, meta jsonb, ip inet, created_at timestamptz default now());
```

**Row Level Security (must be on for every table):**

- Public (anon) can select only: entities where `is_public`, their entity_identifiers of public-safe types (names, handles, domains; never phones/emails/payment tags in full, see masking below), cases where `published`, case_updates of published cases, episodes where `published` and `publish_at <= now()`, and approved report `public_excerpt` via a view.
- Reporters can read/update only their own reports (or via claim-code edge function).
- Staff roles via `profiles.role`. All staff writes go through functions that insert into `audit_log`.

**Masking in public responses:** phones `(•••) •••-4417`, emails `t•••@gmail.com`, cashtags `$T•••Laces` unless staff mark that identifier verified and `publish_full = true` after legal review. Search still matches on the full normalized value server-side.

## 8. Deep search engine

### 8.1 Classify the query (`packages/search-core`)

| Input looks like | Type | Normalize to |
|---|---|---|
| `$` + letters | cashtag | lowercase, strip `$` and spaces |
| `@` + handle or IG/TikTok/FB/X URL | handle | lowercase, strip `@`, URL parts, trailing `.` `_`; `norm_loose` also strips trailing digits and separators (`nailz2` → `nailz`, `laced.by.tee_` → `lacedbytee`) |
| digits, 10+ | phone | E.164 via libphonenumber-js (default US) |
| contains `@` and a dot | email | lowercase, trim; Gmail: remove dots and +tags in local part |
| URL / domain | domain | registrable domain via tldts, lowercase, strip `www.` |
| anything else | name | unaccent, lowercase, collapse spaces, strip "llc", "inc", "studio", "by", emoji, punctuation |

### 8.2 Query plan (Postgres function `search_everything(q text)`)

1. Exact identifier hit: `entity_identifiers where type = $type and norm = $norm` → score 1.0.
2. Loose handle hit: `norm_loose = $loose` → 0.85 ("possible rebrand").
3. Fuzzy: trigram `similarity(norm, $norm) > 0.45` on names/handles, plus `levenshtein ≤ 2` for short strings → 0.4 to 0.8.
4. Full text on approved report stories (`story_tsv @@ websearch_to_tsquery`) → maps to entities, 0.3 to 0.6.
5. Semantic (optional, phase 6): `embedding <=> query_embedding` for "similar stories" only, never for naming an entity.
6. Graph expansion: for top entities, pull `entity_links` with confidence ≥ 0.7 and return them as "Linked pages."
7. Aggregate per entity: report counts (submitted vs approved), total amount (approved only), last report date, top categories, match reasons.
8. Return only public entities to non-staff; return a "reports under review" flag if a non-public entity matched.

### 8.3 Image search (flyer check)

- On upload: compute 64-bit pHash + dHash; OCR text; extract identifiers (regex for $cashtag, @handle, phones, emails, URLs, amounts like $50 deposit).
- Match: Hamming distance ≤ 10 on pHash against `media.phash` (BK-tree or bit-count index in worker; store candidates), plus identifiers from OCR run through 8.2.
- Response explains: "This flyer matches an image in 3 reports" + thumbnails (redacted versions only).

### 8.4 Entity resolution (rebrand linking)

Worker job runs on every newly approved report:

- Shared exact payment tag or phone between entities → link confidence 0.95.
- Same flyer/profile image (pHash distance ≤ 6) → 0.9.
- `norm_loose` handle equal → 0.75.
- Name trigram similarity ≥ 0.8 in the same city → 0.6 (suggestion only, staff confirms).
- Links < 0.9 are suggestions in the admin graph until a staff member confirms. Public pages only show confirmed links, each with its reason.

### 8.5 Performance targets

p95 search < 300 ms for text queries, < 3 s for image queries. Debounced live search (250 ms) during report step 2. Cache public entity summaries (materialized view refreshed on approve).

## 9. API (edge functions / route handlers, zod-validated)

| Method | Path | Notes |
|---|---|---|
| GET | `/api/search?q=` | Classify + search_everything; rate limited 30/min/IP; Turnstile after 60/hour |
| POST | `/api/search/image` | Multipart image → signed temp upload → worker → result (poll or stream) |
| POST | `/api/reports` | Create draft (anon allowed, returns draft token) |
| PATCH | `/api/reports/:id` | Save step |
| POST | `/api/reports/:id/media` | Returns signed upload URL; worker processes |
| POST | `/api/reports/:id/submit` | Validates consents, Turnstile, IP/device ban check, returns public_code (+ claim code if anonymous) |
| GET | `/api/reports/mine` | Member's reports + thread |
| POST | `/api/reports/claim` | Anonymous follow-up via claim code |
| GET | `/api/entities/:slug` | Public summary + reports excerpts + links + reply |
| POST | `/api/entities/:slug/reply` | Verified business rep only |
| POST | `/api/disputes` | Business dispute with evidence |
| GET | `/api/cases`, `/api/cases/:slug` | Public tracker |
| GET | `/api/episodes`, `/api/episodes/:slug` | Published only |
| POST / DELETE | `/api/watchlist` | Member |
| POST / DELETE | `/api/follow` | Member |
| POST | `/api/flags` | Report content (Apple 1.2) |
| POST | `/api/blocks` | Block user |
| POST | `/api/share-card` | Returns PNG for an entity or case (server-rendered with brand SVGs) |
| POST | `/api/privacy/delete` | Data deletion request |
| * | `/api/admin/*` | Staff only, 2FA, every write audited |

Every request passes middleware: IP ban check (CIDR), device ban check, rate limiter (Upstash Redis or Postgres token bucket), auth/role check.

## 10. Moderation and publishing rules

1. New report → automated checks (malware, duplicate media hash, profanity/slur filter, banned IP/device) → triage.
2. Moderator verifies: payment evidence present? identifiers consistent across screenshots? story consistent? Can request more evidence (`needs_evidence`, reporter notified).
3. Moderator writes a redacted public excerpt (quote the reporter's words, remove PII, never add claims). Redaction editor for media.
4. First public appearance of an entity needs two staff approvals.
5. Public entity page shows minimum threshold: at least 2 approved independent reports or 1 approved report + staff-verified payment evidence.
6. Disputes: business can submit counter-evidence; staff review within 7 days; outcome logged; content can be updated, annotated ("Business response"), or removed.
7. Flagged content: 24-hour response SLA with a visible timer in admin; repeat abusers banned (user + IP + device).
8. Legal hold flag on any entity/case under threat of litigation (freezes edits/deletes, keeps evidence).

## 11. Security and abuse

- **IP ban feature (required):** ban single IPs or CIDR ranges with reason and expiry; checked in middleware on every request; admin UI with search, bulk add, and "ban this reporter's IP" shortcut from any report or flag. Pair with device bans (hashed install ID on mobile, fingerprint cookie on web) and account bans.
- Rate limits on search, submit, auth, uploads; Turnstile on submit and auth.
- RLS everywhere; service-role key only in worker and server functions.
- Private storage buckets, signed URLs (5-minute expiry), originals never public, redacted copies only.
- EXIF/GPS stripping, ClamAV scanning, file type sniffing (not extension), size limits (images 15 MB, audio 20 MB, video 200 MB).
- Staff accounts: mandatory 2FA (TOTP/passkey), session timeout, IP allowlist option for admin.
- Audit log for every staff action; immutable (insert-only policy).
- Secrets in environment variables only; dependency audit in CI; CSP, HSTS, X-Frame-Options, Referrer-Policy headers.
- Backups: daily, point-in-time recovery enabled; evidence retention policy documented.
- Victim safety: never send email/SMS that reveals report content in the preview text; "quick exit" button on the report flow (web).

## 12. Legal and compliance checklist (ship-blocking)

- [ ] Privacy Policy (what we collect, why, retention, sharing, rights, contact).
- [ ] Terms of Service, including zero tolerance for objectionable content and abusive users (Apple 1.2), truthfulness of reports, license to use submissions, right of reply.
- [ ] Refund Policy (needed if anything is ever sold: merch, memberships, donations).
- [ ] Cookie Policy + cookie consent banner (reject as easy as accept; no non-essential cookies before consent).
- [ ] Form consents: required ones are explicit, all checkboxes start unchecked, consent version stored in consents_log.
- [ ] No unnecessary data collection (no contacts, no precise location, no ad SDKs).
- [ ] Audit every third-party SDK (list in /legal/subprocessors).
- [ ] No dark patterns (no forced account to search, no confirm-shaming, easy unsubscribe, easy delete).
- [ ] No hidden fees.
- [ ] No fake reviews or fake reports; seed data is clearly fake and never shipped to production.
- [ ] No unsupported claims: system copy says "reported", "alleged", "under review"; never "scammer" or "fraud" as a statement of fact about a named party.
- [ ] Accessibility: alt text on all images (staff must add alt to redacted evidence), WCAG AA contrast, full keyboard navigation, screen-reader labels, captions on all video.
- [ ] Business details in footer and app (legal name of Vaden Media Solutions, contact, address or registered agent).
- [ ] Age gate: 18+ to submit reports or create accounts (story content is mature); no data knowingly collected from under-13s (COPPA).
- [ ] Unsubscribe link in every marketing email; one-click.
- [ ] Licensed fonts and images (fonts in this spec are SIL OFL; brand SVGs are original).
- [ ] Data deletion requests: in-app and web form; completed within 30 days; logged.
- [ ] Defamation review: lawyer reviews ToS, publishing rules, dispute process, and every editorial case page before it goes public.
- [ ] DMCA designated agent registered; takedown form.
- [ ] App Store: reporting, blocking, filtering, contact info, 24-hour action, demo account for review.

## 13. Design system

**Concept:** the evidence room. Dark table, receipts, manila case envelopes, rubber stamps. Gritty and serious, never neon.

### Colors (tokens)

| Token | Hex | Use |
|---|---|---|
| ink | `#111111` | App background (dark mode default) |
| graphite | `#2A2A2A` | Raised surfaces, cards |
| smoke | `#3A3A38` | Borders, dividers |
| paper | `#F2EEE6` | Receipt surfaces, light mode background (never pure white) |
| paper-ink | `#1C1B19` | Text on paper |
| mute | `#8A8A85` | Secondary text |
| stamp-red | `#C8202B` | Primary action, alerts, "alleged" stamps |
| caution | `#F5C518` | Highlights (marker), focus ring, title accents |
| manila | `#CFA86A` | Case envelopes |
| status-verifying | `#B8860B` | Status |
| status-contacted | `#2E5E8C` | Status |
| status-resolved | `#2F7D4A` | Status |
| status-closed | `#5A5A57` | Status |

Contrast: all text pairs must pass WCAG AA (check paper on ink, mute on ink at ≥ 16 px only).

### Type (SIL OFL, self-hosted)

- Headlines: **Archivo** (ExtraBold/Black, condensed widths for big titles).
- Body/UI: **IBM Plex Sans**.
- Data, case numbers, receipts, timestamps: **IBM Plex Mono**.
- The logo wordmark is outlined artwork (`brand/wordmark-*.svg`), not live text.

### Shape and motion

- Corner radius 2 px (receipts and envelopes are square-cornered paper). No drop shadows; depth comes from surface color.
- No gradients, no glass effects, no hover animations, no animated arrows, no emojis in UI.
- Motion only where it carries meaning: stamp "slam" (scale 1.15 → 1, 120 ms) when a status changes, receipt slide-in for new evidence, 150 ms fades. Respect `prefers-reduced-motion`.
- Skeleton loaders on every async list and card (receipt-shaped skeletons).

### Signature components (`packages/ui`)

- **Stamp** (status, alleged, verified) using `brand/stamp-*.svg` style; text is real text with the rough SVG filter, so it stays accessible.
- **ReceiptCard:** paper background, zigzag bottom edge (`brand/receipt-edge.svg`), mono type.
- **CaseEnvelope:** manila card with case number tab and clasp (`brand/empty-case-envelope.svg` for empty states).
- **EvidenceSummary**, **WhyMatched** chips, **LinkedPages** graph (simple node list on mobile).
- **MarkerHighlight** (yellow swipe) for the key line in an excerpt.
- **Icons:** custom set in `brand/icons/` (24 px grid, 2 px stroke, square caps). Do not substitute a stock icon library.

### Brand assets provided (`brand/`)

`wordmark-dark.svg`, `wordmark-light.svg`, `wordmark-transparent.svg`, `app-icon.svg` (1024, export to all iOS/Android sizes via EAS), `stamp-{reported,verifying,contacted,resolved,closed,alleged,verified,no-refunds,run-me-my-money}.svg`, `empty-case-envelope.svg`, `receipt-edge.svg`, `icons/{lookup,receipt,case,stamp,submit,play,notify,flag,block,verified,evidence,voice-note,activity,linked-pages}.svg`.

## 14. Voice and copy

- **Marketing and episodes:** ATL street voice, real, low-key. "Got a story? Hit my DM." "They thought nobody was watching."
- **Product UI:** short, plain, kind. "Tell it like you'd tell your homegirl." "No reports yet. That's not a guarantee."
- **Data about named parties:** neutral and factual only. "6 reports, 4 reviewed." "Reported for: deposit taken, no-show." Never "scammer."
- No em dashes in UI copy. No emojis in UI.

## 15. Notifications

| Trigger | To | Channel |
|---|---|---|
| Report status change / staff message | Reporter | Push + email (no story text in preview) |
| New report on a watched identifier | Watcher | Push + email |
| Case update | Followers | Push |
| New episode | Series followers | Push + email digest |
| Flag resolved | Flagger | In-app |
| Dispute update | Business rep | Email |

## 16. Build phases (Claude Code: one at a time)

**Phase 0: Repo + foundations.** Monorepo, TypeScript strict, lint/format, CI, env templates, tokens package from section 13, brand assets wired, fonts self-hosted, legal page stubs.
*Accept:* `pnpm build` passes for web and mobile; tokens render correctly in a `/styleguide` page showing every component state, including skeletons.

**Phase 1: Database + auth + security core.** Migrations from section 7, RLS policies, roles, OTP auth, age gate + terms acceptance, IP/device ban middleware, rate limiter, audit log.
*Accept:* SQL tests prove anon cannot read private tables; banned IP gets 403 on every route; staff writes create audit rows.

**Phase 2: Submit a story.** 6-step flow (web + mobile), drafts, uploads with signed URLs, worker (scan, EXIF strip, OCR, pHash, transcription), redaction tool, consents log, confirmation with case code + FTC/IC3 links.
*Accept:* E2E test submits an anonymous report with 2 images + voice note; EXIF removed; claim code works; consent rows stored.

**Phase 3: Admin console.** Queue, report review, redaction, entity create/merge/link graph, two-person approval, flags with 24-hour timer, bans UI, disputes inbox.
*Accept:* An entity cannot become public with one approval; flag timer visible; ban from a report blocks that IP immediately.

**Phase 4: Deep search.** search-core normalizers (unit tests for every row in 8.1), search_everything, image search, entity resolution jobs, public entity page with evidence summary, why-matched, linked pages, masking, right of reply.
*Accept:* Test fixtures: nailz and nailz2 sharing a cashtag are linked with reason shown; phone in 4 formats resolves to one entity; non-public entity returns "under review" only; p95 < 300 ms on 100k fake identifiers.

**Phase 5: Cases + episodes.** Case tracker with timeline and stamps, Mux episodes with captions, episode-case links, follows.
*Accept:* Status change posts a timeline entry, slams the stamp, and notifies followers.

**Phase 6: Notifications, watchlist, share cards, resources.** Push/email, watchlist alerts, share-card PNG generator, resources pages, semantic "similar stories."
*Accept:* Adding a report with a watched cashtag notifies the watcher within 1 minute.

**Phase 7: Mobile polish + store readiness.** App icons/splash from brand/, deep links, offline drafts, Apple 1.2 checklist, demo account, privacy nutrition labels, Android data safety form.
*Accept:* Store checklist in section 12 fully ticked.

**Phase 8: Hardening + launch.** Load test, pen-test checklist, backup restore drill, accessibility audit (axe + manual screen reader pass), lawyer sign-off.

## 17. Testing

- **Unit:** normalizers, classifiers, masking, consent validation.
- **DB:** RLS tests (pgTAP), search ranking fixtures.
- **E2E:** Playwright (web), Maestro or Detox (mobile): report flow, search, admin approve, ban, deletion request.
- **Accessibility:** axe in CI on every public page.
- **Seed data:** obviously fake names (`****.demo`), never real businesses.

## 18. Environment variables

`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (server/worker only), `TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET`, `MUX_TOKEN_ID`, `MUX_TOKEN_SECRET`, `POSTMARK_TOKEN` (or `RESEND_API_KEY`), `EXPO_ACCESS_TOKEN`, `VISION_API_KEY` (if Google OCR), `TRANSCRIBE_API_KEY`, `UPSTASH_REDIS_URL`, `UPSTASH_REDIS_TOKEN`, `SENTRY_DSN`, `ANALYTICS_KEY`.

## 19. Launch checklist

- [ ] Section 12 complete and lawyer-reviewed.
- [ ] 10+ approved, consented cases ready so Lookup isn't empty on day one.
- [ ] Staff trained on moderation rules (section 10) and redaction.
- [ ] Response playbook for legal threats (legal hold, counsel contact).
- [ ] Store listings, screenshots, privacy labels.
- [ ] Episode 1 cold open live in the Episode Hub, linked to its case.
