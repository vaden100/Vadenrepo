-- WBS 37: every mutable record carries created_at and updated_at.
do $$
declare
  t text;
begin
  foreach t in array array[
    'profiles', 'entities', 'entity_identifiers', 'reports', 'media', 'cases', 'case_updates',
    'episodes', 'content_flags', 'disputes', 'ip_bans', 'deletion_requests'
  ] loop
    execute format('alter table public.%I add column if not exists updated_at timestamptz not null default now()', t);
    execute format(
      'create trigger %1$s_touch before update on public.%1$I for each row execute function private.touch_updated_at()', t);
  end loop;
end $$;

-- Episodes had no created_at in SPEC 7.
alter table public.episodes add column if not exists created_at timestamptz not null default now();
