-- SPEC.md section 7: tables.
-- Additions beyond the spec text are marked "ADDED" with the spec section that needs them.

create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  role public.role not null default 'member',
  display_name text,
  age_confirmed_at timestamptz,
  terms_accepted_at timestamptz,
  terms_version text,                                   -- ADDED (12): which terms were accepted
  banned_at timestamptz,
  ban_reason text,
  created_at timestamptz not null default now()
);

create table public.entities (                           -- a business / person / page
  id uuid primary key default gen_random_uuid(),
  slug text unique,
  display_name text not null,
  category public.category,
  city text,
  state text,
  is_public boolean not null default false,             -- only true after two-person approval
  approved_by uuid[] not null default '{}',
  approved_at timestamptz,
  reply_statement text,
  reply_updated_at timestamptz,
  claimed_by uuid references public.profiles,
  legal_hold boolean not null default false,            -- ADDED (10.8)
  created_at timestamptz not null default now()
);

create table public.entity_identifiers (
  id uuid primary key default gen_random_uuid(),
  entity_id uuid not null references public.entities on delete cascade,
  type public.ident_type not null,
  raw text not null,
  norm text not null,                                    -- normalized value (section 8)
  norm_loose text,                                       -- handle with trailing digits / separators removed
  source_report_id uuid,
  verified boolean not null default false,
  publish_full boolean not null default false,           -- ADDED (7, masking): legal-reviewed full display
  created_at timestamptz not null default now()
);
create index on public.entity_identifiers (type, norm);
create index on public.entity_identifiers using gin (norm extensions.gin_trgm_ops);
create index on public.entity_identifiers using gin (norm_loose extensions.gin_trgm_ops);
create index on public.entity_identifiers (entity_id);

create table public.entity_links (                       -- rebrand / alias graph
  a uuid references public.entities on delete cascade,
  b uuid references public.entities on delete cascade,
  reason text not null check (reason in ('shared_cashtag', 'shared_phone', 'same_flyer_phash', 'name_similarity', 'staff_manual')),
  confidence real not null check (confidence between 0 and 1),
  evidence jsonb,
  created_by uuid,
  confirmed_by uuid,                                     -- ADDED (8.4): links < 0.9 need staff confirmation
  confirmed_at timestamptz,                              -- ADDED (8.4)
  created_at timestamptz not null default now(),
  primary key (a, b, reason),
  check (a <> b)
);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  public_code text unique,                               -- RMMM-26-0412
  reporter_id uuid references public.profiles on delete set null, -- null when anonymous
  anon_claim_hash text,
  status public.report_status not null default 'draft',
  category public.category,
  story text check (char_length(story) <= 5000),
  story_tsv tsvector,
  amount_cents int check (amount_cents >= 0),
  currency char(3) not null default 'USD',
  paid_on date,
  rail public.pay_rail,
  was_deposit boolean,
  refund_requested boolean,
  refund_response text,
  city text,
  state text,
  consent_truth boolean not null default false,
  consent_terms boolean not null default false,
  consent_contact boolean not null default false,
  on_camera text check (on_camera in ('yes', 'voice_only', 'anonymous_only', 'no')),
  submitted_ip inet,                                     -- abuse prevention only, never public
  submitted_device text,
  public_excerpt text,                                   -- moderator-redacted excerpt shown publicly
  embedding extensions.vector(768),
  created_at timestamptz not null default now(),
  submitted_at timestamptz,
  reviewed_at timestamptz
);
create index on public.reports using gin (story_tsv);
create index on public.reports (reporter_id);
create index on public.reports (status);

create table public.report_entities (
  report_id uuid references public.reports on delete cascade,
  entity_id uuid references public.entities on delete cascade,
  primary key (report_id, entity_id)
);
create index on public.report_entities (entity_id);

create table public.media (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.reports on delete cascade,
  kind text check (kind in ('image', 'pdf', 'audio', 'video')),
  storage_path text not null,
  redacted_path text,
  sha256 text,
  phash bigint,
  ocr_text text,
  transcript text,
  extracted jsonb,
  scan_status text not null default 'pending',
  exif_stripped boolean not null default false,
  created_at timestamptz not null default now()
);
create index on public.media (phash);
create index on public.media (report_id);

create table public.cases (
  id uuid primary key default gen_random_uuid(),
  slug text unique,
  title text not null,
  entity_id uuid references public.entities,
  category public.category,
  city text,
  state text,
  status public.case_status not null default 'reported',
  summary text,
  legal_reviewed_at timestamptz,
  published boolean not null default false,
  legal_hold boolean not null default false,             -- ADDED (10.8)
  created_at timestamptz not null default now()
);

create table public.case_updates (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases on delete cascade,
  status public.case_status,
  body text not null,
  happened_on date not null,
  created_by uuid,
  created_at timestamptz not null default now()
);
create index on public.case_updates (case_id);

create table public.episodes (
  id uuid primary key default gen_random_uuid(),
  slug text unique,
  season int,
  number int,
  title text,
  kind text check (kind in ('episode', 'cold_open', 'teaser', 'bts')),
  mux_playback_id text,
  captions_url text,
  description text,
  publish_at timestamptz,
  published boolean not null default false
);

create table public.episode_cases (
  episode_id uuid references public.episodes on delete cascade,
  case_id uuid references public.cases on delete cascade,
  primary key (episode_id, case_id)
);

create table public.watchlist (
  user_id uuid references public.profiles on delete cascade,
  type public.ident_type,
  norm text,
  created_at timestamptz not null default now(),
  primary key (user_id, type, norm)
);

create table public.follows (
  user_id uuid references public.profiles on delete cascade,
  target_type text check (target_type in ('case', 'entity', 'series')),
  target_id uuid,
  primary key (user_id, target_type, target_id)
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles on delete cascade,
  kind text,
  payload jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index on public.notifications (user_id, created_at desc);

create table public.push_tokens (
  user_id uuid not null references public.profiles on delete cascade,
  token text primary key,
  platform text check (platform in ('ios', 'android', 'web'))
);

create table public.content_flags (                     -- 24h SLA
  id uuid primary key default gen_random_uuid(),
  target_type text,
  target_id uuid,
  reason text,
  details text,
  reporter_id uuid,
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolution text
);

create table public.user_blocks (
  blocker uuid references public.profiles on delete cascade,
  blocked uuid references public.profiles on delete cascade,
  primary key (blocker, blocked),
  check (blocker <> blocked)
);

create table public.disputes (
  id uuid primary key default gen_random_uuid(),
  entity_id uuid references public.entities,
  contact_email extensions.citext,
  body text,
  evidence_paths text[],
  status text not null default 'open',
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create table public.ip_bans (
  id uuid primary key default gen_random_uuid(),
  cidr cidr not null,
  reason text,
  expires_at timestamptz,
  created_by uuid,
  created_at timestamptz not null default now()
);
create index on public.ip_bans using gist (cidr inet_ops);

create table public.device_bans (
  device_hash text primary key,
  reason text,
  created_by uuid,
  created_at timestamptz not null default now()
);

create table public.consents_log (
  id bigserial primary key,
  user_id uuid,
  report_id uuid,
  consent text not null,
  value boolean not null,
  version text,
  created_at timestamptz not null default now()
);

create table public.deletion_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  contact extensions.citext,
  status text not null default 'open',
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table public.audit_log (
  id bigserial primary key,
  actor uuid,
  action text not null,
  target_type text,
  target_id uuid,
  meta jsonb,
  ip inet,
  created_at timestamptz not null default now()
);
create index on public.audit_log (target_type, target_id);
create index on public.audit_log (actor, created_at desc);

-- ADDED (9, 11): Postgres token bucket for the rate limiter. Service role only.
create table public.rate_limits (
  bucket text primary key,
  tokens double precision not null,
  updated_at timestamptz not null default now()
);
