-- LOCAL TESTS ONLY. Helpers to impersonate API callers inside a pgTAP transaction.
create schema if not exists tests;
create extension if not exists pgtap with schema extensions;

create or replace function tests.create_user(p_role public.role default 'member', p_onboarded boolean default true)
returns uuid language plpgsql as $$
declare
  uid uuid := gen_random_uuid();
begin
  insert into auth.users (id, email) values (uid, uid || '@test.demo');
  perform set_config('rmmm.trusted_write', 'on', true);
  update public.profiles
     set role = p_role,
         age_confirmed_at = case when p_onboarded then now() end,
         terms_accepted_at = case when p_onboarded then now() end,
         terms_version = case when p_onboarded then '2026-10-05' end
   where id = uid;
  perform set_config('rmmm.trusted_write', 'off', true);
  return uid;
end $$;

create or replace function tests.as_anon() returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
  perform set_config('request.headers', '{}', true);
  execute 'set local role anon';
end $$;

create or replace function tests.as_user(uid uuid, aal text default 'aal1', ip text default null) returns void
language plpgsql as $$
begin
  perform set_config('request.jwt.claims',
    json_build_object('sub', uid, 'role', 'authenticated', 'aal', aal)::text, true);
  perform set_config('request.headers',
    case when ip is null then '{}' else json_build_object('x-forwarded-for', ip)::text end, true);
  execute 'set local role authenticated';
end $$;

create or replace function tests.as_service() returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', '{"role":"service_role"}', true);
  execute 'set local role service_role';
end $$;

create or replace function tests.as_postgres() returns void language plpgsql as $$
begin
  execute 'reset role';
  perform set_config('request.jwt.claims', '', true);
  perform set_config('request.headers', '', true);
end $$;

grant usage on schema tests to anon, authenticated, service_role;
grant execute on all functions in schema tests to anon, authenticated, service_role;
