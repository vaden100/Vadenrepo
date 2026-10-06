-- Age gate + terms (SPEC 12), masking, two-person rule (SPEC 3) and legal hold (SPEC 10.8).
begin;
select plan(26);

select tests.create_user('member', false) as u \gset
select tests.as_user(:'u');
select is(
  public.confirm_age((current_date - interval '18 years' + interval '1 day')::date),
  false, 'one day short of 18 is refused');
select is(
  (select age_confirmed_at from public.profiles where id = auth.uid()),
  null, 'refusal does not confirm age');
select is(
  public.confirm_age((current_date - interval '18 years')::date),
  true, 'exactly 18 is accepted');
select throws_ok($$ select public.accept_terms('v1') $$, '22023', null, 'terms version must be a date');
select lives_ok($$ select public.accept_terms('2026-10-05') $$, 'terms accepted');
select tests.as_postgres();
select ok(
  (select age_confirmed_at is not null and terms_accepted_at is not null and terms_version = '2026-10-05'
     from public.profiles where id = :'u'),
  'profile records age confirmation and terms version');
select set_eq(
  format($$ select consent || ':' || value from public.consents_log where user_id = %L $$, :'u'),
  array['age_18_plus:false', 'age_18_plus:true', 'terms_privacy:true'],
  'every consent decision is logged (birth date is not stored)');
select hasnt_column('public', 'profiles', 'birth_date', 'birth date is never stored');

-- Masking
select is(public.mask_identifier('phone', '+14045554417'), '(•••) •••-4417', 'phone mask');
select is(public.mask_identifier('email', 'tee@gmail.com'), 't•••@gmail.com', 'email mask');
select is(public.mask_identifier('cashtag', '$TeeLaces'), '$T•••Laces', 'cashtag mask');
select is(public.mask_identifier('zelle', '404-555-1234'), '(•••) •••-1234', 'zelle phone mask');
select is(public.mask_identifier('handle_ig', '@nailz2'), '@nailz2', 'handles are public');
select is(public.mask_identifier('cashtag', '$Bob'), '$B•••', 'short cashtags reveal only the first letter');

-- Two-person rule (approvals are rows written by approve_entity() for the caller only)
select tests.create_user('moderator') as m1 \gset
select tests.create_user('moderator') as m2 \gset
select tests.create_user('editor') as e1 \gset
insert into public.entities (id, display_name) values ('00000000-0000-0000-0000-0000000000f1', 'Two Person Demo');
select tests.as_user(:'m1', 'aal2');
select throws_ok(
  format($$ update public.entities set approved_by = array[%L, %L]::uuid[] where id = '00000000-0000-0000-0000-0000000000f1' $$, :'m1', :'e1'),
  '42501', null, 'nobody can write approvals for someone else');
select is(public.approve_entity('00000000-0000-0000-0000-0000000000f1'), 1, 'moderator approves');
select is(public.approve_entity('00000000-0000-0000-0000-0000000000f1'), 1, 'approving twice still counts once');
select throws_ok(
  $$ update public.entities set is_public = true where id = '00000000-0000-0000-0000-0000000000f1' $$,
  '23514', null, 'one approval cannot publish');
select tests.as_postgres();
select tests.as_user(:'m2', 'aal2');
select is(public.approve_entity('00000000-0000-0000-0000-0000000000f1'), 2, 'second moderator approves');
select throws_ok(
  $$ update public.entities set is_public = true where id = '00000000-0000-0000-0000-0000000000f1' $$,
  '23514', null, 'two moderators (no editor) cannot publish');
select tests.as_postgres();
select tests.as_user(:'e1', 'aal1');
select throws_ok($$ select public.approve_entity('00000000-0000-0000-0000-0000000000f1') $$,
  '42501', null, 'staff without 2FA cannot approve');
select tests.as_postgres();
select tests.as_user(:'e1', 'aal2');
select is(public.approve_entity('00000000-0000-0000-0000-0000000000f1'), 3, 'editor approves');
select lives_ok(
  $$ update public.entities set is_public = true where id = '00000000-0000-0000-0000-0000000000f1' $$,
  'moderator + editor can publish');
select isnt((select approved_at from public.entities where id = '00000000-0000-0000-0000-0000000000f1'), null, 'approval time recorded');
update public.entities set is_public = false where id = '00000000-0000-0000-0000-0000000000f1';
select is((select count(*)::int from public.entity_approvals where entity_id = '00000000-0000-0000-0000-0000000000f1'), 0,
  'unpublishing clears approvals');
select tests.as_postgres();

-- Legal hold
select tests.as_postgres();
update public.entities set legal_hold = true where id = '00000000-0000-0000-0000-0000000000f1';
select tests.as_user(:'m1', 'aal2');
select throws_ok(
  $$ update public.entities set city = 'Elsewhere' where id = '00000000-0000-0000-0000-0000000000f1' $$,
  '42501', null, 'legal hold freezes edits');

select * from finish();
rollback;
