-- Website contact form (docs/website-foundations.md 13). Inserted only by the server route
-- (service role) after validation, honeypot and rate limiting. Staff read and handle.

create type public.contact_reason as enum ('business', 'press', 'legal', 'safety', 'bug', 'other');

create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  public_ref text not null unique default upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)),
  reason public.contact_reason not null,
  name text not null check (char_length(name) between 1 and 120),
  email extensions.citext not null check (char_length(email) <= 254 and email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  message text not null check (char_length(message) between 20 and 4000),
  status text not null default 'new' check (status in ('new', 'in_progress', 'answered', 'spam')),
  user_id uuid references public.profiles on delete set null,
  ip_hash text,            -- sha256, never the raw IP
  device_hash text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  handled_by uuid,
  handled_at timestamptz
);
create index on public.contact_messages (status, created_at desc);

alter table public.contact_messages enable row level security;

create policy contact_staff_read on public.contact_messages for select to authenticated
  using (private.is_staff());
create policy contact_staff_update on public.contact_messages for update to authenticated
  using (private.is_staff()) with check (private.is_staff());
-- No insert/delete policies: only the server route (service role) inserts; deletion follows retention jobs.

create or replace function private.touch_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end $$;

create trigger contact_messages_touch before update on public.contact_messages
  for each row execute function private.touch_updated_at();
create trigger audit_contact_messages after insert or update or delete on public.contact_messages
  for each row execute function private.audit_write('staff_only');

-- Self-service deletion requests from /account/delete: one open request per user.
create unique index deletion_requests_one_open on public.deletion_requests (user_id) where status = 'open';

-- Privacy choices for signed-in users are logged with the policy version.
create or replace function public.log_cookie_consent(analytics boolean, version text) returns void
language plpgsql volatile security definer set search_path = '' as $$
begin
  if auth.uid() is null then
    raise exception 'sign in first' using errcode = 'insufficient_privilege';
  end if;
  if version is null or version !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' then
    raise exception 'invalid version' using errcode = 'invalid_parameter_value';
  end if;
  insert into public.consents_log (user_id, consent, value, version)
  values (auth.uid(), 'cookies_analytics', log_cookie_consent.analytics, log_cookie_consent.version);
end $$;
revoke all on function public.log_cookie_consent(boolean, text) from public, anon;
grant execute on function public.log_cookie_consent(boolean, text) to authenticated;
