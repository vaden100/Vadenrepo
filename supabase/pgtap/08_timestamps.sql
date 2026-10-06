-- WBS 37: updated_at moves on every update, created_at never does.
begin;
select plan(3);

insert into public.entities (id, display_name, created_at, updated_at)
values ('00000000-0000-0000-0000-0000000000ab', 'Timestamps demo', now() - interval '2 days', now() - interval '2 days');
update public.entities set city = 'Atlanta' where id = '00000000-0000-0000-0000-0000000000ab';
select ok(
  (select updated_at > created_at + interval '1 day' from public.entities where id = '00000000-0000-0000-0000-0000000000ab'),
  'updated_at is refreshed on update');
select ok(
  (select created_at < now() - interval '1 day' from public.entities where id = '00000000-0000-0000-0000-0000000000ab'),
  'created_at is unchanged');
select is(
  (select count(*)::int from information_schema.columns
    where table_schema = 'public' and column_name = 'updated_at'
      and table_name in ('profiles', 'entities', 'reports', 'cases', 'episodes', 'disputes', 'contact_messages', 'deletion_requests')),
  8, 'core mutable tables have updated_at');

select * from finish();
rollback;
