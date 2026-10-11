-- SPEC 16 Phase 4 acceptance: p95 < 300 ms for text search on 100k fake identifiers.
-- Times search_everything inside Postgres (no network), 200 mixed queries.
begin;
select plan(3);

alter table public.entity_identifiers disable trigger entity_identifiers_resolve;
alter table public.entity_identifiers disable trigger audit_entity_identifiers;
alter table public.entities disable trigger audit_entities;

insert into public.entities (id, slug, display_name, city, state, is_public)
select ('00000000-0000-4000-8000-' || lpad(to_hex(g), 12, '0'))::uuid,
       'perf-' || g,
       (array['Lashes', 'Nailz', 'Braids', 'Kicks', 'Detail', 'Fades', 'Wigs', 'Credit'])[1 + g % 8]
         || ' by ' || (array['Tee', 'Kay', 'Dee', 'Jay', 'Bree', 'Mo', 'Nia', 'Rae'])[1 + (g / 8) % 8] || ' ' || g || ' demo',
       (array['Atlanta', 'Houston', 'Memphis', 'Detroit'])[1 + g % 4], 'GA', g % 10 <> 0
  from generate_series(1, 25000) g;

insert into public.entity_identifiers (entity_id, type, raw, norm, norm_loose)
select ('00000000-0000-4000-8000-' || lpad(to_hex(g), 12, '0'))::uuid, t.type::public.ident_type, t.raw, t.norm, t.loose
  from generate_series(1, 25000) g,
  lateral (values
    ('handle_ig', '@biz' || g || '.demo', 'biz' || g || '.demo', 'bizdemo' || g),
    ('cashtag', '$Cash' || g || 'Demo', 'cash' || g || 'demo', null),
    ('phone', '+1404' || lpad(g::text, 7, '0'), '+1404' || lpad(g::text, 7, '0'), null),
    ('name', 'name ' || g, 'demo biz ' || g, null)
  ) as t(type, raw, norm, loose);

select is((select count(*)::int from public.entity_identifiers where norm like 'cash%demo' or norm like '+1404%' or norm like 'biz%.demo' or norm like 'demo biz %'), 100000,
  '100k fake identifiers loaded');
analyze public.entities;
analyze public.entity_identifiers;

create temp table timings (kind text, ms float8) on commit drop;
grant all on timings to anon;
select tests.as_anon();
do $$
declare
  i int;
  t0 timestamptz;
  n int;
begin
  for i in 1..200 loop
    n := 1 + (i * 7919) % 25000;
    t0 := clock_timestamp();
    case i % 4
      when 0 then perform public.search_everything('cashtag', 'cash' || n || 'demo');
      when 1 then perform public.search_everything('phone', '+1404' || lpad(n::text, 7, '0'));
      when 2 then perform public.search_everything('handle', 'biz' || n || '.demo', 'bizdemo' || n);
      else perform public.search_everything('name', 'lashes by tee ' || n, null, 'Lashes by Tee ' || n);
    end case;
    insert into timings values ((array['cashtag', 'phone', 'handle', 'name'])[1 + i % 4],
                                extract(epoch from clock_timestamp() - t0) * 1000);
  end loop;
end $$;
select tests.as_postgres();

select cmp_ok((select percentile_cont(0.95) within group (order by ms) from timings), '<', 300::float8,
  'p95 search_everything under 300 ms on 100k identifiers');
select diag('p95 by kind (ms): ' || (select string_agg(kind || '=' || round(p::numeric, 1), ', ') from
  (select kind, percentile_cont(0.95) within group (order by ms) p from timings group by kind order by kind) x));
select is(public.search_everything('phone', '+14040012345') -> 'results' -> 0 ->> 'slug', 'perf-12345', 'right answer at scale');

select * from finish();
rollback;
