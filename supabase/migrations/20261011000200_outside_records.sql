-- Outside records (docs/open-data-sources.md): public lists kept by others, shown next to a
-- lookup as a neutral, sourced fact. They never create an entity, never change a score and
-- never name anyone on their own. First source: Phishing.Database (MIT), active phishing hosts.

create table public.outside_sources (
  source text primary key check (source ~ '^[a-z_]{3,40}$'),
  label text not null,
  url text not null,
  license text not null,
  false_positive_url text,
  last_import_at timestamptz,
  row_count int not null default 0
);

create table public.outside_records (
  source text not null references public.outside_sources on delete cascade,
  type public.ident_type not null,
  norm text not null check (char_length(norm) between 1 and 253),
  seen_at timestamptz not null default now(),
  primary key (source, type, norm)
);
create index outside_records_lookup on public.outside_records (type, norm);

alter table public.outside_sources enable row level security;
alter table public.outside_records enable row level security;
-- Source metadata is public; the records themselves are read through outside_lookup() only,
-- so the API is not a bulk download mirror. Writes: service role (the worker importer).
create policy outside_sources_read on public.outside_sources for select to anon, authenticated using (true);

insert into public.outside_sources (source, label, url, license, false_positive_url) values
  ('phishing_database', 'Phishing.Database', 'https://github.com/Phishing-Database/Phishing.Database', 'MIT',
   'https://github.com/Phishing-Database/Phishing.Database/issues/new/choose')
on conflict (source) do nothing;

-- Hosts to check: the exact host typed and its registrable domain (the app sends both).
create or replace function public.outside_lookup(hosts text[]) returns jsonb
language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(jsonb_build_object(
           'source', s.source, 'label', s.label, 'url', s.url, 'license', s.license,
           'falsePositiveUrl', s.false_positive_url, 'value', r.norm,
           'seenAt', r.seen_at, 'listUpdatedAt', s.last_import_at)
           order by s.source, r.norm), '[]'::jsonb)
    from public.outside_records r
    join public.outside_sources s on s.source = r.source
   where r.type = 'domain'
     and r.norm = any (array(select lower(h) from unnest(hosts) h limit 5))
$$;
revoke all on function public.outside_lookup(text[]) from public;
grant execute on function public.outside_lookup(text[]) to anon, authenticated, service_role;

-- Importer bookkeeping: after a full upsert run, drop hosts that left the list and record stats.
create or replace function public.finish_outside_import(src text, run_started timestamptz) returns int
language plpgsql security definer set search_path = '' as $$
declare
  removed int;
begin
  if auth.role() is distinct from 'service_role' and (auth.jwt() ->> 'role') is not null then
    raise exception 'service role only' using errcode = 'insufficient_privilege';
  end if;
  delete from public.outside_records where source = src and seen_at < run_started;
  get diagnostics removed = row_count;
  update public.outside_sources
     set last_import_at = now(),
         row_count = (select count(*) from public.outside_records where source = src)
   where source = src;
  return removed;
end $$;
revoke all on function public.finish_outside_import(text, timestamptz) from public, anon, authenticated;
grant execute on function public.finish_outside_import(text, timestamptz) to service_role;
