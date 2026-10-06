-- SPEC Phase 3: admin console. Approvals that cannot be forged, moderation fields on
-- reports, flag and dispute deadlines, entity merge, and "ban this report's source".
-- Staff act with their own JWT (aal2), so RLS and the audit trigger see who did what.

------------------------------------------------------------------------------
-- Two-person rule, hardened (SPEC 3, 10.4)
--
-- Before: the guard trusted entities.approved_by, a column any moderator could write, so
-- one person could list someone else's id and publish alone. Now each approval is a row
-- written only by approve_entity() for the caller (auth.uid()), and the guard counts rows.
------------------------------------------------------------------------------

create table public.entity_approvals (
  entity_id uuid not null references public.entities on delete cascade,
  staff_id uuid not null references public.profiles on delete cascade,
  role public.role not null,
  created_at timestamptz not null default now(),
  primary key (entity_id, staff_id)
);
alter table public.entity_approvals enable row level security;
create policy entity_approvals_staff_read on public.entity_approvals for select to authenticated
  using (private.is_staff());
-- No insert/update/delete policies: only approve_entity()/withdraw_entity_approval() write.
create trigger audit_entity_approvals after insert or update or delete on public.entity_approvals
  for each row execute function private.audit_write('always');

create or replace function private.entities_publish_guard() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  n_distinct int;
  has_mod boolean;
  has_editor boolean;
begin
  -- No JWT at all = migrations, seed and test fixtures run by the database owner.
  if (auth.jwt() ->> 'role') is null then
    return new;
  end if;

  -- approved_by mirrors entity_approvals for display; only the approval functions set it.
  if tg_op = 'UPDATE' and new.approved_by is distinct from old.approved_by
     and coalesce(current_setting('rmmm.approval_write', true), '') <> 'on' then
    raise exception 'approvals are recorded with approve_entity()' using errcode = 'insufficient_privilege';
  end if;
  if tg_op = 'INSERT' and new.approved_by <> '{}' then
    raise exception 'approvals are recorded with approve_entity()' using errcode = 'insufficient_privilege';
  end if;

  if not new.is_public or (tg_op = 'UPDATE' and old.is_public) then
    return new;
  end if;

  -- Count approvals by people who still hold a qualifying role and are not banned.
  select count(distinct a.staff_id),
         bool_or(p.role in ('moderator', 'admin')),
         bool_or(p.role in ('editor', 'admin'))
    into n_distinct, has_mod, has_editor
    from public.entity_approvals a
    join public.profiles p on p.id = a.staff_id and p.banned_at is null
   where a.entity_id = new.id and p.role in ('moderator', 'editor', 'admin');

  -- One admin cannot fill both roles alone: with two people, at least one moderator-capable
  -- and one editor-capable approver must be different people.
  if n_distinct < 2 or not coalesce(has_mod, false) or not coalesce(has_editor, false) then
    raise exception 'two-person rule: needs approval from a moderator and an editor (two different people)'
      using errcode = 'check_violation';
  end if;
  new.approved_at := coalesce(new.approved_at, now());
  return new;
end $$;

create or replace function public.approve_entity(entity uuid) returns int
language plpgsql security definer set search_path = '' as $$
declare
  r public.role := private.current_role();
  n int;
begin
  if not (private.is_moderator() or private.is_editor()) then
    raise exception 'staff only' using errcode = 'insufficient_privilege';
  end if;
  if exists (select 1 from public.entities e where e.id = entity and e.legal_hold) then
    raise exception 'entity is under legal hold' using errcode = 'insufficient_privilege';
  end if;
  insert into public.entity_approvals (entity_id, staff_id, role)
  values (entity, auth.uid(), r)
  on conflict (entity_id, staff_id) do nothing;

  perform set_config('rmmm.approval_write', 'on', true);
  update public.entities e
     set approved_by = array(select a.staff_id from public.entity_approvals a where a.entity_id = entity order by a.created_at)
   where e.id = entity;
  perform set_config('rmmm.approval_write', 'off', true);

  select count(*) into n from public.entity_approvals where entity_id = entity;
  return n;
end $$;

create or replace function public.withdraw_entity_approval(entity uuid) returns int
language plpgsql security definer set search_path = '' as $$
declare
  n int;
begin
  if not private.is_staff() then
    raise exception 'staff only' using errcode = 'insufficient_privilege';
  end if;
  if exists (select 1 from public.entities e where e.id = entity and (e.is_public or e.legal_hold)) then
    raise exception 'unpublish first' using errcode = 'insufficient_privilege';
  end if;
  delete from public.entity_approvals where entity_id = entity and staff_id = auth.uid();
  perform set_config('rmmm.approval_write', 'on', true);
  update public.entities e
     set approved_by = array(select a.staff_id from public.entity_approvals a where a.entity_id = entity order by a.created_at)
   where e.id = entity;
  perform set_config('rmmm.approval_write', 'off', true);
  select count(*) into n from public.entity_approvals where entity_id = entity;
  return n;
end $$;

revoke all on function public.approve_entity(uuid), public.withdraw_entity_approval(uuid) from public, anon;
grant execute on function public.approve_entity(uuid), public.withdraw_entity_approval(uuid) to authenticated;

-- Unpublishing clears approvals, so republishing needs two fresh ones.
create or replace function private.entities_unpublish_reset() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if old.is_public and not new.is_public then
    delete from public.entity_approvals where entity_id = new.id;
    new.approved_by := '{}';
    new.approved_at := null;
  end if;
  return new;
end $$;
create trigger entities_unpublish_reset before update on public.entities
  for each row execute function private.entities_unpublish_reset();

------------------------------------------------------------------------------
-- Reports: moderation fields (SPEC 10.2, 10.3)
------------------------------------------------------------------------------

alter table public.reports
  add column if not exists evidence_request text check (char_length(evidence_request) <= 1000), -- shown to the reporter
  add column if not exists staff_note text check (char_length(staff_note) <= 4000),             -- internal only
  add column if not exists rejected_reason text check (rejected_reason in
    ('not_enough_evidence', 'duplicate', 'not_a_scam_report', 'abusive', 'spam', 'withdrawn_by_reporter', 'other')),
  add column if not exists reviewed_by uuid references public.profiles on delete set null;

-- Staff transitions follow the queue (SPEC 5 admin): new -> triage -> needs evidence ->
-- ready for review -> approved / rejected. Approval needs a public excerpt.
create or replace function private.reports_guard() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  new.story_tsv := to_tsvector('english'::regconfig, coalesce(new.story, ''));

  if auth.role() = 'service_role' or auth.uid() is null then
    return new;
  end if;

  if private.is_staff() then
    if tg_op = 'UPDATE' and new.status is distinct from old.status then
      if new.status = 'approved' and coalesce(btrim(new.public_excerpt), '') = '' then
        raise exception 'write the public excerpt before approving' using errcode = 'check_violation';
      end if;
      if new.status = 'rejected' and new.rejected_reason is null then
        raise exception 'pick a reason before rejecting' using errcode = 'check_violation';
      end if;
      if new.status = 'needs_evidence' and coalesce(btrim(new.evidence_request), '') = '' then
        raise exception 'say what evidence is needed' using errcode = 'check_violation';
      end if;
      if new.status in ('approved', 'rejected') then
        new.reviewed_at := now();
        new.reviewed_by := auth.uid();
      end if;
    end if;
    -- Staff never rewrite what the reporter said or where it came from.
    if tg_op = 'UPDATE' and (
         new.story is distinct from old.story
      or new.reporter_id is distinct from old.reporter_id
      or new.submitted_ip is distinct from old.submitted_ip
      or new.submitted_device is distinct from old.submitted_device
      or new.anon_claim_hash is distinct from old.anon_claim_hash
      or new.public_code is distinct from old.public_code) then
      raise exception 'reporter content is read-only for staff' using errcode = 'insufficient_privilege';
    end if;
    return new;
  end if;

  if tg_op = 'INSERT' then
    if new.status <> 'draft' or new.public_excerpt is not null or new.reviewed_at is not null
       or new.public_code is not null or new.submitted_ip is not null or new.embedding is not null
       or new.evidence_request is not null or new.staff_note is not null or new.rejected_reason is not null
       or new.reviewed_by is not null then
      raise exception 'reporters can only create drafts' using errcode = 'insufficient_privilege';
    end if;
    return new;
  end if;

  if new.reporter_id is distinct from old.reporter_id
     or new.public_excerpt is distinct from old.public_excerpt
     or new.reviewed_at is distinct from old.reviewed_at
     or new.public_code is distinct from old.public_code
     or new.submitted_ip is distinct from old.submitted_ip
     or new.submitted_device is distinct from old.submitted_device
     or new.embedding::text is distinct from old.embedding::text
     or new.anon_claim_hash is distinct from old.anon_claim_hash
     or new.evidence_request is distinct from old.evidence_request
     or new.staff_note is distinct from old.staff_note
     or new.rejected_reason is distinct from old.rejected_reason
     or new.reviewed_by is distinct from old.reviewed_by
     or new.auto_flags is distinct from old.auto_flags then
    raise exception 'protected report columns' using errcode = 'insufficient_privilege';
  end if;
  if new.status is distinct from old.status and new.status not in ('withdrawn') then
    raise exception 'reporters can only withdraw' using errcode = 'insufficient_privilege';
  end if;
  return new;
end $$;

-- Staff never see the raw IP or device hash through the API; they see whether one exists.
revoke select (submitted_ip, submitted_device, anon_claim_hash, draft_token_hash, embedding)
  on public.reports from authenticated;
-- Column privileges only bite when the table-level grant is replaced by column grants.
do $$
declare
  cols text;
begin
  select string_agg(quote_ident(column_name), ', ' order by ordinal_position) into cols
    from information_schema.columns
   where table_schema = 'public' and table_name = 'reports'
     and column_name not in ('submitted_ip', 'submitted_device', 'anon_claim_hash', 'draft_token_hash', 'embedding');
  execute 'revoke select on public.reports from authenticated';
  execute format('grant select (%s) on public.reports to authenticated', cols);
end $$;

create or replace function public.report_source_known(report uuid) returns jsonb
language sql stable security definer set search_path = '' as $$
  select case when private.is_staff() then
    jsonb_build_object('ip', r.submitted_ip is not null, 'device', r.submitted_device is not null)
  end
  from public.reports r where r.id = report
$$;
revoke all on function public.report_source_known(uuid) from public, anon;
grant execute on function public.report_source_known(uuid) to authenticated;

------------------------------------------------------------------------------
-- "Ban this reporter's source" (SPEC 11): IP (exact address) + device, admin only.
-- The raw IP never leaves the database.
------------------------------------------------------------------------------

create or replace function public.ban_report_source(report uuid, reason text, days int default null)
returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  ip inet;
  dev text;
  added_ip boolean := false;
  added_dev boolean := false;
begin
  if not private.is_admin() then
    raise exception 'admins only' using errcode = 'insufficient_privilege';
  end if;
  if coalesce(btrim(reason), '') = '' then
    raise exception 'a reason is required' using errcode = 'check_violation';
  end if;
  select r.submitted_ip, r.submitted_device into ip, dev from public.reports r where r.id = report;
  if ip is not null and not exists (select 1 from public.ip_bans b where b.cidr = set_masklen(ip, case when family(ip) = 4 then 32 else 128 end)::cidr) then
    insert into public.ip_bans (cidr, reason, expires_at, created_by)
    values (set_masklen(ip, case when family(ip) = 4 then 32 else 128 end)::cidr, reason,
            case when days is null then null else now() + make_interval(days => days) end, auth.uid());
    added_ip := true;
  end if;
  if dev is not null then
    insert into public.device_bans (device_hash, reason, created_by)
    values (dev, reason, auth.uid())
    on conflict (device_hash) do nothing;
    added_dev := found;
  end if;
  return jsonb_build_object('ip', added_ip, 'device', added_dev, 'ipKnown', ip is not null, 'deviceKnown', dev is not null);
end $$;
revoke all on function public.ban_report_source(uuid, text, int) from public, anon;
grant execute on function public.ban_report_source(uuid, text, int) to authenticated;

------------------------------------------------------------------------------
-- Flags: 24-hour SLA (SPEC 10.7)
------------------------------------------------------------------------------

alter table public.content_flags
  add column if not exists due_at timestamptz,
  add column if not exists resolved_by uuid references public.profiles on delete set null,
  add column if not exists action text check (action in ('removed', 'edited', 'no_action', 'banned_user'));
update public.content_flags set due_at = created_at + interval '24 hours' where due_at is null;
alter table public.content_flags
  alter column due_at set default (now() + interval '24 hours'),
  alter column due_at set not null;
alter table public.content_flags drop constraint if exists content_flags_target_type_check;
alter table public.content_flags add constraint content_flags_target_type_check
  check (target_type in ('entity', 'report', 'case', 'case_update', 'episode', 'reply', 'user'));
alter table public.content_flags drop constraint if exists content_flags_reason_check;
alter table public.content_flags add constraint content_flags_reason_check
  check (reason in ('inaccurate', 'personal_info', 'harassment', 'hate', 'spam', 'legal', 'other'));
alter table public.content_flags add constraint content_flags_details_len check (char_length(details) <= 2000);
create index if not exists content_flags_open on public.content_flags (due_at) where resolved_at is null;

-- Members cannot set the clock or the outcome.
create or replace function private.flags_guard() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    new.due_at := new.created_at + interval '24 hours';
    if not private.is_staff() then
      new.resolved_at := null;
      new.resolved_by := null;
      new.action := null;
      new.resolution := null;
    end if;
    return new;
  end if;
  new.due_at := old.due_at;
  if new.resolved_at is not null and old.resolved_at is null then
    new.resolved_by := auth.uid();
  end if;
  return new;
end $$;
create trigger flags_guard before insert or update on public.content_flags
  for each row execute function private.flags_guard();

------------------------------------------------------------------------------
-- Disputes: 7-day review (SPEC 10.6)
------------------------------------------------------------------------------

alter table public.disputes
  add column if not exists due_at timestamptz,
  add column if not exists outcome text check (outcome in ('content_updated', 'annotated', 'content_removed', 'no_change')),
  add column if not exists staff_note text check (char_length(staff_note) <= 4000),
  add column if not exists reviewed_by uuid references public.profiles on delete set null,
  add column if not exists contact_name text check (char_length(contact_name) <= 120);
update public.disputes set due_at = created_at + interval '7 days' where due_at is null;
alter table public.disputes
  alter column due_at set default (now() + interval '7 days'),
  alter column due_at set not null;
alter table public.disputes drop constraint if exists disputes_status_check;
alter table public.disputes add constraint disputes_status_check check (status in ('open', 'in_review', 'resolved'));
alter table public.disputes add constraint disputes_body_len check (char_length(body) between 1 and 8000);
alter table public.disputes add constraint disputes_resolved_has_outcome
  check (status <> 'resolved' or (outcome is not null and resolved_at is not null));

------------------------------------------------------------------------------
-- Entity merge (SPEC 8.4, admin "merge/link tool")
------------------------------------------------------------------------------

create or replace function public.merge_entities(keep uuid, drop_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not private.is_moderator() then
    raise exception 'moderators only' using errcode = 'insufficient_privilege';
  end if;
  if keep = drop_id then
    raise exception 'pick two different entities' using errcode = 'check_violation';
  end if;
  if exists (select 1 from public.entities where id in (keep, drop_id) and legal_hold) then
    raise exception 'an entity under legal hold cannot be merged' using errcode = 'insufficient_privilege';
  end if;
  if (select count(*) from public.entities where id in (keep, drop_id)) <> 2 then
    raise exception 'entity not found' using errcode = 'no_data_found';
  end if;

  -- Identifiers move unless the kept entity already has the same one.
  update public.entity_identifiers i set entity_id = keep
   where i.entity_id = drop_id
     and not exists (select 1 from public.entity_identifiers k where k.entity_id = keep and k.type = i.type and k.norm = i.norm);
  delete from public.entity_identifiers where entity_id = drop_id;

  insert into public.report_entities (report_id, entity_id)
  select report_id, keep from public.report_entities where entity_id = drop_id
  on conflict do nothing;
  delete from public.report_entities where entity_id = drop_id;

  update public.disputes set entity_id = keep where entity_id = drop_id;

  -- Links: re-point to the kept entity, drop self-links and duplicates.
  insert into public.entity_links (a, b, reason, confidence, evidence, created_by, confirmed_by, confirmed_at)
  select case when l.a = drop_id then keep else l.a end, case when l.b = drop_id then keep else l.b end,
         l.reason, l.confidence, l.evidence, l.created_by, l.confirmed_by, l.confirmed_at
    from public.entity_links l
   where (l.a = drop_id or l.b = drop_id)
     and (case when l.a = drop_id then keep else l.a end) <> (case when l.b = drop_id then keep else l.b end)
  on conflict do nothing;
  delete from public.entity_links where a = drop_id or b = drop_id;

  delete from public.entities where id = drop_id;
end $$;
revoke all on function public.merge_entities(uuid, uuid) from public, anon;
grant execute on function public.merge_entities(uuid, uuid) to authenticated;

-- Moderators may delete an entity only through merge (the function runs as owner);
-- direct deletes stay admin-only (entities_admin_delete).

------------------------------------------------------------------------------
-- Queue counts for the dashboard (staff only)
------------------------------------------------------------------------------

create or replace function public.admin_counts() returns jsonb
language sql stable security definer set search_path = '' as $$
  select case when private.is_staff() then jsonb_build_object(
    'reports', (select coalesce(jsonb_object_agg(status, n), '{}'::jsonb)
                  from (select status, count(*) n from public.reports where status <> 'draft' group by status) s),
    'flagsOpen', (select count(*) from public.content_flags where resolved_at is null),
    'flagsOverdue', (select count(*) from public.content_flags where resolved_at is null and due_at < now()),
    'disputesOpen', (select count(*) from public.disputes where status <> 'resolved'),
    'disputesOverdue', (select count(*) from public.disputes where status <> 'resolved' and due_at < now()),
    'entitiesAwaiting', (select count(*) from public.entities where not is_public
                           and exists (select 1 from public.entity_approvals a where a.entity_id = id))
  ) end
$$;
revoke all on function public.admin_counts() from public;
grant execute on function public.admin_counts() to anon, authenticated;
