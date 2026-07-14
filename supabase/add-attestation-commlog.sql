-- Run in Supabase SQL Editor: https://supabase.com/dashboard/project/bvaykkygqxbbrfxbnyhv/sql
-- Creates Attestation table; adds subject/notes columns to CommunicationLog.

-- ── Attestation ──────────────────────────────────────────────────
create table if not exists public."Attestation" (
  id             text        primary key default gen_random_uuid()::text,
  "clientId"     text        references public."Client"(id) on delete cascade,
  "documentName" text        not null,
  "documentType" text,       -- educational, commercial, personal
  checkpoint     text        not null default 'original_received',
  -- original_received → notary → mofa → embassy → delivered
  status         text        not null default 'in_progress',
  -- in_progress, completed, on_hold
  notes          text,
  "createdAt"    timestamptz not null default now()
);

alter table public."Attestation" enable row level security;

create policy "admin_all_attestation" on public."Attestation"
  for all using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

create policy "mgr_r_attestation" on public."Attestation"
  for select using ((auth.jwt() -> 'app_metadata' ->> 'role') in ('admin','manager','pro'));

-- ── CommunicationLog extra columns (table already exists from seed) ──
alter table public."CommunicationLog" add column if not exists subject text;
alter table public."CommunicationLog" add column if not exists notes  text;
