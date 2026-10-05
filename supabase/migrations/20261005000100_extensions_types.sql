-- SPEC.md section 7: extensions and enums.
-- Extensions live in the `extensions` schema (Supabase convention). Functions always
-- qualify names and pin search_path.

create schema if not exists extensions;

create extension if not exists pg_trgm with schema extensions;
create extension if not exists unaccent with schema extensions;
create extension if not exists fuzzystrmatch with schema extensions;
create extension if not exists vector with schema extensions;
create extension if not exists citext with schema extensions;

-- Helper functions that RLS policies call. Not exposed through the API (PostgREST only
-- exposes `public`), but anon/authenticated need USAGE so policies can evaluate them.
create schema if not exists private;
grant usage on schema private to anon, authenticated, service_role;

create type public.role as enum ('member', 'moderator', 'editor', 'admin', 'business');
create type public.report_status as enum (
  'draft', 'submitted', 'triage', 'needs_evidence', 'ready_for_review', 'approved', 'rejected', 'withdrawn'
);
create type public.case_status as enum (
  'reported', 'verifying', 'contacted', 'response_received', 'no_response',
  'resolved_refunded', 'resolved_other', 'closed'
);
create type public.ident_type as enum (
  'name', 'handle_ig', 'handle_tiktok', 'handle_fb', 'handle_x', 'cashtag', 'zelle', 'venmo',
  'paypal', 'phone', 'email', 'domain', 'url', 'address'
);
create type public.pay_rail as enum (
  'cashapp', 'zelle', 'venmo', 'paypal', 'apple_cash', 'card', 'bank', 'crypto', 'cash', 'other'
);
create type public.category as enum (
  'deposit_no_show', 'not_delivered', 'bad_service_no_refund', 'credit_repair', 'forex_trading',
  'fake_giveaway_clout', 'romance_catfish', 'other'
);
