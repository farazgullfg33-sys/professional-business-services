-- ============================================================
-- Professional Business Services — Supabase Seed + Schema
-- ============================================================
-- Run this in your Supabase SQL Editor after creating the project.
-- Creates all 15 tables, RLS policies, and seed data.
-- ============================================================

-- ── Extensions ──────────────────────────────────────────────
create extension if not exists "pgcrypto";

-- ── Tables ──────────────────────────────────────────────────

create table if not exists public."Client" (
  id            text        primary key default gen_random_uuid()::text,
  name          text        not null,
  email         text,
  phone         text,
  company       text,
  "businessType" text,
  status        text        not null default 'active',
  source        text,
  notes         text,
  "createdAt"   timestamptz not null default now()
);

create table if not exists public."ServiceRequest" (
  id            text        primary key default gen_random_uuid()::text,
  "clientId"    text        not null references public."Client"(id),
  "serviceType" text        not null,
  status        text        not null default 'new',
  "assignedTo"  text,
  priority      text        not null default 'normal',
  deadline      timestamptz,
  notes         text,
  "createdAt"   timestamptz not null default now()
);

create table if not exists public."Lead" (
  id                text        primary key default gen_random_uuid()::text,
  name              text        not null,
  email             text,
  phone             text,
  "serviceInterest" text,
  message           text,
  source            text        not null default 'website',
  status            text        not null default 'new',
  "assignedTo"      text,
  "createdAt"       timestamptz not null default now()
);

create table if not exists public."Document" (
  id           text        primary key default gen_random_uuid()::text,
  "clientId"   text        not null references public."Client"(id),
  name         text        not null,
  type         text        not null,
  "fileUrl"    text        not null,
  "expiryDate" timestamptz,
  "createdAt"  timestamptz not null default now()
);

create table if not exists public."Staff" (
  id       text    primary key default gen_random_uuid()::text,
  name     text    not null,
  email    text    not null unique,
  password text    not null,
  role     text    not null default 'pro',
  active   boolean not null default true
);

create table if not exists public."ContactSubmission" (
  id          text        primary key default gen_random_uuid()::text,
  name        text        not null,
  email       text        not null,
  phone       text,
  message     text        not null,
  read        boolean     not null default false,
  "createdAt" timestamptz not null default now()
);

create table if not exists public."QuoteRequest" (
  id                text        primary key default gen_random_uuid()::text,
  name              text        not null,
  email             text        not null,
  phone             text,
  company           text,
  "serviceInterest" text        not null,
  message           text,
  status            text        not null default 'new',
  "createdAt"       timestamptz not null default now()
);

create table if not exists public."BlogPost" (
  id          text        primary key default gen_random_uuid()::text,
  title       text        not null,
  slug        text        not null unique,
  excerpt     text,
  content     text        not null,
  category    text,
  published   boolean     not null default false,
  "createdAt" timestamptz not null default now()
);

create table if not exists public."ChatbotConversation" (
  id          text        primary key default gen_random_uuid()::text,
  name        text,
  phone       text,
  email       text,
  messages    text        not null,
  lead        boolean     not null default false,
  "createdAt" timestamptz not null default now()
);

create table if not exists public."CommunicationLog" (
  id          text        primary key default gen_random_uuid()::text,
  "clientId"  text        not null references public."Client"(id),
  type        text        not null,
  "staffName" text        not null,
  summary     text        not null,
  outcome     text,
  "createdAt" timestamptz not null default now()
);

create table if not exists public."FollowUp" (
  id          text        primary key default gen_random_uuid()::text,
  "clientId"  text        not null references public."Client"(id),
  step        text        not null,
  "dueDate"   timestamptz not null,
  completed   boolean     not null default false,
  notes       text
);

create table if not exists public."Quote" (
  id          text        primary key default gen_random_uuid()::text,
  "clientId"  text        not null references public."Client"(id),
  services    text        not null,
  "govFees"   float       not null default 0,
  "proFees"   float       not null default 0,
  total       float       not null default 0,
  status      text        not null default 'draft',
  "createdAt" timestamptz not null default now()
);

create table if not exists public."Invoice" (
  id              text        primary key default gen_random_uuid()::text,
  "quoteId"       text        not null references public."Quote"(id),
  amount          float       not null,
  status          text        not null default 'pending',
  "paymentMethod" text,
  "paidAt"        timestamptz,
  "createdAt"     timestamptz not null default now()
);

create table if not exists public."FormationChecklist" (
  id          text        primary key default gen_random_uuid()::text,
  "clientId"  text        not null,
  steps       text        not null,
  "createdAt" timestamptz not null default now()
);

create table if not exists public."ComplianceDeadline" (
  id          text        primary key default gen_random_uuid()::text,
  "clientId"  text        not null,
  type        text        not null,
  "dueDate"   timestamptz not null,
  status      text        not null default 'pending'
);

-- ── Auth Users (Supabase Auth) ───────────────────────────────
-- Create Supabase auth users for staff login.
-- Passwords use bcrypt. Plain-text values:
--   admin@professionalbs.local   →  Password123!
--   manager@professionalbs.local →  Password123!
--   pro@professionalbs.local     →  Password123!

insert into auth.users (
  id, instance_id, email, encrypted_password, email_confirmed_at,
  role, aud, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data, confirmation_token, recovery_token,
  email_change_token_new, email_change
) values
(
  gen_random_uuid(), '00000000-0000-0000-0000-000000000000',
  'admin@professionalbs.local',
  crypt('Password123!', gen_salt('bf')),
  now(), 'authenticated', 'authenticated', now(), now(),
  '{"provider":"email","providers":["email"],"role":"admin"}'::jsonb,
  '{"name":"Admin User"}'::jsonb,
  '', '', '', ''
),
(
  gen_random_uuid(), '00000000-0000-0000-0000-000000000000',
  'manager@professionalbs.local',
  crypt('Password123!', gen_salt('bf')),
  now(), 'authenticated', 'authenticated', now(), now(),
  '{"provider":"email","providers":["email"],"role":"manager"}'::jsonb,
  '{"name":"Operations Manager"}'::jsonb,
  '', '', '', ''
),
(
  gen_random_uuid(), '00000000-0000-0000-0000-000000000000',
  'pro@professionalbs.local',
  crypt('Password123!', gen_salt('bf')),
  now(), 'authenticated', 'authenticated', now(), now(),
  '{"provider":"email","providers":["email"],"role":"pro"}'::jsonb,
  '{"name":"PRO Officer"}'::jsonb,
  '', '', '', ''
)
on conflict (email) do nothing;

-- ── Staff Table ──────────────────────────────────────────────
insert into public."Staff" (name, email, password, role, active) values
  ('Admin User',         'admin@professionalbs.local',   '$2a$12$placeholder_hash_admin',   'admin',   true),
  ('Operations Manager', 'manager@professionalbs.local', '$2a$12$placeholder_hash_manager', 'manager', true),
  ('PRO Officer',        'pro@professionalbs.local',     '$2a$12$placeholder_hash_pro',     'pro',     true)
on conflict (email) do nothing;

-- ── Seed: Client ─────────────────────────────────────────────
insert into public."Client" (id, name, email, phone, company, "businessType", status, source, notes) values
  ('client-jafir-001', 'Mr Jafir', 'jafir@example.com', '+971501234567',
   'Jafir Trading LLC', 'Mainland LLC', 'active', 'referral',
   'Key client — company formation + visa package')
on conflict (id) do nothing;

-- ── Seed: Leads ──────────────────────────────────────────────
insert into public."Lead" (name, email, phone, "serviceInterest", message, source, status) values
  ('Ahmed Al Mansouri', 'ahmed.mansouri@example.com', '+971502345678',
   'Residence Visa Processing',
   'I need to process my family residence visa renewal as soon as possible.',
   'website', 'new'),
  ('Ahmed Al Rashidi', 'ahmed.rashidi@example.com', '+971503456789',
   'Trade License Renewal',
   'My trade license expires next month. Need full renewal and activity amendment.',
   'website', 'new')
on conflict do nothing;

-- ── Seed: Quote ───────────────────────────────────────────────
insert into public."Quote" (id, "clientId", services, "govFees", "proFees", total, status) values
  ('quote-jafir-001', 'client-jafir-001',
   'Company Formation (Mainland LLC), Trade License, MOA Drafting, Visa Quota Approval',
   45000, 22000, 67000, 'approved')
on conflict (id) do nothing;

-- ── Seed: Invoice ─────────────────────────────────────────────
insert into public."Invoice" ("quoteId", amount, status, "paymentMethod") values
  ('quote-jafir-001', 67000, 'pending', 'Bank Transfer')
on conflict do nothing;

-- ── RLS ──────────────────────────────────────────────────────
-- Enable RLS on all public tables
alter table public."Client"               enable row level security;
alter table public."ServiceRequest"       enable row level security;
alter table public."Lead"                 enable row level security;
alter table public."Document"             enable row level security;
alter table public."Staff"                enable row level security;
alter table public."ContactSubmission"    enable row level security;
alter table public."QuoteRequest"         enable row level security;
alter table public."BlogPost"             enable row level security;
alter table public."ChatbotConversation"  enable row level security;
alter table public."CommunicationLog"     enable row level security;
alter table public."FollowUp"             enable row level security;
alter table public."Quote"                enable row level security;
alter table public."Invoice"              enable row level security;
alter table public."FormationChecklist"   enable row level security;
alter table public."ComplianceDeadline"   enable row level security;

-- Helper: extract role from auth token
create or replace function public.get_user_role()
returns text language sql stable as $$
  select coalesce(
    (auth.jwt() -> 'app_metadata' ->> 'role'),
    (auth.jwt() ->> 'role')
  );
$$;

-- ── Admin: full access to everything ─────────────────────────
create policy "admin_all_client"            on public."Client"             for all using (get_user_role() = 'admin');
create policy "admin_all_service"           on public."ServiceRequest"     for all using (get_user_role() = 'admin');
create policy "admin_all_lead"              on public."Lead"               for all using (get_user_role() = 'admin');
create policy "admin_all_document"          on public."Document"           for all using (get_user_role() = 'admin');
create policy "admin_all_staff"             on public."Staff"              for all using (get_user_role() = 'admin');
create policy "admin_all_contact"           on public."ContactSubmission"  for all using (get_user_role() = 'admin');
create policy "admin_all_quotereq"          on public."QuoteRequest"       for all using (get_user_role() = 'admin');
create policy "admin_all_blog"              on public."BlogPost"           for all using (get_user_role() = 'admin');
create policy "admin_all_chatbot"           on public."ChatbotConversation" for all using (get_user_role() = 'admin');
create policy "admin_all_commlog"           on public."CommunicationLog"   for all using (get_user_role() = 'admin');
create policy "admin_all_followup"          on public."FollowUp"           for all using (get_user_role() = 'admin');
create policy "admin_all_quote"             on public."Quote"              for all using (get_user_role() = 'admin');
create policy "admin_all_invoice"           on public."Invoice"            for all using (get_user_role() = 'admin');
create policy "admin_all_checklist"         on public."FormationChecklist" for all using (get_user_role() = 'admin');
create policy "admin_all_compliance"        on public."ComplianceDeadline" for all using (get_user_role() = 'admin');

-- ── Manager: leads + clients (read/write), rest read-only ────
create policy "manager_rw_client"    on public."Client"            for all using (get_user_role() in ('admin','manager'));
create policy "manager_rw_lead"      on public."Lead"              for all using (get_user_role() in ('admin','manager'));
create policy "manager_r_service"    on public."ServiceRequest"    for select using (get_user_role() in ('admin','manager'));
create policy "manager_r_document"   on public."Document"          for select using (get_user_role() in ('admin','manager'));
create policy "manager_r_contact"    on public."ContactSubmission" for select using (get_user_role() in ('admin','manager'));
create policy "manager_r_quotereq"   on public."QuoteRequest"      for select using (get_user_role() in ('admin','manager'));
create policy "manager_r_quote"      on public."Quote"             for select using (get_user_role() in ('admin','manager'));
create policy "manager_r_invoice"    on public."Invoice"           for select using (get_user_role() in ('admin','manager'));
create policy "manager_r_followup"   on public."FollowUp"          for select using (get_user_role() in ('admin','manager'));
create policy "manager_r_commlog"    on public."CommunicationLog"  for select using (get_user_role() in ('admin','manager'));

-- ── PRO officer: read-only on clients + services ─────────────
create policy "pro_r_client"   on public."Client"         for select using (get_user_role() in ('admin','manager','pro'));
create policy "pro_r_service"  on public."ServiceRequest" for select using (get_user_role() in ('admin','manager','pro'));
create policy "pro_r_document" on public."Document"       for select using (get_user_role() in ('admin','manager','pro'));
create policy "pro_r_followup" on public."FollowUp"       for select using (get_user_role() in ('admin','manager','pro'));

-- ── Public write (anon): contact + quote + chatbot submissions
create policy "anon_insert_contact"  on public."ContactSubmission"   for insert with check (true);
create policy "anon_insert_quotereq" on public."QuoteRequest"        for insert with check (true);
create policy "anon_insert_chatbot"  on public."ChatbotConversation" for insert with check (true);
create policy "anon_insert_lead"     on public."Lead"                for insert with check (true);
