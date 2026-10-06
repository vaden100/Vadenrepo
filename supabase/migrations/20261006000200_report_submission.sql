-- SPEC Phase 2: submit a story. Drafts (signed-in or anonymous), reported identifiers,
-- evidence uploads processed by the worker, case codes and anonymous claim codes.
-- All writes here go through the server (service role) after ownership checks; members
-- can read their own rows through RLS.

------------------------------------------------------------------------------
-- Reports: draft ownership, contact mode, automated check results
------------------------------------------------------------------------------

alter table public.reports
  add column if not exists draft_token_hash text,                       -- sha256 of the anonymous draft cookie token
  add column if not exists contact_mode text check (contact_mode in ('account', 'anonymous')),
  add column if not exists age_confirmed boolean not null default false,
  add column if not exists auto_flags jsonb not null default '{}'::jsonb, -- SPEC 10.1 automated checks
  add column if not exists step int not null default 1 check (step between 1 and 7);

-- Never copy draft tokens into the audit log.
create or replace function private.audit_redact_keys() returns text[]
language sql immutable set search_path = '' as $$
  select array['story', 'story_tsv', 'embedding', 'submitted_ip', 'submitted_device', 'anon_claim_hash',
               'draft_token_hash', 'ocr_text', 'transcript']
$$;

-- Same audit trigger, now reading the redaction list from audit_redact_keys().
create or replace function private.audit_write() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  mode text := coalesce(tg_argv[0], 'always');   -- 'always' | 'staff_only'
  old_row jsonb := case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) end;
  new_row jsonb := case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) end;
  row_data jsonb := coalesce(new_row, old_row);
  -- Never copy victim stories, vectors or abuse signals into the audit trail.
  redact text[] := private.audit_redact_keys();
  changes jsonb := '{}'::jsonb;
  k text;
  target uuid;
begin
  if mode = 'staff_only' and not private.is_staff() then
    return null;
  end if;

  if tg_op = 'UPDATE' then
    for k in select jsonb_object_keys(new_row) loop
      if k <> all (redact) and (old_row -> k) is distinct from (new_row -> k) then
        changes := changes || jsonb_build_object(k, jsonb_build_object('old', old_row -> k, 'new', new_row -> k));
      elsif k = any (redact) and (old_row -> k) is distinct from (new_row -> k) then
        changes := changes || jsonb_build_object(k, '"[redacted]"'::jsonb);
      end if;
    end loop;
    if changes = '{}'::jsonb then
      return null;
    end if;
  end if;

  begin
    target := (row_data ->> 'id')::uuid;
  exception when others then
    target := null;
  end;

  insert into public.audit_log (actor, action, target_type, target_id, meta, ip)
  values (
    auth.uid(),
    lower(tg_op),
    tg_table_name,
    target,
    case
      when tg_op = 'UPDATE' then jsonb_build_object('changes', changes)
      else jsonb_build_object('row', row_data - redact)
    end,
    private.request_ip()
  );
  return null;
end $$;

------------------------------------------------------------------------------
-- What the reporter told us about the business (step 2). Private: becomes
-- entity_identifiers only after moderator review (Phase 3).
------------------------------------------------------------------------------

create table public.report_identifiers (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.reports on delete cascade,
  field text not null check (field ~ '^[a-zA-Z]{1,20}$'),   -- form field it came from (cashtag, instagram...)
  type public.ident_type not null,
  raw text not null check (char_length(raw) between 1 and 300),
  norm text not null,
  norm_loose text,
  created_at timestamptz not null default now(),
  unique (report_id, field)
);
create index on public.report_identifiers (type, norm);
create index on public.report_identifiers (report_id);

alter table public.report_identifiers enable row level security;
create policy report_identifiers_read on public.report_identifiers for select to authenticated
  using (
    private.is_staff()
    or exists (select 1 from public.reports r where r.id = report_id and r.reporter_id = auth.uid())
  );
create policy report_identifiers_staff_write on public.report_identifiers for all to authenticated
  using (private.is_moderator()) with check (private.is_moderator());
create trigger audit_report_identifiers after insert or update or delete on public.report_identifiers
  for each row execute function private.audit_write('staff_only');

------------------------------------------------------------------------------
-- Media: upload lifecycle and processing results
------------------------------------------------------------------------------

alter table public.media
  add column if not exists mime text,
  add column if not exists bytes bigint check (bytes >= 0),
  add column if not exists duration_ms int,
  add column if not exists width int,
  add column if not exists height int,
  add column if not exists upload_status text not null default 'awaiting_upload'
    check (upload_status in ('awaiting_upload', 'uploaded', 'processing', 'ready', 'rejected', 'failed')),
  add column if not exists reject_reason text,
  add column if not exists dhash bigint,
  add column if not exists processed_at timestamptz,
  add column if not exists attempts int not null default 0,
  add column if not exists voice_note boolean not null default false,          -- recorded in the story step
  add column if not exists reporter_redacted boolean not null default false;   -- reporter blurred it before upload

alter table public.media drop constraint if exists media_scan_status_check;
alter table public.media add constraint media_scan_status_check
  check (scan_status in ('pending', 'clean', 'infected', 'unscanned', 'error'));
create index on public.media (upload_status, created_at);
create index on public.media (sha256);

------------------------------------------------------------------------------
-- Case codes: RMMM-26-0412 (year + running number)
------------------------------------------------------------------------------

create sequence if not exists public.report_code_seq start 1;
revoke all on sequence public.report_code_seq from anon, authenticated;

create or replace function public.next_report_code() returns text
language sql volatile security definer set search_path = '' as $$
  select 'RMMM-' || to_char(now() at time zone 'UTC', 'YY') || '-' ||
         lpad(nextval('public.report_code_seq')::text, 4, '0')
$$;
revoke all on function public.next_report_code() from public, anon, authenticated;
grant execute on function public.next_report_code() to service_role;

------------------------------------------------------------------------------
-- Worker job queue: claim uploaded media without double processing
------------------------------------------------------------------------------

create or replace function public.claim_media_jobs(batch int default 5)
returns setof public.media
language sql volatile security definer set search_path = '' as $$
  update public.media m
     set upload_status = 'processing', attempts = m.attempts + 1
   where m.id in (
     select id from public.media
      where upload_status = 'uploaded'
         -- Retry jobs stuck in processing (worker crash) after 10 minutes, at most 3 times.
         or (upload_status = 'processing' and processed_at is null and attempts < 3
             and created_at < now() - interval '10 minutes')
      order by created_at
      limit greatest(1, least(batch, 20))
      for update skip locked
   )
  returning m.*
$$;
revoke all on function public.claim_media_jobs(int) from public, anon, authenticated;
grant execute on function public.claim_media_jobs(int) to service_role;

-- After a submitted report's media are all processed, move it to triage (SPEC 10.1).
create or replace function public.advance_report_after_processing(report uuid) returns text
language plpgsql volatile security definer set search_path = '' as $$
declare
  pending int;
  current_status public.report_status;
begin
  select status into current_status from public.reports where id = report;
  if current_status is distinct from 'submitted' then
    return current_status::text;
  end if;
  select count(*) into pending from public.media
   where report_id = report and upload_status in ('awaiting_upload', 'uploaded', 'processing');
  if pending > 0 then
    return 'submitted';
  end if;
  update public.reports set status = 'triage' where id = report;
  return 'triage';
end $$;
revoke all on function public.advance_report_after_processing(uuid) from public, anon, authenticated;
grant execute on function public.advance_report_after_processing(uuid) to service_role;

------------------------------------------------------------------------------
-- Evidence storage bucket (Supabase only; skipped on plain Postgres test runs).
-- Private: no policies for anon/authenticated, so only the service role reads or writes.
------------------------------------------------------------------------------

do $$
begin
  if exists (select 1 from pg_namespace where nspname = 'storage')
     and exists (select 1 from pg_tables where schemaname = 'storage' and tablename = 'buckets') then
    insert into storage.buckets (id, name, public, file_size_limit)
    values ('evidence', 'evidence', false, 209715200)
    on conflict (id) do update set public = false;
  end if;
end $$;
