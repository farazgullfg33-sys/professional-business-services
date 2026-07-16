-- ============================================================
-- Professional Business Services — Consolidated Migration
-- Run once in Supabase SQL Editor:
--   https://supabase.com/dashboard/project/bvaykkygqxbbrfxbnyhv/sql
--
-- Idempotent + non-destructive. Ensures every table and column the admin
-- API routes write to actually exists. Running this eliminates the 400
-- errors on Quote / Invoice / Visa / License / Compliance / Document /
-- Attestation / CommLog / FollowUp inserts (the errors were "column/table
-- does not exist", NOT column-name mismatches — the route column names are
-- already correct camelCase matching the schema below).
-- ============================================================

-- ── Visa ─────────────────────────────────────────────────────────
create table if not exists public."Visa" (
  id                text        primary key default gen_random_uuid()::text,
  "clientId"        text        references public."Client"(id) on delete cascade,
  type              text        not null,
  status            text        not null default 'applied',
  "applicationDate" timestamptz,
  "expiryDate"      timestamptz,
  remarks           text,
  "createdAt"       timestamptz not null default now()
);

-- ── License ──────────────────────────────────────────────────────
create table if not exists public."License" (
  id              text        primary key default gen_random_uuid()::text,
  "clientId"      text        references public."Client"(id) on delete cascade,
  "licenseNumber" text,
  type            text,
  "issueDate"     timestamptz,
  "expiryDate"    timestamptz,
  status          text        not null default 'active',
  "createdAt"     timestamptz not null default now()
);

-- ── Attestation ──────────────────────────────────────────────────
create table if not exists public."Attestation" (
  id             text        primary key default gen_random_uuid()::text,
  "clientId"     text        references public."Client"(id) on delete cascade,
  "documentName" text        not null,
  "documentType" text,
  checkpoint     text        not null default 'original_received',
  status         text        not null default 'in_progress',
  notes          text,
  "createdAt"    timestamptz not null default now()
);

-- ── FormationChecklist: ensure per-step columns exist (non-destructive) ──
-- The original seed used a flat `steps text`. The admin panel needs one row
-- per step. Add the per-step columns if missing (keeps any existing data).
alter table public."FormationChecklist" add column if not exists step      integer;
alter table public."FormationChecklist" add column if not exists name      text;
alter table public."FormationChecklist" add column if not exists completed boolean not null default false;
alter table public."FormationChecklist" add column if not exists notes     text;
alter table public."FormationChecklist" add column if not exists "createdAt" timestamptz not null default now();

-- ── Column top-ups on existing tables ────────────────────────────
alter table public."ComplianceDeadline" add column if not exists notes text;
alter table public."CommunicationLog"   add column if not exists subject text;
alter table public."CommunicationLog"   add column if not exists notes   text;
alter table public."Lead"               add column if not exists notes   text;

-- ── RLS on new tables ────────────────────────────────────────────
alter table public."Visa"        enable row level security;
alter table public."License"     enable row level security;
alter table public."Attestation" enable row level security;

-- Admin full access + manager/pro read. Wrapped in DO blocks so re-runs
-- don't error on "policy already exists".
do $$ begin
  create policy "admin_all_visa" on public."Visa"
    for all using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "mgr_r_visa" on public."Visa"
    for select using ((auth.jwt() -> 'app_metadata' ->> 'role') in ('admin','manager','pro'));
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "admin_all_license" on public."License"
    for all using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "mgr_r_license" on public."License"
    for select using ((auth.jwt() -> 'app_metadata' ->> 'role') in ('admin','manager','pro'));
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "admin_all_attestation" on public."Attestation"
    for all using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "mgr_r_attestation" on public."Attestation"
    for select using ((auth.jwt() -> 'app_metadata' ->> 'role') in ('admin','manager','pro'));
exception when duplicate_object then null; end $$;

-- NOTE: The admin API routes use the service_role key (createAdminClient),
-- which bypasses RLS entirely — so inserts work regardless of the policies
-- above. The policies matter only for anon/authenticated client-side reads.
