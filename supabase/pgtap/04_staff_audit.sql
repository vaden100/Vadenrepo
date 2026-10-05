-- SPEC 11: every staff write creates an audit row; the audit log is immutable.
begin;
select plan(14);

select tests.create_user('admin') as admin \gset
select tests.create_user('moderator') as moderator \gset
select tests.create_user('member') as member \gset
insert into public.reports (id, reporter_id, status, story) values
  ('00000000-0000-0000-0000-0000000000d1', :'member', 'submitted', 'secret story text');

select tests.as_user(:'admin', 'aal2', '192.0.2.10');
insert into public.ip_bans (cidr, reason) values ('198.51.100.0/24', 'abuse');
select is(
  (select count(*) from public.audit_log where actor = :'admin' and action = 'insert' and target_type = 'ip_bans'),
  1::bigint, 'admin ban creates an audit row'
);
select is(
  (select host(ip) from public.audit_log where target_type = 'ip_bans'),
  '192.0.2.10', 'audit row records the request IP'
);
insert into public.device_bans (device_hash, reason) values ('abc123', 'abuse');
select is(
  (select count(*) from public.audit_log where actor = :'admin' and target_type = 'device_bans'),
  1::bigint, 'device ban is audited'
);

select tests.as_postgres();
select tests.as_user(:'moderator', 'aal2');
update public.reports set status = 'triage' where id = '00000000-0000-0000-0000-0000000000d1';
select tests.as_postgres();
select is(
  (select meta -> 'changes' -> 'status' ->> 'new' from public.audit_log
     where actor = :'moderator' and target_type = 'reports'),
  'triage', 'moderator status change is audited with old/new values'
);

select tests.as_user(:'moderator', 'aal2');
update public.reports set story = 'moderator edit' where id = '00000000-0000-0000-0000-0000000000d1';
select tests.as_postgres();
select is(
  (select count(*) from public.audit_log where meta::text like '%secret story text%' or meta::text like '%moderator edit%'),
  0::bigint, 'victim story text never lands in the audit log'
);

select tests.as_user(:'moderator', 'aal2');
insert into public.entities (id, slug, display_name) values ('00000000-0000-0000-0000-0000000000e1', 'ent', 'Ent');
update public.entities set city = 'Atlanta' where id = '00000000-0000-0000-0000-0000000000e1';
select tests.as_postgres();
select is(
  (select array_agg(action order by id) from public.audit_log where target_id = '00000000-0000-0000-0000-0000000000e1'),
  array['insert', 'update'], 'entity create and edit are both audited'
);

-- Member writes to shared tables are not staff actions and are not audited.
select tests.as_user(:'member');
update public.reports set status = 'withdrawn' where id = '00000000-0000-0000-0000-0000000000d1';
select tests.as_postgres();
select is(
  (select count(*) from public.audit_log where actor = :'member'),
  0::bigint, 'member actions on their own report are not staff audit events'
);

-- Immutability: nobody can change or remove audit rows.
select throws_ok('update public.audit_log set action = ''x''', '42501', null, 'postgres cannot update audit rows');
select throws_ok('delete from public.audit_log', '42501', null, 'postgres cannot delete audit rows');
select throws_ok('truncate public.audit_log', '42501', null, 'postgres cannot truncate the audit log');
select tests.as_service();
select throws_ok('delete from public.audit_log', '42501', null, 'service role cannot delete audit rows');
select tests.as_postgres();
select tests.as_user(:'admin', 'aal2');
select throws_ok(
  $$ insert into public.audit_log (action) values ('forged') $$,
  '42501', null, 'admins cannot forge audit rows'
);
select ok((select count(*) from public.audit_log) > 0, 'admin can read the audit log');
select tests.as_postgres();
select tests.as_user(:'moderator', 'aal2');
select is((select count(*) from public.audit_log), 0::bigint, 'moderators cannot read the audit log');

select * from finish();
rollback;
