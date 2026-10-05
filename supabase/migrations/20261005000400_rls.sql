-- Triggers, Row Level Security and grants (SPEC 7, 11).
-- RLS is enabled on every table. Anything not granted by a policy is denied. RLS is not
-- FORCEd: SECURITY DEFINER helpers (owned by postgres) must read profiles without recursing.

------------------------------------------------------------------------------
-- Triggers
------------------------------------------------------------------------------

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

create trigger profiles_guard before update on public.profiles
  for each row execute function private.profiles_guard();
create trigger reports_guard before insert or update on public.reports
  for each row execute function private.reports_guard();
create trigger entities_publish_guard before insert or update on public.entities
  for each row execute function private.entities_publish_guard();
create trigger entities_legal_hold before update or delete on public.entities
  for each row execute function private.legal_hold_guard();
create trigger cases_legal_hold before update or delete on public.cases
  for each row execute function private.legal_hold_guard();

-- Audit: staff-managed tables log every write; shared tables log staff writes only.
do $$
declare
  t text;
begin
  foreach t in array array[
    'entities', 'entity_identifiers', 'entity_links', 'report_entities', 'cases', 'case_updates',
    'episodes', 'episode_cases', 'ip_bans', 'device_bans', 'disputes'
  ] loop
    execute format(
      'create trigger audit_%1$s after insert or update or delete on public.%1$I for each row execute function private.audit_write(%2$L)',
      t, 'always');
  end loop;
  foreach t in array array['profiles', 'reports', 'media', 'content_flags', 'deletion_requests'] loop
    execute format(
      'create trigger audit_%1$s after insert or update or delete on public.%1$I for each row execute function private.audit_write(%2$L)',
      t, 'staff_only');
  end loop;
end $$;

create trigger audit_log_no_update before update or delete on public.audit_log
  for each row execute function private.audit_log_immutable();
create trigger audit_log_no_truncate before truncate on public.audit_log
  for each statement execute function private.audit_log_immutable();

------------------------------------------------------------------------------
-- Enable RLS everywhere
------------------------------------------------------------------------------

do $$
declare
  t record;
begin
  for t in select tablename from pg_tables where schemaname = 'public' loop
    execute format('alter table public.%I enable row level security', t.tablename);
  end loop;
end $$;

------------------------------------------------------------------------------
-- Policies
------------------------------------------------------------------------------

-- profiles
create policy profiles_select_own on public.profiles for select to authenticated
  using (id = auth.uid() or private.is_staff());
create policy profiles_update_own on public.profiles for update to authenticated
  using (id = auth.uid() or private.is_admin())
  with check (id = auth.uid() or private.is_admin());

-- entities
create policy entities_public_read on public.entities for select to anon, authenticated
  using (is_public or private.is_staff());
create policy entities_staff_insert on public.entities for insert to authenticated
  with check (private.is_moderator());
create policy entities_staff_update on public.entities for update to authenticated
  using (private.is_staff()) with check (private.is_staff());
create policy entities_admin_delete on public.entities for delete to authenticated
  using (private.is_admin());

-- entity_identifiers: public-safe types of public entities only. Phones, emails and
-- payment tags are only shown masked through public.public_entity_identifiers.
create policy identifiers_public_read on public.entity_identifiers for select to anon, authenticated
  using (
    private.is_staff()
    or (
      type in ('name', 'handle_ig', 'handle_tiktok', 'handle_fb', 'handle_x', 'domain', 'url')
      and exists (select 1 from public.entities e where e.id = entity_id and e.is_public)
    )
  );
create policy identifiers_staff_write on public.entity_identifiers for all to authenticated
  using (private.is_moderator()) with check (private.is_moderator());

-- entity_links: only confirmed links between public entities are public (SPEC 8.4).
create policy links_public_read on public.entity_links for select to anon, authenticated
  using (
    private.is_staff()
    or (
      confirmed_at is not null
      and exists (select 1 from public.entities e where e.id = a and e.is_public)
      and exists (select 1 from public.entities e where e.id = b and e.is_public)
    )
  );
create policy links_staff_write on public.entity_links for all to authenticated
  using (private.is_moderator()) with check (private.is_moderator());

-- reports: reporters see and edit their own; anonymous reports go through edge functions.
create policy reports_select_own on public.reports for select to authenticated
  using (reporter_id = auth.uid() or private.is_staff());
create policy reports_insert_own on public.reports for insert to authenticated
  with check (reporter_id = auth.uid() and private.is_onboarded() and not private.request_is_banned());
create policy reports_update_own on public.reports for update to authenticated
  using (
    (reporter_id = auth.uid() and status in ('draft', 'needs_evidence') and not private.request_is_banned())
    or private.is_moderator()
  )
  with check (reporter_id = auth.uid() or private.is_moderator());
create policy reports_staff_delete on public.reports for delete to authenticated
  using (private.is_admin());

create policy report_entities_read on public.report_entities for select to authenticated
  using (
    private.is_staff()
    or exists (select 1 from public.reports r where r.id = report_id and r.reporter_id = auth.uid())
  );
create policy report_entities_staff_write on public.report_entities for all to authenticated
  using (private.is_moderator()) with check (private.is_moderator());

-- media: own report's evidence only. Uploads are created by the media function (Phase 2).
create policy media_select_own on public.media for select to authenticated
  using (
    private.is_staff()
    or exists (select 1 from public.reports r where r.id = report_id and r.reporter_id = auth.uid())
  );
create policy media_staff_write on public.media for all to authenticated
  using (private.is_moderator()) with check (private.is_moderator());

-- cases + updates
create policy cases_public_read on public.cases for select to anon, authenticated
  using (published or private.is_staff());
create policy cases_editor_write on public.cases for all to authenticated
  using (private.is_editor()) with check (private.is_editor());

create policy case_updates_public_read on public.case_updates for select to anon, authenticated
  using (
    private.is_staff()
    or exists (select 1 from public.cases c where c.id = case_id and c.published)
  );
create policy case_updates_editor_write on public.case_updates for all to authenticated
  using (private.is_editor()) with check (private.is_editor());

-- episodes
create policy episodes_public_read on public.episodes for select to anon, authenticated
  using ((published and publish_at is not null and publish_at <= now()) or private.is_staff());
create policy episodes_editor_write on public.episodes for all to authenticated
  using (private.is_editor()) with check (private.is_editor());

create policy episode_cases_public_read on public.episode_cases for select to anon, authenticated
  using (
    private.is_staff()
    or (
      exists (select 1 from public.episodes e where e.id = episode_id and e.published and e.publish_at <= now())
      and exists (select 1 from public.cases c where c.id = case_id and c.published)
    )
  );
create policy episode_cases_editor_write on public.episode_cases for all to authenticated
  using (private.is_editor()) with check (private.is_editor());

-- member-owned rows
create policy watchlist_own on public.watchlist for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid() and private.is_onboarded() and not private.request_is_banned());
create policy follows_own on public.follows for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid() and private.is_onboarded() and not private.request_is_banned());
create policy notifications_own_read on public.notifications for select to authenticated
  using (user_id = auth.uid());
create policy notifications_own_mark_read on public.notifications for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy push_tokens_own on public.push_tokens for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy blocks_own on public.user_blocks for all to authenticated
  using (blocker = auth.uid()) with check (blocker = auth.uid());

-- content flags (Apple 1.2): members flag; staff resolve.
create policy flags_insert on public.content_flags for insert to authenticated
  with check (reporter_id = auth.uid() and resolved_at is null and not private.request_is_banned());
create policy flags_read on public.content_flags for select to authenticated
  using (reporter_id = auth.uid() or private.is_staff());
create policy flags_staff_update on public.content_flags for update to authenticated
  using (private.is_moderator()) with check (private.is_moderator());

-- disputes: submitted through the API (service role); business reps read their entity's.
create policy disputes_read on public.disputes for select to authenticated
  using (
    private.is_staff()
    or exists (select 1 from public.entities e where e.id = entity_id and e.claimed_by = auth.uid())
  );
create policy disputes_staff_update on public.disputes for update to authenticated
  using (private.is_staff()) with check (private.is_staff());

-- bans: admins only (SPEC 3).
create policy ip_bans_admin on public.ip_bans for all to authenticated
  using (private.is_admin()) with check (private.is_admin());
create policy device_bans_admin on public.device_bans for all to authenticated
  using (private.is_admin()) with check (private.is_admin());

-- consents: written by RPCs / submit function; users can read their own.
create policy consents_read on public.consents_log for select to authenticated
  using (user_id = auth.uid() or private.is_staff());

-- deletion requests
create policy deletion_insert_own on public.deletion_requests for insert to authenticated
  with check (user_id = auth.uid() and status = 'open' and completed_at is null);
create policy deletion_read on public.deletion_requests for select to authenticated
  using (user_id = auth.uid() or private.is_staff());
create policy deletion_staff_update on public.deletion_requests for update to authenticated
  using (private.is_admin()) with check (private.is_admin());

-- audit log: admins read; nobody writes directly (the audit trigger runs as definer).
create policy audit_admin_read on public.audit_log for select to authenticated
  using (private.is_admin());

-- rate_limits: no policies. Only the service role (bypasses RLS) touches it.

------------------------------------------------------------------------------
-- Public read models
------------------------------------------------------------------------------

-- Every identifier of a public entity, masked unless verified + cleared for full display.
create view public.public_entity_identifiers with (security_barrier) as
  select
    i.id,
    i.entity_id,
    i.type,
    case when i.verified and i.publish_full then i.raw else public.mask_identifier(i.type, i.raw) end as display
  from public.entity_identifiers i
  join public.entities e on e.id = i.entity_id
  where e.is_public;

-- Approved, moderator-redacted excerpts. No reporter, no exact amount, no exact date.
create view public.public_report_excerpts with (security_barrier) as
  select
    re.entity_id,
    r.category,
    public.amount_range(r.amount_cents) as amount_range,
    to_char(coalesce(r.paid_on, r.submitted_at::date), 'YYYY-MM') as month,
    r.city,
    r.state,
    r.public_excerpt
  from public.reports r
  join public.report_entities re on re.report_id = r.id
  join public.entities e on e.id = re.entity_id
  where r.status = 'approved' and r.public_excerpt is not null and e.is_public;

------------------------------------------------------------------------------
-- Grants
------------------------------------------------------------------------------

grant select on public.public_entity_identifiers, public.public_report_excerpts to anon, authenticated;

-- Helper functions used inside policies.
revoke all on all functions in schema private from public;
grant execute on all functions in schema private to anon, authenticated, service_role;

-- RPCs.
revoke all on function public.is_banned(inet, text) from public, anon, authenticated;
grant execute on function public.is_banned(inet, text) to service_role;
revoke all on function public.check_rate_limit(text, int, double precision, int) from public, anon, authenticated;
grant execute on function public.check_rate_limit(text, int, double precision, int) to service_role;
revoke all on function public.prune_rate_limits() from public, anon, authenticated;
grant execute on function public.prune_rate_limits() to service_role;
revoke all on function public.confirm_age(date) from public, anon;
grant execute on function public.confirm_age(date) to authenticated;
revoke all on function public.accept_terms(text) from public, anon;
grant execute on function public.accept_terms(text) to authenticated;

-- Defense in depth on top of RLS.
revoke all on public.rate_limits from anon, authenticated;
revoke all on public.audit_log from anon, authenticated;
grant select on public.audit_log to authenticated;
revoke update, delete, truncate on public.audit_log from service_role;
