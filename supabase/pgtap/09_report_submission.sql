-- Phase 2 database rules: identifiers privacy, case codes, job queue, triage advance.
begin;
select plan(13);

select tests.create_user('member') as alice \gset
select tests.create_user('member') as bob \gset
select tests.create_user('moderator') as mod \gset

insert into public.reports (id, reporter_id, status) values
  ('00000000-0000-0000-0000-00000000aa01', :'alice', 'draft'),
  ('00000000-0000-0000-0000-00000000aa02', null, 'draft');
insert into public.report_identifiers (report_id, field, type, raw, norm) values
  ('00000000-0000-0000-0000-00000000aa01', 'cashtag', 'cashtag', '$TeeLaces', 'teelaces'),
  ('00000000-0000-0000-0000-00000000aa02', 'phone', 'phone', '(404) 555-0100', '+14045550100');

-- Identifiers are private to the reporter and staff.
select tests.as_anon();
select is((select count(*) from public.report_identifiers), 0::bigint, 'anon cannot see reported identifiers');
select tests.as_postgres();
select tests.as_user(:'bob');
select is((select count(*) from public.report_identifiers), 0::bigint, 'other members cannot see them');
select throws_ok(
  $$ insert into public.report_identifiers (report_id, field, type, raw, norm) values ('00000000-0000-0000-0000-00000000aa01', 'businessName', 'name', 'x', 'x') $$,
  '42501', null, 'members cannot write identifiers directly');
select tests.as_postgres();
select tests.as_user(:'alice');
select results_eq('select norm from public.report_identifiers', array['teelaces'], 'reporter sees their own');
select tests.as_postgres();
select tests.as_user(:'mod', 'aal2');
select is((select count(*) from public.report_identifiers), 2::bigint, 'staff see all');
select tests.as_postgres();

-- Case codes.
select tests.as_service();
select matches(public.next_report_code(), '^RMMM-\d{2}-\d{4}$', 'case code format RMMM-YY-NNNN');
select isnt(public.next_report_code(), public.next_report_code(), 'case codes are unique');
select tests.as_postgres();
select tests.as_anon();
select throws_ok($$ select public.next_report_code() $$, '42501', null, 'anon cannot mint case codes');
select tests.as_postgres();

-- Job queue: only uploaded media is claimed, once.
insert into public.media (id, report_id, kind, storage_path, upload_status) values
  ('00000000-0000-0000-0000-00000000bb01', '00000000-0000-0000-0000-00000000aa02', 'image', 'reports/a/1.jpg', 'uploaded'),
  ('00000000-0000-0000-0000-00000000bb02', '00000000-0000-0000-0000-00000000aa02', 'image', 'reports/a/2.jpg', 'awaiting_upload');
select tests.as_service();
select results_eq('select id::text from public.claim_media_jobs(5)', array['00000000-0000-0000-0000-00000000bb01'], 'claims uploaded media');
select is_empty('select id from public.claim_media_jobs(5)', 'a claimed job is not handed out twice');
select tests.as_postgres();

-- Triage advance waits for every file.
update public.reports set status = 'submitted' where id = '00000000-0000-0000-0000-00000000aa02';
select tests.as_service();
select is(public.advance_report_after_processing('00000000-0000-0000-0000-00000000aa02'), 'submitted', 'waits while files are pending');
select tests.as_postgres();
update public.media set upload_status = 'ready', processed_at = now() where report_id = '00000000-0000-0000-0000-00000000aa02';
select tests.as_service();
select is(public.advance_report_after_processing('00000000-0000-0000-0000-00000000aa02'), 'triage', 'moves to triage when all files are processed');
select tests.as_postgres();

-- Draft tokens never reach the audit log.
select tests.as_user(:'mod', 'aal2');
update public.reports set draft_token_hash = 'secret-hash' where id = '00000000-0000-0000-0000-00000000aa01';
select tests.as_postgres();
select is((select count(*) from public.audit_log where meta::text like '%secret-hash%'), 0::bigint, 'draft token hash is redacted from audit');

select * from finish();
rollback;
