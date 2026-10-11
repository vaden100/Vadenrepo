-- SPEC Phase 4: deep search (8.2), flyer check (8.3), entity resolution (8.4), entity stats
-- for the evidence summary (8.5 cache), and the public entity page.
--
-- Visibility rule (SPEC 4.2, CLAUDE.md privacy): the public only ever sees entities that
-- passed two-person review. An exact or rebrand match on a not-yet-public entity returns
-- "under review" with no details. Identifiers that appear only in unreviewed reports are never
-- surfaced at all: an unreviewed claim must not become a public statement about someone.

------------------------------------------------------------------------------
-- Entity stats (evidence summary card), kept current by triggers
------------------------------------------------------------------------------

create table public.entity_stats (
  entity_id uuid primary key references public.entities on delete cascade,
  reports_total int not null default 0,        -- sent and not rejected/withdrawn
  reports_reviewed int not null default 0,     -- approved by a moderator
  amount_reviewed_cents bigint not null default 0,
  last_report_at timestamptz,
  categories jsonb not null default '{}'::jsonb, -- approved only: {category: count}
  updated_at timestamptz not null default now()
);
alter table public.entity_stats enable row level security;
create policy entity_stats_read on public.entity_stats for select to anon, authenticated
  using (private.is_staff() or exists (select 1 from public.entities e where e.id = entity_id and e.is_public));
-- No write policies: only the trigger functions below write.

create or replace function private.refresh_entity_stats(entity uuid) returns void
language sql volatile security definer set search_path = '' as $$
  insert into public.entity_stats as s (entity_id, reports_total, reports_reviewed, amount_reviewed_cents, last_report_at, categories, updated_at)
  select entity,
         count(*) filter (where r.status not in ('draft', 'rejected', 'withdrawn')),
         count(*) filter (where r.status = 'approved'),
         coalesce(sum(r.amount_cents) filter (where r.status = 'approved'), 0),
         max(r.submitted_at) filter (where r.status not in ('draft', 'rejected', 'withdrawn')),
         coalesce((select jsonb_object_agg(c, n) from (
            select r2.category::text c, count(*) n
              from public.report_entities re2 join public.reports r2 on r2.id = re2.report_id
             where re2.entity_id = entity and r2.status = 'approved' and r2.category is not null
             group by r2.category) x), '{}'::jsonb),
         now()
    from public.report_entities re
    left join public.reports r on r.id = re.report_id
   where re.entity_id = entity
  on conflict (entity_id) do update set
    reports_total = excluded.reports_total,
    reports_reviewed = excluded.reports_reviewed,
    amount_reviewed_cents = excluded.amount_reviewed_cents,
    last_report_at = excluded.last_report_at,
    categories = excluded.categories,
    updated_at = now()
$$;

create or replace function private.entity_stats_from_link() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op in ('INSERT', 'UPDATE') then
    if exists (select 1 from public.entities where id = new.entity_id) then
      perform private.refresh_entity_stats(new.entity_id);
    end if;
  end if;
  if tg_op in ('DELETE', 'UPDATE') then
    if exists (select 1 from public.entities where id = old.entity_id) then
      perform private.refresh_entity_stats(old.entity_id);
    end if;
  end if;
  return null;
end $$;
create trigger report_entities_stats after insert or update or delete on public.report_entities
  for each row execute function private.entity_stats_from_link();

create or replace function private.entity_stats_from_report() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  e uuid;
begin
  if (new.status, new.amount_cents, new.category, new.submitted_at)
     is not distinct from (old.status, old.amount_cents, old.category, old.submitted_at) then
    return null;
  end if;
  for e in select entity_id from public.report_entities where report_id = new.id loop
    perform private.refresh_entity_stats(e);
    if new.status = 'approved' and old.status is distinct from 'approved' then
      perform private.resolve_entity_links(e);
    end if;
  end loop;
  return null;
end $$;

------------------------------------------------------------------------------
-- Entity resolution (SPEC 8.4)
------------------------------------------------------------------------------

-- Links at 0.9 or above are confirmed by the system; below that they are suggestions in the
-- admin graph until a person confirms them. Public pages only show confirmed links.
create or replace function private.resolve_entity_links(entity uuid) returns int
language plpgsql volatile security definer set search_path = '' as $$
declare
  n int := 0;
  added int;
  me public.entities;
begin
  select * into me from public.entities where id = entity;
  if not found then
    return 0;
  end if;

  -- Same payment tag or phone (a phone typed as a Zelle or Apple Cash number counts): 0.95.
  insert into public.entity_links (a, b, reason, confidence, evidence, confirmed_at)
  select distinct on (least(i.entity_id, o.entity_id), greatest(i.entity_id, o.entity_id), reason)
         least(i.entity_id, o.entity_id), greatest(i.entity_id, o.entity_id),
         case when i.norm like '+%' then 'shared_phone' else 'shared_cashtag' end as reason,
         0.95,
         jsonb_build_object('type', i.type, 'value', public.mask_identifier(i.type, i.raw)),
         now()
    from public.entity_identifiers i
    join public.entity_identifiers o
      on o.norm = i.norm and o.entity_id <> i.entity_id
     and (o.type = i.type or (i.norm like '+%' and o.type in ('phone', 'zelle', 'paypal')))
   where i.entity_id = entity
     and i.type in ('cashtag', 'zelle', 'venmo', 'paypal', 'phone')
  on conflict do nothing;
  get diagnostics added = row_count;
  n := n + added;

  -- Same flyer or profile image in approved reports (pHash distance <= 6): 0.9.
  insert into public.entity_links (a, b, reason, confidence, evidence, confirmed_at)
  select distinct on (least(re1.entity_id, re2.entity_id), greatest(re1.entity_id, re2.entity_id))
         least(re1.entity_id, re2.entity_id), greatest(re1.entity_id, re2.entity_id),
         'same_flyer_phash', 0.9,
         jsonb_build_object('distance', bit_count((m1.phash # m2.phash)::bit(64))),
         now()
    from public.report_entities re1
    join public.reports r1 on r1.id = re1.report_id and r1.status = 'approved'
    join public.media m1 on m1.report_id = r1.id and m1.phash is not null and m1.upload_status = 'ready'
    join public.media m2 on m2.phash is not null and m2.upload_status = 'ready' and m2.report_id <> m1.report_id
     and bit_count((m1.phash # m2.phash)::bit(64)) <= 6
    join public.reports r2 on r2.id = m2.report_id and r2.status = 'approved'
    join public.report_entities re2 on re2.report_id = r2.id and re2.entity_id <> re1.entity_id
   where re1.entity_id = entity
  on conflict do nothing;
  get diagnostics added = row_count;
  n := n + added;

  -- Handles equal once trailing digits and separators are removed: 0.75 (possible rebrand).
  insert into public.entity_links (a, b, reason, confidence, evidence)
  select distinct on (least(i.entity_id, o.entity_id), greatest(i.entity_id, o.entity_id))
         least(i.entity_id, o.entity_id), greatest(i.entity_id, o.entity_id),
         'name_similarity', 0.75,
         jsonb_build_object('type', 'handle', 'a', i.raw, 'b', o.raw)
    from public.entity_identifiers i
    join public.entity_identifiers o
      on o.norm_loose = i.norm_loose and o.entity_id <> i.entity_id and o.norm <> i.norm
   where i.entity_id = entity and i.norm_loose is not null and i.norm_loose <> ''
  on conflict do nothing;
  get diagnostics added = row_count;
  n := n + added;

  -- Similar name in the same city: 0.6, a suggestion only.
  insert into public.entity_links (a, b, reason, confidence, evidence)
  select least(me.id, o.id), greatest(me.id, o.id), 'name_similarity', 0.6,
         jsonb_build_object('type', 'name', 'similarity', round(extensions.similarity(lower(me.display_name), lower(o.display_name))::numeric, 2))
    from public.entities o
   where o.id <> me.id
     and me.city is not null and lower(o.city) = lower(me.city)
     and extensions.similarity(lower(me.display_name), lower(o.display_name)) >= 0.8
  on conflict do nothing;
  get diagnostics added = row_count;
  return n + added;
end $$;

create or replace function private.resolve_on_identifier() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  perform private.resolve_entity_links(new.entity_id);
  return null;
end $$;
create trigger entity_identifiers_resolve after insert or update of norm, norm_loose on public.entity_identifiers
  for each row execute function private.resolve_on_identifier();

create trigger reports_entity_stats after update on public.reports
  for each row execute function private.entity_stats_from_report();

-- Staff can re-run resolution (admin "Find links" button, worker backfills).
create or replace function public.resolve_entity_links(entity uuid) returns int
language plpgsql security definer set search_path = '' as $$
begin
  if not (private.is_moderator() or auth.role() = 'service_role') then
    raise exception 'staff only' using errcode = 'insufficient_privilege';
  end if;
  return private.resolve_entity_links(entity);
end $$;
revoke all on function public.resolve_entity_links(uuid) from public, anon;
grant execute on function public.resolve_entity_links(uuid) to authenticated, service_role;

-- Public pages show confirmed links between public entities, each with its reason.
-- (Unchanged rule; restated here because resolution now confirms >= 0.9 automatically.)

------------------------------------------------------------------------------
-- Search (SPEC 8.2). The app classifies and normalizes (packages/search-core); this plans.
------------------------------------------------------------------------------

create index if not exists entities_name_trgm on public.entities using gin (lower(display_name) extensions.gin_trgm_ops);
create index if not exists reports_approved_tsv on public.reports using gin (story_tsv) where status = 'approved';

create or replace function public.search_everything(kind text, norm text, loose text default null, raw text default null)
returns jsonb
language plpgsql stable security definer set search_path = ''
set pg_trgm.similarity_threshold = 0.45 as $$
declare
  staff boolean := private.is_staff();
  types public.ident_type[];
  q text := coalesce(norm, '');
  out jsonb;
  under_review boolean;
begin
  if q = '' or kind not in ('cashtag', 'handle', 'phone', 'email', 'domain', 'name') then
    return jsonb_build_object('results', '[]'::jsonb, 'underReview', false);
  end if;
  types := case kind
    when 'cashtag' then array['cashtag', 'venmo']::public.ident_type[]
    when 'handle' then array['handle_ig', 'handle_tiktok', 'handle_fb', 'handle_x', 'venmo']::public.ident_type[]
    when 'phone' then array['phone', 'zelle', 'paypal']::public.ident_type[]
    when 'email' then array['email', 'zelle', 'paypal']::public.ident_type[]
    when 'domain' then array['domain', 'url']::public.ident_type[]
    else array['name']::public.ident_type[]
  end;

  with hits as (
    -- 1. exact identifier
    select i.entity_id, 1.0::float8 as score,
           case when i.type in ('handle_ig', 'handle_tiktok', 'handle_fb', 'handle_x') then 'same_handle'
                when i.type = 'cashtag' then 'same_cashtag'
                when i.type = 'phone' then 'same_phone'
                when i.type = 'email' then 'same_email'
                when i.type in ('domain', 'url') then 'same_website'
                when i.type = 'name' then 'same_name'
                else 'same_payment' end as reason,
           true as strong
      from public.entity_identifiers i
     where i.type = any (types) and i.norm = q
    union all
    -- 2. loose handle (possible rebrand)
    select i.entity_id, 0.85, 'possible_rebrand', true
      from public.entity_identifiers i
     where kind = 'handle' and loose is not null and loose <> ''
       and i.norm_loose = loose and i.norm <> q
    union all
    -- 3. fuzzy handles and names: trigram (index, threshold 0.45), best 50 candidates only,
    --    then edit distance refines the score for short strings
    select f.entity_id,
           greatest(0.4, least(0.8,
             case when char_length(q) <= 12 and extensions.levenshtein(f.norm, q) <= 2
                  then 0.8 - 0.1 * extensions.levenshtein(f.norm, q)
                  else 0.4 + 0.4 * f.sim end)),
           case when kind = 'name' then 'similar_name' else 'similar_handle' end, false
      from (select i.entity_id, i.norm, extensions.similarity(i.norm, q) as sim
              from public.entity_identifiers i
             where kind in ('handle', 'name')
               and i.type = any (case when kind = 'name' then array['name']::public.ident_type[]
                                      else array['handle_ig', 'handle_tiktok', 'handle_fb', 'handle_x']::public.ident_type[] end)
               and i.norm operator(extensions.%) q and i.norm <> q
             order by 3 desc
             limit 50) f
    union all
    select n.id, 0.4 + 0.4 * n.sim, 'similar_name', false
      from (select e.id, extensions.similarity(lower(e.display_name), lower(coalesce(raw, q))) as sim
              from public.entities e
             where kind = 'name'
               and lower(e.display_name) operator(extensions.%) lower(coalesce(raw, q))
             order by 2 desc
             limit 50) n
    union all
    -- 4. words in approved stories (best 50)
    select t.entity_id, 0.3 + 0.3 * least(1.0, t.rank * 10), 'story_match', false
      from (select re.entity_id, ts_rank(r.story_tsv, websearch_to_tsquery('english'::regconfig, coalesce(raw, q))) as rank
              from public.reports r
              join public.report_entities re on re.report_id = r.id
             where kind = 'name' and r.status = 'approved'
               and r.story_tsv @@ websearch_to_tsquery('english'::regconfig, coalesce(raw, q))
             order by 2 desc
             limit 50) t
  ),
  per_entity as (
    select h.entity_id, max(h.score) as score, array_agg(distinct h.reason) as reasons, bool_or(h.strong) as strong
      from hits h group by h.entity_id
  ),
  visible as (
    select p.*, e.slug, e.display_name, e.category, e.city, e.state, e.is_public
      from per_entity p join public.entities e on e.id = p.entity_id
     where staff or e.is_public
     order by p.score desc, e.display_name
     limit 10
  )
  select coalesce(jsonb_agg(jsonb_build_object(
           'slug', v.slug,
           'name', v.display_name,
           'category', v.category,
           'city', v.city,
           'state', v.state,
           'isPublic', v.is_public,
           'score', round(v.score::numeric, 2),
           'reasons', to_jsonb(v.reasons),
           'summary', jsonb_build_object(
             'reports', coalesce(s.reports_total, 0),
             'reviewed', coalesce(s.reports_reviewed, 0),
             'amountCents', coalesce(s.amount_reviewed_cents, 0),
             'lastReportAt', s.last_report_at,
             'categories', coalesce(s.categories, '{}'::jsonb)),
           'links', (select coalesce(jsonb_agg(jsonb_build_object(
                        'slug', o.slug, 'name', o.display_name, 'reason', l.reason,
                        'confidence', l.confidence, 'evidence', l.evidence) order by l.confidence desc), '[]'::jsonb)
                       from public.entity_links l
                       join public.entities o on o.id = case when l.a = v.entity_id then l.b else l.a end
                      where (l.a = v.entity_id or l.b = v.entity_id)
                        and l.confidence >= 0.7
                        and (staff or (l.confirmed_at is not null and o.is_public)))
         ) order by v.score desc, v.display_name), '[]'::jsonb)
    into out
    from visible v
    left join public.entity_stats s on s.entity_id = v.entity_id;

  -- A strong match on an entity the public cannot see yet: say only that reports exist.
  select exists (
    select 1 from public.entity_identifiers i join public.entities e on e.id = i.entity_id
     where not e.is_public
       and ((i.type = any (types) and i.norm = q)
         or (kind = 'handle' and loose is not null and loose <> '' and i.norm_loose = loose))
  ) into under_review;

  return jsonb_build_object('results', out, 'underReview', under_review and not staff);
end $$;
revoke all on function public.search_everything(text, text, text, text) from public;
grant execute on function public.search_everything(text, text, text, text) to anon, authenticated, service_role;

------------------------------------------------------------------------------
-- Flyer check (SPEC 8.3): pHash Hamming distance <= 10 against evidence in approved reports
------------------------------------------------------------------------------

create or replace function public.search_flyer(query_phash bigint) returns jsonb
language sql stable security definer set search_path = '' as $$
  with m as (
    select re.entity_id, r.id as report_id, bit_count((md.phash # search_flyer.query_phash)::bit(64)) as distance
      from public.media md
      join public.reports r on r.id = md.report_id and r.status = 'approved'
      join public.report_entities re on re.report_id = r.id
     where md.phash is not null and md.upload_status = 'ready'
       and bit_count((md.phash # search_flyer.query_phash)::bit(64)) <= 10
  ),
  per as (
    select entity_id, count(distinct report_id) as reports, min(distance) as best from m group by entity_id
  )
  select jsonb_build_object(
    'results', coalesce((select jsonb_agg(jsonb_build_object(
        'slug', e.slug, 'name', e.display_name, 'city', e.city, 'state', e.state,
        'matchingReports', p.reports, 'distance', p.best) order by p.best, p.reports desc)
       from per p join public.entities e on e.id = p.entity_id
      where e.is_public or private.is_staff()), '[]'::jsonb),
    'underReview', exists (select 1 from per p join public.entities e on e.id = p.entity_id
                            where not e.is_public) and not private.is_staff())
$$;
revoke all on function public.search_flyer(bigint) from public;
grant execute on function public.search_flyer(bigint) to anon, authenticated, service_role;

------------------------------------------------------------------------------
-- Public entity page (SPEC 4.2, 5): one call, public data only, masked identifiers
------------------------------------------------------------------------------

create or replace function public.entity_page(entity_slug text) returns jsonb
language sql stable security definer set search_path = '' as $$
  select case when e.id is null then null else jsonb_build_object(
    'slug', e.slug,
    'name', e.display_name,
    'category', e.category,
    'city', e.city,
    'state', e.state,
    'approvedAt', e.approved_at,
    'reply', case when e.reply_statement is not null then
               jsonb_build_object('text', e.reply_statement, 'updatedAt', e.reply_updated_at) end,
    'summary', jsonb_build_object(
      'reports', coalesce(s.reports_total, 0),
      'reviewed', coalesce(s.reports_reviewed, 0),
      'amountCents', coalesce(s.amount_reviewed_cents, 0),
      'lastReportAt', s.last_report_at,
      'categories', coalesce(s.categories, '{}'::jsonb)),
    'identifiers', (select coalesce(jsonb_agg(jsonb_build_object('type', i.type,
                      'display', case when i.verified and i.publish_full then i.raw else public.mask_identifier(i.type, i.raw) end)
                      order by i.type, i.created_at), '[]'::jsonb)
                      from public.entity_identifiers i where i.entity_id = e.id),
    'links', (select coalesce(jsonb_agg(jsonb_build_object('slug', o.slug, 'name', o.display_name,
                 'reason', l.reason, 'confidence', l.confidence, 'evidence', l.evidence) order by l.confidence desc), '[]'::jsonb)
                from public.entity_links l
                join public.entities o on o.id = case when l.a = e.id then l.b else l.a end
               where (l.a = e.id or l.b = e.id) and l.confirmed_at is not null and o.is_public),
    'excerpts', (select coalesce(jsonb_agg(jsonb_build_object('category', x.category, 'amountRange', x.amount_range,
                    'month', x.month, 'city', x.city, 'state', x.state, 'excerpt', x.public_excerpt)
                    order by x.month desc), '[]'::jsonb)
                   from public.public_report_excerpts x where x.entity_id = e.id)
  ) end
  from (select 1) one
  left join public.entities e on e.slug = entity_slug and e.is_public
  left join public.entity_stats s on s.entity_id = e.id
$$;
revoke all on function public.entity_page(text) from public;
grant execute on function public.entity_page(text) to anon, authenticated, service_role;

-- Slugs of public entities for the sitemap.
create or replace function public.public_entity_slugs() returns table (slug text, updated_at timestamptz)
language sql stable security definer set search_path = '' as $$
  select e.slug, greatest(e.updated_at, coalesce(s.updated_at, e.updated_at))
    from public.entities e left join public.entity_stats s on s.entity_id = e.id
   where e.is_public and e.slug is not null
   order by e.slug
$$;
revoke all on function public.public_entity_slugs() from public;
grant execute on function public.public_entity_slugs() to anon, authenticated, service_role;

------------------------------------------------------------------------------
-- Right of reply (SPEC 3, 4.2): the verified business rep (claimed_by) posts one statement.
------------------------------------------------------------------------------

create or replace function public.post_entity_reply(entity_slug text, statement text) returns void
language plpgsql security definer set search_path = '' as $$
declare
  target public.entities;
begin
  select * into target from public.entities where slug = entity_slug and is_public;
  if not found or target.claimed_by is distinct from auth.uid() or auth.uid() is null then
    raise exception 'only the verified business can reply' using errcode = 'insufficient_privilege';
  end if;
  if private.request_is_banned() then
    raise exception 'request refused' using errcode = 'insufficient_privilege';
  end if;
  if char_length(btrim(coalesce(statement, ''))) not between 20 and 2000 then
    raise exception 'statement must be 20 to 2000 characters' using errcode = 'check_violation';
  end if;
  update public.entities
     set reply_statement = btrim(statement), reply_updated_at = now()
   where id = target.id;
end $$;
revoke all on function public.post_entity_reply(text, text) from public, anon;
grant execute on function public.post_entity_reply(text, text) to authenticated;

-- Backfill stats and links for anything that already exists.
do $$
declare
  e uuid;
begin
  for e in select id from public.entities loop
    perform private.refresh_entity_stats(e);
    perform private.resolve_entity_links(e);
  end loop;
end $$;
