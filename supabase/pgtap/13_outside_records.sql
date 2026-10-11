-- Outside records: readable only through outside_lookup(); imports are service-role only.
begin;
select plan(7);

insert into public.outside_records (source, type, norm, seen_at) values
  ('phishing_database', 'domain', 'login-cashapp-verify.demo', now()),
  ('phishing_database', 'domain', 'old-listing.demo', now() - interval '2 days');

select tests.as_anon();
select is((select count(*)::int from public.outside_records), 0, 'the list itself is not readable by the public');
select is(jsonb_array_length(public.outside_lookup(array['LOGIN-cashapp-verify.demo', 'cashapp-verify.demo'])), 1, 'a listed host is found');
select is(public.outside_lookup(array['login-cashapp-verify.demo']) -> 0 ->> 'label', 'Phishing.Database', 'with its source');
select is(jsonb_array_length(public.outside_lookup(array['example.demo'])), 0, 'unlisted hosts are not');
select throws_ok($$ select public.finish_outside_import('phishing_database', now()) $$, '42501', null, 'the public cannot run imports');
select tests.as_postgres();

select tests.as_service();
select is(public.finish_outside_import('phishing_database', now() - interval '1 day'), 1, 'hosts that left the list are removed');
select is((select row_count from public.outside_sources where source = 'phishing_database'), 1, 'stats recorded');
select tests.as_postgres();

select * from finish();
rollback;
