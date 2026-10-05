-- FAKE DEMO DATA ONLY (SPEC 12, 17). Every name ends in .demo. Never load in production.
-- `supabase db reset` loads this after migrations on local development databases.

insert into public.entities (id, slug, display_name, category, city, state)
values
  ('5eed0000-0000-0000-0000-000000000001', 'nailz-by-tee-demo', 'Nailz by Tee (demo)', 'deposit_no_show', 'Atlanta', 'GA'),
  ('5eed0000-0000-0000-0000-000000000002', 'nailz2-demo', 'nailz2.demo', 'deposit_no_show', 'Atlanta', 'GA'),
  ('5eed0000-0000-0000-0000-000000000003', 'kash-kings-fx-demo', 'Kash Kings FX (demo)', 'forex_trading', 'Decatur', 'GA');

insert into public.entity_identifiers (entity_id, type, raw, norm, norm_loose) values
  ('5eed0000-0000-0000-0000-000000000001', 'handle_ig', '@nailz.demo', 'nailz.demo', 'nailzdemo'),
  ('5eed0000-0000-0000-0000-000000000001', 'cashtag', '$TeeLacesDemo', 'teelacesdemo', null),
  ('5eed0000-0000-0000-0000-000000000001', 'phone', '(404) 555-0100', '+14045550100', null),
  ('5eed0000-0000-0000-0000-000000000002', 'handle_ig', '@nailz2.demo', 'nailz2.demo', 'nailzdemo'),
  ('5eed0000-0000-0000-0000-000000000002', 'cashtag', '$TeeLacesDemo', 'teelacesdemo', null),
  ('5eed0000-0000-0000-0000-000000000003', 'handle_ig', '@kashkings.demo', 'kashkings.demo', 'kashkingsdemo');

insert into public.entity_links (a, b, reason, confidence, evidence) values
  ('5eed0000-0000-0000-0000-000000000001', '5eed0000-0000-0000-0000-000000000002', 'shared_cashtag', 0.95,
   '{"cashtag": "teelacesdemo"}');

insert into public.cases (slug, title, entity_id, category, city, state, status, summary, published)
values ('the-75-booking-demo', 'The $75 booking that never happened (demo)', '5eed0000-0000-0000-0000-000000000001',
        'deposit_no_show', 'Atlanta', 'GA', 'contacted', 'Demo case for local development.', false);

insert into public.episodes (slug, season, number, title, kind, description, published)
values ('books-open-demo', 1, 1, 'Books Open (demo)', 'episode', 'Demo episode for local development.', false);
