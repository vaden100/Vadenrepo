-- Every public table has RLS on, and views exposed to anon are the masked read models.
begin;
select plan(3);

select is(
  (select array_agg(tablename::text order by tablename) from pg_tables
    where schemaname = 'public' and not rowsecurity),
  null,
  'RLS is enabled on every table in public'
);

select tables_are('public', array[
  'profiles', 'entities', 'entity_identifiers', 'entity_links', 'reports', 'report_entities', 'media',
  'cases', 'case_updates', 'episodes', 'episode_cases', 'watchlist', 'follows', 'notifications',
  'push_tokens', 'content_flags', 'user_blocks', 'disputes', 'ip_bans', 'device_bans', 'consents_log',
  'deletion_requests', 'audit_log', 'rate_limits', 'contact_messages'
], 'all SPEC 7 tables (plus rate_limits) exist');

select set_eq(
  $$ select table_name::text from information_schema.role_table_grants
     where grantee = 'anon' and table_schema = 'public' and privilege_type = 'SELECT'
       and table_name in (select viewname from pg_views where schemaname = 'public') $$,
  array['public_entity_identifiers', 'public_report_excerpts'],
  'anon can read exactly the two public views'
);

select * from finish();
rollback;
