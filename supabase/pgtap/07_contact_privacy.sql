-- Contact messages: server-only inserts, staff-only reads. Deletion requests and consent logging.
begin;
select plan(11);

select tests.create_user('member') as m \gset
select tests.create_user('moderator') as mod \gset

select tests.as_service();
insert into public.contact_messages (reason, name, email, message)
values ('press', 'Demo Press', 'press@example.demo', 'Hello, this is a test message for the team.');
select tests.as_postgres();

select ok((select public_ref ~ '^[0-9A-F]{8}$' from public.contact_messages limit 1), 'messages get a short public reference');

select tests.as_anon();
select is((select count(*) from public.contact_messages), 0::bigint, 'anon cannot read contact messages');
select throws_ok(
  $$ insert into public.contact_messages (reason, name, email, message) values ('other', 'x', 'x@y.demo', 'xxxxxxxxxxxxxxxxxxxxxxxxxxx') $$,
  '42501', null, 'anon cannot insert directly (must go through the server route)');

select tests.as_postgres();
select tests.as_user(:'m');
select is((select count(*) from public.contact_messages), 0::bigint, 'members cannot read contact messages');
select throws_ok(
  $$ insert into public.contact_messages (reason, name, email, message) values ('other', 'x', 'x@y.demo', 'xxxxxxxxxxxxxxxxxxxxxxxxxxx') $$,
  '42501', null, 'members cannot insert directly');

select tests.as_postgres();
select throws_ok(
  $$ insert into public.contact_messages (reason, name, email, message) values ('other', 'x', 'not-an-email', 'xxxxxxxxxxxxxxxxxxxxxxxxxxx') $$,
  '23514', null, 'email format enforced in the database');

select tests.as_user(:'mod', 'aal2');
select is((select count(*) from public.contact_messages), 1::bigint, 'staff can read messages');
update public.contact_messages set status = 'answered';
select tests.as_postgres();
select is((select count(*) from public.audit_log where target_type = 'contact_messages'), 1::bigint, 'staff handling is audited');

-- Deletion requests
select tests.as_user(:'m');
insert into public.deletion_requests (user_id) values (auth.uid());
select throws_ok($$ insert into public.deletion_requests (user_id) values (auth.uid()) $$, '23505', null, 'one open deletion request per user');

-- Consent logging
select lives_ok($$ select public.log_cookie_consent(true, '2026-10-05') $$, 'signed-in users can log a cookie choice');
select tests.as_postgres();
select is(
  (select consent || ':' || value || ':' || version from public.consents_log where user_id = :'m'),
  'cookies_analytics:true:2026-10-05', 'cookie choice is logged with its version');

select * from finish();
rollback;
