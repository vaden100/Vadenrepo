-- SPEC 11: IP (single + CIDR, with expiry) and device bans; Postgres token bucket.
begin;
select plan(14);

insert into public.ip_bans (cidr, reason, expires_at) values
  ('203.0.113.7/32', 'single', null),
  ('198.51.100.0/24', 'range', null),
  ('192.0.2.0/24', 'expired', now() - interval '1 minute'),
  ('2001:db8::/32', 'ipv6 range', now() + interval '1 day');
insert into public.device_bans (device_hash, reason) values ('banned-device', 'abuse');

select tests.as_service();
select ok(public.is_banned('203.0.113.7'), 'single IP ban');
select ok(not public.is_banned('203.0.113.8'), 'neighbor of single IP is fine');
select ok(public.is_banned('198.51.100.250'), 'CIDR range ban');
select ok(not public.is_banned('192.0.2.5'), 'expired ban no longer applies');
select ok(public.is_banned('2001:db8::1'), 'IPv6 range ban');
select ok(public.is_banned(null, 'banned-device'), 'device ban');
select ok(not public.is_banned('10.0.0.1', 'other-device'), 'clean IP + device');

-- Token bucket: capacity 3, refill 60/min (1/s).
select results_eq(
  $$ select allowed from public.check_rate_limit('t:1', 3, 60) $$, array[true], '1st request allowed');
select results_eq(
  $$ select allowed from public.check_rate_limit('t:1', 3, 60) $$, array[true], '2nd request allowed');
select results_eq(
  $$ select allowed from public.check_rate_limit('t:1', 3, 60) $$, array[true], '3rd request allowed');
select results_eq(
  $$ select allowed, retry_after_seconds from public.check_rate_limit('t:1', 3, 60) $$,
  $$ values (false, 1) $$, '4th request limited with retry-after');
select results_eq(
  $$ select allowed from public.check_rate_limit('t:2', 3, 60) $$, array[true], 'buckets are independent');

-- Refill: pretend 2 seconds passed.
update public.rate_limits set updated_at = now() - interval '2 seconds' where bucket = 't:1';
select results_eq(
  $$ select allowed, remaining from public.check_rate_limit('t:1', 3, 60) $$,
  $$ values (true, 1) $$, 'bucket refills over time');

-- Direct API writes from a banned IP are refused even without the web proxy.
select tests.as_postgres();
select tests.create_user('member') as m \gset
select tests.as_user(:'m', 'aal1', '198.51.100.20');
select throws_ok(
  $$ insert into public.reports (reporter_id, status) values (auth.uid(), 'draft') $$,
  '42501', null, 'banned IP cannot write through the API');

select * from finish();
rollback;
