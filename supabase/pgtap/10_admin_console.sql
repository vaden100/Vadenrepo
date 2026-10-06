-- Phase 3: moderation rules, hidden report source, ban from a report, flag/dispute clocks,
-- entity merge, dashboard counts.
begin;
select plan(25);

select tests.create_user('member') as reporter \gset
select tests.create_user('moderator') as mod \gset
select tests.create_user('admin') as admin \gset

insert into public.reports (id, reporter_id, status, story, submitted_ip, submitted_device, submitted_at) values
  ('00000000-0000-0000-0000-0000000000c1', :'reporter', 'triage', 'my story', '203.0.113.50', 'devhash-c1', now()),
  ('00000000-0000-0000-0000-0000000000c2', null, 'triage', 'anon story', '2001:db8::77', null, now());

-- Moderation transitions
select tests.as_user(:'mod', 'aal2');
select throws_ok($$ update public.reports set status = 'approved' where id = '00000000-0000-0000-0000-0000000000c1' $$,
  '23514', null, 'approving needs a public excerpt');
select throws_ok($$ update public.reports set status = 'rejected' where id = '00000000-0000-0000-0000-0000000000c1' $$,
  '23514', null, 'rejecting needs a reason');
select throws_ok($$ update public.reports set status = 'needs_evidence' where id = '00000000-0000-0000-0000-0000000000c1' $$,
  '23514', null, 'asking for evidence needs a message');
select lives_ok($$ update public.reports set status = 'needs_evidence', evidence_request = 'Add the Cash App receipt.'
  where id = '00000000-0000-0000-0000-0000000000c1' $$, 'request more evidence');
select lives_ok($$ update public.reports set status = 'approved', public_excerpt = 'Paid a deposit, no show.'
  where id = '00000000-0000-0000-0000-0000000000c1' $$, 'approve with excerpt');
select is((select reviewed_by from public.reports where id = '00000000-0000-0000-0000-0000000000c1'), :'mod'::uuid,
  'reviewer recorded');

-- Staff never read the raw source
select throws_ok($$ select submitted_ip from public.reports $$, '42501', null, 'staff cannot select the submitted IP');
select throws_ok($$ select submitted_device from public.reports $$, '42501', null, 'staff cannot select the device hash');
select is(public.report_source_known('00000000-0000-0000-0000-0000000000c2'), '{"ip": true, "device": false}'::jsonb,
  'staff see only whether a source is known');

-- Ban this report's source: admins only
select throws_ok($$ select public.ban_report_source('00000000-0000-0000-0000-0000000000c1', 'spam') $$,
  '42501', null, 'moderators cannot ban');
select tests.as_postgres();
select tests.as_user(:'admin', 'aal1');
select throws_ok($$ select public.ban_report_source('00000000-0000-0000-0000-0000000000c1', 'spam') $$,
  '42501', null, 'admins without 2FA cannot ban');
select tests.as_postgres();
select tests.as_user(:'admin', 'aal2');
select throws_ok($$ select public.ban_report_source('00000000-0000-0000-0000-0000000000c1', ' ') $$,
  '23514', null, 'a ban needs a reason');
select is(public.ban_report_source('00000000-0000-0000-0000-0000000000c1', 'fake reports'),
  '{"ip": true, "device": true, "ipKnown": true, "deviceKnown": true}'::jsonb, 'bans IP and device');
select is(public.ban_report_source('00000000-0000-0000-0000-0000000000c1', 'again') ->> 'ip', 'false', 'no duplicate ban');
select is(public.ban_report_source('00000000-0000-0000-0000-0000000000c2', 'v6', 30) ->> 'ip', 'true', 'IPv6 source banned');
select tests.as_postgres();
select ok(public.is_banned('203.0.113.50'), 'the banned IP is blocked');
select ok(not public.is_banned('203.0.113.51'), 'neighbours are not');
select ok(public.is_banned(null, 'devhash-c1'), 'the device is blocked');
select is((select count(*)::int from public.audit_log where actor = :'admin' and target_type in ('ip_bans', 'device_bans')), 3,
  'bans from a report are audited');

-- Flags: the 24-hour clock cannot be moved by members or staff
insert into public.content_flags (id, target_type, target_id, reason, reporter_id, created_at)
values ('00000000-0000-0000-0000-0000000000f9', 'entity', gen_random_uuid(), 'inaccurate', :'reporter', now() - interval '25 hours');
select is((select due_at from public.content_flags where id = '00000000-0000-0000-0000-0000000000f9'),
  (select created_at + interval '24 hours' from public.content_flags where id = '00000000-0000-0000-0000-0000000000f9'),
  'due 24 hours after the flag');
select tests.as_user(:'mod', 'aal2');
update public.content_flags set due_at = now() + interval '9 days' where id = '00000000-0000-0000-0000-0000000000f9';
select ok((select due_at < now() from public.content_flags where id = '00000000-0000-0000-0000-0000000000f9'),
  'staff cannot extend the deadline');
select is((public.admin_counts() ->> 'flagsOverdue')::int, 1, 'overdue flag counted');
select tests.as_postgres();

-- Merge
insert into public.entities (id, display_name) values
  ('00000000-0000-0000-0000-0000000000e1', 'Keep Demo'), ('00000000-0000-0000-0000-0000000000e2', 'Drop Demo');
insert into public.entity_identifiers (entity_id, type, raw, norm) values
  ('00000000-0000-0000-0000-0000000000e1', 'cashtag', '$Same', 'same'),
  ('00000000-0000-0000-0000-0000000000e2', 'cashtag', '$Same', 'same'),
  ('00000000-0000-0000-0000-0000000000e2', 'handle_ig', '@drop.demo', 'drop.demo');
insert into public.report_entities values ('00000000-0000-0000-0000-0000000000c2', '00000000-0000-0000-0000-0000000000e2');
select tests.as_user(:'mod', 'aal2');
select public.merge_entities('00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0000-0000000000e2');
select results_eq(
  $$ select type::text || ':' || norm from public.entity_identifiers where entity_id = '00000000-0000-0000-0000-0000000000e1' order by 1 $$,
  array['cashtag:same', 'handle_ig:drop.demo'], 'identifiers merged without duplicates');
select is((select count(*)::int from public.report_entities where entity_id = '00000000-0000-0000-0000-0000000000e1'), 1,
  'reports follow the merge');
select tests.as_postgres();
select tests.as_anon();
select is(public.admin_counts(), null, 'counts are staff only');
select tests.as_postgres();

select * from finish();
rollback;
