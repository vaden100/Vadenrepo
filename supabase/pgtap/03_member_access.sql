-- Members see and edit only their own rows, cannot escalate, and must be onboarded.
begin;
select plan(17);

select tests.create_user('member') as alice \gset
select tests.create_user('member') as bob \gset
select tests.create_user('member', false) as newbie \gset

insert into public.reports (id, reporter_id, status, story) values
  ('00000000-0000-0000-0000-0000000000c1', :'alice', 'draft', 'alice story'),
  ('00000000-0000-0000-0000-0000000000c2', :'bob', 'draft', 'bob story'),
  ('00000000-0000-0000-0000-0000000000c3', :'alice', 'submitted', 'alice submitted');
insert into public.entities (slug, display_name) values ('hidden', 'Hidden');

select tests.as_user(:'alice');

select results_eq('select id::text from public.profiles', array[:'alice'], 'member: sees only own profile');
select set_eq(
  'select story from public.reports',
  array['alice story', 'alice submitted'],
  'member: sees only own reports'
);
select is((select count(*) from public.entities), 0::bigint, 'member: non-public entities hidden');

select lives_ok(
  $$ update public.profiles set display_name = 'Alice' where id = auth.uid() $$,
  'member: can set display name'
);
select throws_ok(
  $$ update public.profiles set role = 'admin' where id = auth.uid() $$,
  '42501', null, 'member: cannot make self admin'
);
select throws_ok(
  $$ update public.profiles set age_confirmed_at = now() - interval '1 day' where id = auth.uid() $$,
  '42501', null, 'member: onboarding fields only via RPC'
);
select is_empty(
  $$ update public.reports set story = 'hacked' where id = '00000000-0000-0000-0000-0000000000c2' returning id $$,
  'member: cannot edit someone else''s report'
);
select is_empty(
  $$ update public.reports set story = 'edit' where id = '00000000-0000-0000-0000-0000000000c3' returning id $$,
  'member: cannot edit a submitted report'
);
select throws_ok(
  $$ update public.reports set status = 'approved' where id = '00000000-0000-0000-0000-0000000000c1' $$,
  '42501', null, 'member: cannot approve own report'
);
select throws_ok(
  $$ update public.reports set public_excerpt = 'x' where id = '00000000-0000-0000-0000-0000000000c1' $$,
  '42501', null, 'member: cannot write moderation fields'
);
select lives_ok(
  $$ insert into public.reports (reporter_id, status, story) values (auth.uid(), 'draft', 'new draft') $$,
  'member: can create a draft'
);
select throws_ok(
  $$ insert into public.reports (reporter_id, status) values (auth.uid(), 'approved') $$,
  '42501', null, 'member: cannot create an approved report'
);
select throws_ok(
  format($$ insert into public.reports (reporter_id, status) values (%L, 'draft') $$, :'bob'),
  '42501', null, 'member: cannot file a report as someone else'
);
select throws_ok(
  $$ insert into public.watchlist (user_id, type, norm) values (gen_random_uuid(), 'cashtag', 'x') $$,
  '42501', null, 'member: cannot write another user''s watchlist'
);

-- Not onboarded (no 18+ / terms): cannot create content.
select tests.as_postgres();
select tests.as_user(:'newbie');
select throws_ok(
  $$ insert into public.reports (reporter_id, status) values (auth.uid(), 'draft') $$,
  '42501', null, 'not onboarded: cannot create reports'
);

-- aal1 staff behave like members (SPEC 11: staff need 2FA).
select tests.as_postgres();
select tests.create_user('admin') as admin \gset
select tests.as_user(:'admin', 'aal1');
select is((select count(*) from public.ip_bans), 0::bigint, 'admin without 2FA: no staff access');
select throws_ok(
  $$ insert into public.ip_bans (cidr) values ('198.51.100.1') $$,
  '42501', null, 'admin without 2FA: cannot ban'
);

select * from finish();
rollback;
