-- Role helpers, audit trail, guards, bans, rate limiting, masking and onboarding RPCs.
-- Every SECURITY DEFINER function pins `search_path = ''` and qualifies every name.

------------------------------------------------------------------------------
-- Request context
------------------------------------------------------------------------------

-- Client IP as forwarded by the API gateway (PostgREST exposes request headers).
create or replace function private.request_headers() returns json
language plpgsql stable set search_path = '' as $$
begin
  return nullif(current_setting('request.headers', true), '')::json;
exception when others then
  return null;
end $$;

create or replace function private.request_ip() returns inet
language plpgsql stable set search_path = '' as $$
declare
  raw text;
begin
  raw := trim(split_part(coalesce(private.request_headers() ->> 'x-forwarded-for', ''), ',', 1));
  if raw = '' then
    return null;
  end if;
  return raw::inet;
exception when others then
  return null;
end $$;

create or replace function private.request_device() returns text
language sql stable set search_path = '' as $$
  select nullif(private.request_headers() ->> 'x-rmmm-device', '')
$$;

------------------------------------------------------------------------------
-- Roles (SPEC 3). Staff privileges require a second factor (aal2, SPEC 11).
------------------------------------------------------------------------------

create or replace function private.current_role() returns public.role
language sql stable security definer set search_path = '' as $$
  select p.role from public.profiles p
  where p.id = auth.uid() and p.banned_at is null
$$;

create or replace function private.has_aal2() returns boolean
language sql stable set search_path = '' as $$
  select coalesce(auth.jwt() ->> 'aal', 'aal1') = 'aal2'
$$;

create or replace function private.is_staff() returns boolean
language sql stable set search_path = '' as $$
  select coalesce(private.current_role() in ('moderator', 'editor', 'admin'), false) and private.has_aal2()
$$;

create or replace function private.is_moderator() returns boolean
language sql stable set search_path = '' as $$
  select coalesce(private.current_role() in ('moderator', 'admin'), false) and private.has_aal2()
$$;

create or replace function private.is_editor() returns boolean
language sql stable set search_path = '' as $$
  select coalesce(private.current_role() in ('editor', 'admin'), false) and private.has_aal2()
$$;

create or replace function private.is_admin() returns boolean
language sql stable set search_path = '' as $$
  select coalesce(private.current_role() = 'admin', false) and private.has_aal2()
$$;

-- Signed in, not banned, 18+ confirmed and current terms accepted.
create or replace function private.is_onboarded() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.banned_at is null
      and p.age_confirmed_at is not null
      and p.terms_accepted_at is not null
  )
$$;

------------------------------------------------------------------------------
-- Bans (SPEC 11)
------------------------------------------------------------------------------

create or replace function private.is_banned(p_ip inet, p_device_hash text) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.ip_bans b
    where p_ip is not null
      and b.cidr >>= p_ip
      and (b.expires_at is null or b.expires_at > now())
  ) or exists (
    select 1 from public.device_bans d
    where p_device_hash is not null and d.device_hash = p_device_hash
  )
$$;

-- Called by the web proxy on every request (service role only).
create or replace function public.is_banned(ip inet, device_hash text default null) returns boolean
language sql stable security definer set search_path = '' as $$
  select private.is_banned(ip, device_hash)
$$;

-- Defense in depth for direct API writes that skip the web proxy.
create or replace function private.request_is_banned() returns boolean
language sql stable set search_path = '' as $$
  select private.is_banned(private.request_ip(), private.request_device())
$$;

------------------------------------------------------------------------------
-- Rate limiting: token bucket (SPEC 9, 11). Service role only.
------------------------------------------------------------------------------

create or replace function public.check_rate_limit(
  bucket text,
  capacity int,
  refill_per_minute double precision,
  cost int default 1
) returns table (allowed boolean, remaining int, retry_after_seconds int)
language plpgsql volatile security definer set search_path = '' as $$
declare
  rate double precision := refill_per_minute / 60.0;   -- tokens per second
  current_tokens double precision;
begin
  if capacity <= 0 or refill_per_minute <= 0 or cost <= 0 then
    raise exception 'invalid rate limit parameters';
  end if;

  insert into public.rate_limits as r (bucket, tokens, updated_at)
  values (check_rate_limit.bucket, capacity, now())
  on conflict on constraint rate_limits_pkey do update
    set tokens = least(
          check_rate_limit.capacity::double precision,
          r.tokens + extract(epoch from (now() - r.updated_at)) * rate
        ),
        updated_at = now()
  returning r.tokens into current_tokens;

  if current_tokens >= cost then
    update public.rate_limits set tokens = current_tokens - cost where rate_limits.bucket = check_rate_limit.bucket;
    return query select true, floor(current_tokens - cost)::int, 0;
  else
    return query select false, 0, ceil((cost - current_tokens) / rate)::int;
  end if;
end $$;

-- Housekeeping: drop buckets that have been full for a day.
create or replace function public.prune_rate_limits() returns int
language sql volatile security definer set search_path = '' as $$
  with d as (delete from public.rate_limits where updated_at < now() - interval '1 day' returning 1)
  select count(*)::int from d
$$;

------------------------------------------------------------------------------
-- Audit log (SPEC 11): every staff write produces a row; the log is insert-only.
------------------------------------------------------------------------------

create or replace function private.audit_write() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  mode text := coalesce(tg_argv[0], 'always');   -- 'always' | 'staff_only'
  old_row jsonb := case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) end;
  new_row jsonb := case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) end;
  row_data jsonb := coalesce(new_row, old_row);
  -- Never copy victim stories, vectors or abuse signals into the audit trail.
  redact text[] := array['story', 'story_tsv', 'embedding', 'submitted_ip', 'submitted_device', 'anon_claim_hash', 'ocr_text', 'transcript'];
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

create or replace function private.audit_log_immutable() returns trigger
language plpgsql set search_path = '' as $$
begin
  raise exception 'audit_log is append-only' using errcode = 'insufficient_privilege';
end $$;

------------------------------------------------------------------------------
-- Guards
------------------------------------------------------------------------------

-- Profiles: members may only change display_name. Role, bans and onboarding go
-- through RPCs (onboarding) or admins (role, bans).
create or replace function private.profiles_guard() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if current_setting('rmmm.trusted_write', true) = 'on' or auth.role() = 'service_role' or auth.uid() is null then
    return new;
  end if;
  if (new.role, new.banned_at, new.ban_reason) is distinct from (old.role, old.banned_at, old.ban_reason)
     and not private.is_admin() then
    raise exception 'only admins can change roles or bans' using errcode = 'insufficient_privilege';
  end if;
  if (new.age_confirmed_at, new.terms_accepted_at, new.terms_version)
       is distinct from (old.age_confirmed_at, old.terms_accepted_at, old.terms_version) then
    raise exception 'use confirm_age() and accept_terms()' using errcode = 'insufficient_privilege';
  end if;
  if new.id <> old.id or new.created_at <> old.created_at then
    raise exception 'immutable profile columns' using errcode = 'insufficient_privilege';
  end if;
  return new;
end $$;

-- Reports: reporters cannot set moderation fields or move a report past submitted.
create or replace function private.reports_guard() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  new.story_tsv := to_tsvector('english'::regconfig, coalesce(new.story, ''));

  if auth.role() = 'service_role' or auth.uid() is null or private.is_staff() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if new.status <> 'draft' or new.public_excerpt is not null or new.reviewed_at is not null
       or new.public_code is not null or new.submitted_ip is not null or new.embedding is not null then
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
     or new.anon_claim_hash is distinct from old.anon_claim_hash then
    raise exception 'protected report columns' using errcode = 'insufficient_privilege';
  end if;
  if new.status is distinct from old.status and new.status not in ('withdrawn') then
    -- Submitting goes through the submit function (Phase 2), which runs as service role.
    raise exception 'reporters can only withdraw' using errcode = 'insufficient_privilege';
  end if;
  return new;
end $$;

-- Two-person rule (SPEC 3, 10.4): an entity becomes public only with approvals from
-- two different staff, one moderator (or admin) and one editor (or admin).
create or replace function private.entities_publish_guard() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  approvers uuid[];
  n_distinct int;
  has_mod boolean;
  has_editor boolean;
begin
  if not new.is_public or (tg_op = 'UPDATE' and old.is_public) then
    return new;
  end if;

  approvers := array(select distinct unnest(new.approved_by));
  n_distinct := coalesce(array_length(approvers, 1), 0);
  select bool_or(p.role in ('moderator', 'admin')), bool_or(p.role in ('editor', 'admin'))
    into has_mod, has_editor
    from public.profiles p
   where p.id = any (approvers) and p.banned_at is null;

  if n_distinct < 2 or not coalesce(has_mod, false) or not coalesce(has_editor, false) then
    raise exception 'two-person rule: needs approval from a moderator and an editor (two different people)'
      using errcode = 'check_violation';
  end if;
  new.approved_at := coalesce(new.approved_at, now());
  return new;
end $$;

-- Legal hold (SPEC 10.8): freezes edits and deletes. Only admins can lift it.
create or replace function private.legal_hold_guard() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'DELETE' then
    if old.legal_hold then
      raise exception '% % is under legal hold', tg_table_name, old.id using errcode = 'insufficient_privilege';
    end if;
    return old;
  end if;
  if old.legal_hold then
    if new.legal_hold = false and (to_jsonb(new) - 'legal_hold') = (to_jsonb(old) - 'legal_hold') and private.is_admin() then
      return new;   -- admin lifting the hold, nothing else
    end if;
    raise exception '% % is under legal hold', tg_table_name, old.id using errcode = 'insufficient_privilege';
  end if;
  return new;
end $$;

------------------------------------------------------------------------------
-- New users get a profile.
------------------------------------------------------------------------------

create or replace function private.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id) values (new.id) on conflict (id) do nothing;
  return new;
end $$;

------------------------------------------------------------------------------
-- Onboarding RPCs (SPEC 12: 18+ age gate, terms acceptance logged with version)
------------------------------------------------------------------------------

-- The birth date is checked and discarded; only the confirmation time is stored.
-- Returns false (and logs the refusal) for under-18s instead of raising, so the log row sticks.
create or replace function public.confirm_age(birth_date date) returns boolean
language plpgsql volatile security definer set search_path = '' as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'sign in first' using errcode = 'insufficient_privilege';
  end if;
  if birth_date is null or birth_date > current_date or birth_date < date '1900-01-01' then
    raise exception 'invalid birth date' using errcode = 'invalid_parameter_value';
  end if;
  if birth_date > (current_date - interval '18 years')::date then
    insert into public.consents_log (user_id, consent, value, version) values (uid, 'age_18_plus', false, null);
    return false;
  end if;

  perform set_config('rmmm.trusted_write', 'on', true);
  update public.profiles set age_confirmed_at = now() where id = uid;
  perform set_config('rmmm.trusted_write', 'off', true);
  insert into public.consents_log (user_id, consent, value, version) values (uid, 'age_18_plus', true, null);
  return true;
end $$;

create or replace function public.accept_terms(version text) returns void
language plpgsql volatile security definer set search_path = '' as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'sign in first' using errcode = 'insufficient_privilege';
  end if;
  if version is null or version !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' then
    raise exception 'invalid terms version' using errcode = 'invalid_parameter_value';
  end if;

  perform set_config('rmmm.trusted_write', 'on', true);
  update public.profiles set terms_accepted_at = now(), terms_version = accept_terms.version where id = uid;
  perform set_config('rmmm.trusted_write', 'off', true);
  insert into public.consents_log (user_id, consent, value, version) values (uid, 'terms_privacy', true, accept_terms.version);
end $$;

------------------------------------------------------------------------------
-- Masking (SPEC 7): public responses never show phones, emails or payment tags in full.
------------------------------------------------------------------------------

create or replace function public.mask_identifier(t public.ident_type, raw text) returns text
language plpgsql immutable set search_path = '' as $$
declare
  digits text;
  v text := trim(coalesce(raw, ''));
  local_part text;
  keep int;
begin
  if t in ('name', 'handle_ig', 'handle_tiktok', 'handle_fb', 'handle_x', 'domain', 'url') then
    return v;
  end if;
  if t = 'address' then
    return '•••';
  end if;
  if t = 'email' or (t in ('zelle', 'paypal') and position('@' in v) > 1) then
    local_part := split_part(v, '@', 1);
    return left(local_part, 1) || '•••@' || split_part(v, '@', 2);
  end if;
  if t = 'phone' or (t = 'zelle' and v ~ '^[+0-9() .-]+$') then
    digits := regexp_replace(v, '[^0-9]', '', 'g');
    return '(•••) •••-' || right(digits, 4);
  end if;
  -- cashtag, venmo, paypal handles, apple cash: keep the sigil, first char and a short tail.
  local_part := regexp_replace(v, '^[$@]', '');
  keep := least(5, greatest(0, char_length(local_part) - 3));
  return substring(v from 1 for char_length(v) - char_length(local_part))
    || left(local_part, 1) || '•••' || right(local_part, keep);
end $$;

-- Amount ranges for public report excerpts (exact amounts stay private).
create or replace function public.amount_range(cents int) returns text
language sql immutable set search_path = '' as $$
  select case
    when cents is null then null
    when cents < 5000 then 'Under $50'
    when cents < 10000 then '$50 to $100'
    when cents < 25000 then '$100 to $250'
    when cents < 50000 then '$250 to $500'
    when cents < 100000 then '$500 to $1,000'
    else '$1,000 or more'
  end
$$;
