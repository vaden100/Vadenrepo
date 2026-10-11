-- Phase 4: deep search, rebrand linking, visibility, stats, flyer check, entity page, reply.
begin;
select plan(26);

select tests.create_user('member') as reporter \gset
select tests.create_user('member') as owner \gset
select tests.create_user('moderator') as mod \gset

-- nailz and nailz2 share a cashtag (SPEC 16 Phase 4 acceptance).
insert into public.entities (id, slug, display_name, city, state, is_public) values
  ('00000000-0000-0000-0000-00000000e001', 'nailz-t', 'Nailz by Tee', 'Atlanta', 'GA', true),
  ('00000000-0000-0000-0000-00000000e002', 'nailz2-t', 'nailz2', 'Atlanta', 'GA', true),
  ('00000000-0000-0000-0000-00000000e003', 'hidden-t', 'Hidden Lashes', 'Macon', 'GA', false);
insert into public.entity_identifiers (entity_id, type, raw, norm, norm_loose) values
  ('00000000-0000-0000-0000-00000000e001', 'handle_ig', '@nailz', 'nailz', 'nailz'),
  ('00000000-0000-0000-0000-00000000e001', 'cashtag', '$NailzPay', 'nailzpay', null),
  ('00000000-0000-0000-0000-00000000e001', 'phone', '(404) 555-0100', '+14045550100', null),
  ('00000000-0000-0000-0000-00000000e002', 'handle_ig', '@nailz2', 'nailz2', 'nailz'),
  ('00000000-0000-0000-0000-00000000e002', 'cashtag', '$NailzPay', 'nailzpay', null),
  ('00000000-0000-0000-0000-00000000e003', 'cashtag', '$HiddenLash', 'hiddenlash', null),
  ('00000000-0000-0000-0000-00000000e003', 'zelle', '478-555-0199', '+14785550199', null);

select is(
  (select reason || ':' || confidence::text || ':' || (confirmed_at is not null)::text from public.entity_links
    where a = '00000000-0000-0000-0000-00000000e001' and b = '00000000-0000-0000-0000-00000000e002' and reason = 'shared_cashtag'),
  'shared_cashtag:0.95:true', 'shared cashtag links nailz and nailz2, confirmed at 0.95');
select is(
  (select confidence::text || ':' || (confirmed_at is null)::text from public.entity_links
    where a = '00000000-0000-0000-0000-00000000e001' and b = '00000000-0000-0000-0000-00000000e002' and reason = 'name_similarity'),
  '0.75:true', 'loose handle match is only a suggestion');
select is((select evidence ->> 'value' from public.entity_links where reason = 'shared_cashtag' and a = '00000000-0000-0000-0000-00000000e001'),
  '$N•••lzPay', 'link evidence is masked');

-- Public search
select tests.as_anon();
select is(jsonb_array_length(public.search_everything('cashtag', 'nailzpay') -> 'results'), 2, 'cashtag finds both pages');
select is(public.search_everything('cashtag', 'nailzpay') -> 'results' -> 0 -> 'reasons', '["same_cashtag"]'::jsonb, 'why it matched');
select is(
  (select l ->> 'reason' from jsonb_array_elements(public.search_everything('handle', 'nailz', 'nailz') -> 'results' -> 0 -> 'links') l limit 1),
  'shared_cashtag', 'linked page comes with its reason');
select ok(
  not exists (select 1 from jsonb_array_elements(public.search_everything('handle', 'nailz', 'nailz') -> 'results' -> 0 -> 'links') l
               where (l ->> 'confidence')::float < 0.9),
  'unconfirmed suggestions are not shown publicly');
select ok(public.search_everything('handle', 'nailz2', 'nailz') -> 'results' @> '[{"slug": "nailz-t", "reasons": ["possible_rebrand"]}]',
  'nailz2 finds nailz as a possible rebrand');
select ok(public.search_everything('handle', 'nailzz', 'nailzz') -> 'results' @> '[{"slug": "nailz-t"}]', 'one typo still finds it');
select is(public.search_everything('phone', '+14045550100') -> 'results' -> 0 ->> 'slug', 'nailz-t', 'phone finds the page');

-- Not public yet: only "under review", never details
select is(public.search_everything('cashtag', 'hiddenlash'), '{"results": [], "underReview": true}'::jsonb,
  'non-public entity returns under review only');
select is(public.search_everything('phone', '+14785550199') ->> 'underReview', 'true', 'phone typed as Zelle number counts');
select is(public.search_everything('cashtag', 'nobodyatall'), '{"results": [], "underReview": false}'::jsonb, 'no match');
select is(public.search_everything('name', 'hidden lashes'), '{"results": [], "underReview": false}'::jsonb,
  'a fuzzy name match on a hidden entity does not even say under review');
select is(public.entity_page('hidden-t'), null, 'hidden entity page does not exist publicly');
select tests.as_postgres();
select tests.as_user(:'mod', 'aal2');
select is(public.search_everything('cashtag', 'hiddenlash') -> 'results' -> 0 ->> 'slug', 'hidden-t', 'staff see non-public matches');
select tests.as_postgres();

-- Unreviewed reports never surface their identifiers
insert into public.reports (id, reporter_id, status, story, amount_cents, category, submitted_at, public_excerpt)
values ('00000000-0000-0000-0000-0000000000f1', :'reporter', 'triage', 'They took my $250 deposit for nails.', 25000, 'deposit_no_show', now(), null);
insert into public.report_identifiers (report_id, field, type, raw, norm)
values ('00000000-0000-0000-0000-0000000000f1', 'cashtag', 'cashtag', '$OnlyInAReport', 'onlyinareport');
select tests.as_anon();
select is(public.search_everything('cashtag', 'onlyinareport'), '{"results": [], "underReview": false}'::jsonb,
  'identifiers from unreviewed reports are never shown');
select tests.as_postgres();

-- Stats follow the moderation status
insert into public.report_entities values ('00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-00000000e001');
select is((select reports_total || '/' || reports_reviewed from public.entity_stats where entity_id = '00000000-0000-0000-0000-00000000e001'),
  '1/0', 'reported once, none reviewed yet');
update public.reports set status = 'approved', public_excerpt = 'Deposit taken, no show.' where id = '00000000-0000-0000-0000-0000000000f1';
select is((select reports_reviewed || ':' || amount_reviewed_cents from public.entity_stats where entity_id = '00000000-0000-0000-0000-00000000e001'),
  '1:25000', 'approval updates the summary');
select tests.as_anon();
select is((public.search_everything('name', 'deposit nails', null, 'deposit nails') -> 'results' -> 0 -> 'reasons'), '["story_match"]'::jsonb,
  'words in approved stories find the page');

-- Entity page
select is(public.entity_page('nailz-t') -> 'summary' ->> 'reviewed', '1', 'page shows reviewed count');
select ok(public.entity_page('nailz-t') -> 'identifiers' @> '[{"type": "phone", "display": "(•••) •••-0100"}]', 'phone is masked');
select ok(public.entity_page('nailz-t') -> 'excerpts' @> '[{"excerpt": "Deposit taken, no show.", "amountRange": "$250 to $500"}]',
  'approved excerpt with an amount range, not the exact amount');
select tests.as_postgres();

-- Flyer check: Hamming distance <= 10
insert into public.media (report_id, kind, storage_path, upload_status, phash)
values ('00000000-0000-0000-0000-0000000000f1', 'image', 'x', 'ready', 1234567890123);
select tests.as_anon();
select is(public.search_flyer(1234567890123 # 7) -> 'results' -> 0 ->> 'slug', 'nailz-t', 'near-identical flyer matches');
select is(jsonb_array_length(public.search_flyer(~1234567890123) -> 'results'), 0, 'a different image does not');
select tests.as_postgres();

-- Right of reply: only the verified business
update public.entities set claimed_by = :'owner' where id = '00000000-0000-0000-0000-00000000e001';
select tests.as_user(:'reporter');
select throws_ok($$ select public.post_entity_reply('nailz-t', 'We refunded everyone who asked, see receipts.') $$,
  '42501', null, 'only the claimed owner can reply');
select tests.as_postgres();

select * from finish();
rollback;
