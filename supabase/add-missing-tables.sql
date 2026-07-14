-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/bvaykkygqxbbrfxbnyhv/sql

create table if not exists public."FollowUp" (
  id text primary key default gen_random_uuid()::text,
  step text,
  "dueDate" timestamptz,
  "clientId" text references public."Client"(id) on delete cascade,
  status text default 'pending',
  "createdAt" timestamptz not null default now()
);

create table if not exists public."ContactSubmission" (
  id text primary key default gen_random_uuid()::text,
  name text,
  email text,
  phone text,
  message text,
  "createdAt" timestamptz not null default now()
);

create table if not exists public."QuoteRequest" (
  id text primary key default gen_random_uuid()::text,
  name text,
  email text,
  phone text,
  company text,
  service text,
  "serviceInterest" text,
  message text,
  status text default 'new',
  "createdAt" timestamptz not null default now()
);

-- Enable RLS
alter table public."FollowUp" enable row level security;
alter table public."ContactSubmission" enable row level security;
alter table public."QuoteRequest" enable row level security;

-- Admin can do everything
create policy if not exists "admin_all_followup" on public."FollowUp"
  for all using (auth.jwt() ->> 'role' = 'admin' or (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

create policy if not exists "admin_all_contactsub" on public."ContactSubmission"
  for all using (auth.jwt() ->> 'role' = 'admin' or (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

create policy if not exists "admin_all_quotereq" on public."QuoteRequest"
  for all using (auth.jwt() ->> 'role' = 'admin' or (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- Anon can insert (public forms)
create policy if not exists "anon_insert_contactsub" on public."ContactSubmission"
  for insert with check (true);

create policy if not exists "anon_insert_quotereq" on public."QuoteRequest"
  for insert with check (true);
