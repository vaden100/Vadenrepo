-- SPEC 7: anon can read only public entities, their public-safe identifiers, published
-- cases/updates/episodes and approved excerpts. Everything else is invisible.
begin;
select plan(31);

-- Fixtures (as postgres).
select tests.create_user('member') as reporter \gset
select tests.create_user('moderator') as moderator \gset
select tests.create_user('editor') as editor \gset

insert into public.entities (id, slug, display_name, is_public, approved_by)
values
  ('00000000-0000-0000-0000-0000000000a1', 'public-demo', 'Public Demo', true, array[:'moderator', :'editor']::uuid[]),
  ('00000000-0000-0000-0000-0000000000a2', 'hidden-demo', 'Hidden Demo', false, '{}');
insert into public.entity_identifiers (entity_id, type, raw, norm) values
  ('00000000-0000-0000-0000-0000000000a1', 'handle_ig', '@public.demo', 'public.demo'),
  ('00000000-0000-0000-0000-0000000000a1', 'phone', '(404) 555-4417', '+14045554417'),
  ('00000000-0000-0000-0000-0000000000a1', 'cashtag', '$TeeLaces', 'teelaces'),
  ('00000000-0000-0000-0000-0000000000a1', 'email', 'tee@gmail.com', 'tee@gmail.com'),
  ('00000000-0000-0000-0000-0000000000a2', 'handle_ig', '@hidden.demo', 'hidden.demo');
insert into public.reports (id, reporter_id, status, story, amount_cents, public_excerpt, city, submitted_at)
values
  ('00000000-0000-0000-0000-0000000000b1', :'reporter', 'approved', 'full private story', 7500, 'Day of, the page blocked me.', 'Atlanta', now()),
  ('00000000-0000-0000-0000-0000000000b2', :'reporter', 'submitted', 'pending story', 5000, null, 'Atlanta', now());
insert into public.report_entities values
  ('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000a1'),
  ('00000000-0000-0000-0000-0000000000b2', '00000000-0000-0000-0000-0000000000a2');
insert into public.cases (slug, title, published) values ('pub-case', 'Published', true), ('draft-case', 'Draft', false);
insert into public.case_updates (case_id, body, happened_on)
  select id, 'update for ' || slug, current_date from public.cases;
insert into public.episodes (slug, title, kind, published, publish_at) values
  ('live', 'Live', 'episode', true, now() - interval '1 day'),
  ('scheduled', 'Scheduled', 'episode', true, now() + interval '1 day'),
  ('unpublished', 'Unpublished', 'episode', false, null);
insert into public.ip_bans (cidr, reason) values ('203.0.113.0/24', 'test');
insert into public.device_bans (device_hash, reason) values ('dev-hash', 'test');
insert into public.notifications (user_id, kind) values (:'reporter', 'test');
insert into public.consents_log (user_id, consent, value) values (:'reporter', 'terms_privacy', true);
insert into public.content_flags (target_type, reason, reporter_id) values ('report', 'spam', :'reporter');
insert into public.deletion_requests (user_id) values (:'reporter');
insert into public.disputes (entity_id, body) values ('00000000-0000-0000-0000-0000000000a1', 'counter evidence');
insert into public.watchlist (user_id, type, norm) values (:'reporter', 'cashtag', 'teelaces');
insert into public.follows (user_id, target_type, target_id) values (:'reporter', 'case', gen_random_uuid());
insert into public.push_tokens values (:'reporter', 'ExponentPushToken[x]', 'ios');
insert into public.media (report_id, kind, storage_path) values ('00000000-0000-0000-0000-0000000000b1', 'image', 'originals/x.jpg');
insert into public.rate_limits (bucket, tokens) values ('ip:1.2.3.4', 1);

select tests.as_anon();

-- Private tables: zero rows (RLS) or no privilege at all.
select is((select count(*) from public.profiles), 0::bigint, 'anon: profiles hidden');
select is((select count(*) from public.reports), 0::bigint, 'anon: reports hidden');
select is((select count(*) from public.report_entities), 0::bigint, 'anon: report_entities hidden');
select is((select count(*) from public.media), 0::bigint, 'anon: media hidden');
select is((select count(*) from public.watchlist), 0::bigint, 'anon: watchlist hidden');
select is((select count(*) from public.follows), 0::bigint, 'anon: follows hidden');
select is((select count(*) from public.notifications), 0::bigint, 'anon: notifications hidden');
select is((select count(*) from public.push_tokens), 0::bigint, 'anon: push tokens hidden');
select is((select count(*) from public.content_flags), 0::bigint, 'anon: flags hidden');
select is((select count(*) from public.user_blocks), 0::bigint, 'anon: blocks hidden');
select is((select count(*) from public.disputes), 0::bigint, 'anon: disputes hidden');
select is((select count(*) from public.ip_bans), 0::bigint, 'anon: ip bans hidden');
select is((select count(*) from public.device_bans), 0::bigint, 'anon: device bans hidden');
select is((select count(*) from public.consents_log), 0::bigint, 'anon: consents hidden');
select is((select count(*) from public.deletion_requests), 0::bigint, 'anon: deletion requests hidden');
select throws_ok('select count(*) from public.audit_log', '42501', null, 'anon: audit log not readable at all');
select throws_ok('select count(*) from public.rate_limits', '42501', null, 'anon: rate limits not readable at all');

-- Public data: only what has been approved / published.
select results_eq('select slug from public.entities', array['public-demo'], 'anon: only public entities');
select results_eq(
  'select raw from public.entity_identifiers order by raw',
  array['@public.demo'],
  'anon: identifiers limited to public-safe types of public entities'
);
select set_eq(
  'select display from public.public_entity_identifiers',
  array['@public.demo', '(•••) •••-4417', '$T•••Laces', 't•••@gmail.com'],
  'anon: phones, payment tags and emails are masked'
);
select results_eq('select slug from public.cases', array['pub-case'], 'anon: only published cases');
select results_eq('select body from public.case_updates', array['update for pub-case'], 'anon: only updates of published cases');
select results_eq('select slug from public.episodes', array['live'], 'anon: only released episodes');
select results_eq(
  'select public_excerpt from public.public_report_excerpts',
  array['Day of, the page blocked me.'],
  'anon: only approved excerpts of public entities'
);
select results_eq(
  'select amount_range from public.public_report_excerpts',
  array['$50 to $100'],
  'anon: amounts are ranges'
);

-- Writes are denied.
select throws_ok(
  $$ insert into public.entities (display_name) values ('x') $$,
  '42501', null, 'anon: cannot create entities'
);
select throws_ok(
  $$ insert into public.reports (status) values ('draft') $$,
  '42501', null, 'anon: cannot insert reports directly'
);
select is_empty(
  $$ update public.entities set display_name = 'pwned' returning id $$,
  'anon: cannot update entities'
);
select throws_ok(
  $$ select public.is_banned('203.0.113.9'::inet) $$,
  '42501', null, 'anon: cannot call is_banned'
);
select throws_ok(
  $$ select public.check_rate_limit('x', 1, 1) $$,
  '42501', null, 'anon: cannot call check_rate_limit'
);
select throws_ok(
  $$ select public.confirm_age('1990-01-01') $$,
  '42501', null, 'anon: cannot call confirm_age'
);

select * from finish();
rollback;
