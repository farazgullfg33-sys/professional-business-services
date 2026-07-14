-- Run in Supabase SQL Editor: https://supabase.com/dashboard/project/bvaykkygqxbbrfxbnyhv/sql
-- Creates Visa, License tables; rebuilds FormationChecklist with per-step rows;
-- adds notes column to ComplianceDeadline; sets RLS on all new tables.

-- ── FormationChecklist (rebuild with per-step row schema) ────────
-- The seed had a flat `steps text` field; we need individual rows per step.
drop table if exists public."FormationChecklist";
create table public."FormationChecklist" (
  id          text        primary key default gen_random_uuid()::text,
  "clientId"  text        references public."Client"(id) on delete cascade,
  step        integer     not null,
  name        text        not null,
  completed   boolean     not null default false,
  notes       text,
  "createdAt" timestamptz not null default now()
);

-- ── ComplianceDeadline (add notes if missing) ────────────────────
alter table public."ComplianceDeadline" add column if not exists notes text;

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

-- ── RLS ──────────────────────────────────────────────────────────
alter table public."FormationChecklist" enable row level security;
alter table public."Visa"               enable row level security;
alter table public."License"            enable row level security;

create policy "admin_all_formation_v2" on public."FormationChecklist"
  for all using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

create policy "admin_all_visa" on public."Visa"
  for all using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

create policy "admin_all_license" on public."License"
  for all using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- Manager + PRO read access
create policy "mgr_r_formation" on public."FormationChecklist"
  for select using ((auth.jwt() -> 'app_metadata' ->> 'role') in ('admin','manager','pro'));

create policy "mgr_r_visa" on public."Visa"
  for select using ((auth.jwt() -> 'app_metadata' ->> 'role') in ('admin','manager','pro'));

create policy "mgr_r_license" on public."License"
  for select using ((auth.jwt() -> 'app_metadata' ->> 'role') in ('admin','manager','pro'));
