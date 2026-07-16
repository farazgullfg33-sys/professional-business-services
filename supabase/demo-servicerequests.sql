-- ============================================================
-- Demo data — Clients + ServiceRequests for Pipeline Overview
-- Run in Supabase SQL Editor:
--   https://supabase.com/dashboard/project/bvaykkygqxbbrfxbnyhv/sql
--
-- Idempotent: fixed IDs + ON CONFLICT DO NOTHING, safe to re-run.
-- Statuses use the pipeline columns the admin kanban renders:
--   new · in_progress · review · completed   (+ delivered is also valid)
-- ============================================================

-- ── Ensure the FK relationship exists so PostgREST joins work ────
-- (Harmless if already present.) Pipeline Overview no longer depends on
-- this join, but the pro-supabase-tools skill and related-record reads do.
do $$
begin
  if not exists (
    select 1 from information_schema.table_constraints
    where constraint_name = 'ServiceRequest_clientId_fkey'
      and table_name = 'ServiceRequest'
  ) then
    alter table public."ServiceRequest"
      add constraint "ServiceRequest_clientId_fkey"
      foreign key ("clientId") references public."Client"(id) on delete cascade;
  end if;
end $$;

-- ── Demo Clients ─────────────────────────────────────────────────
insert into public."Client" (id, name, email, phone, company, "businessType", status, source, notes) values
  ('demo-cl-alfahim',  'Khalid Al Fahim',   'khalid@alfahimgroup.ae',  '+971501112233', 'Al Fahim Trading LLC',        'trade',      'active', 'referral', 'Mainland trading — multi-service'),
  ('demo-cl-noor',     'Noor Enterprises',  'ops@noorent.ae',          '+971502223344', 'Noor Enterprises FZ-LLC',     'services',   'active', 'website',  'Freezone client'),
  ('demo-cl-emirates', 'Sara Al Zaabi',     'sara@emiratesconsult.ae', '+971503334455', 'Emirates Consulting Partners','consulting', 'active', 'direct',   'Golden visa + compliance'),
  ('demo-cl-gulftech', 'Omar Haddad',       'omar@gulftech.ae',        '+971504445566', 'Gulf Tech Solutions',         'tech',       'active', 'social',   'Tech startup, first license'),
  ('demo-cl-marina',   'Marina Holdings',   'admin@marinaholdings.ae', '+971505556677', 'Marina Holdings LLC',         'holding',    'active', 'referral', 'Holding structure, multi-visa')
on conflict (id) do nothing;

-- ── Demo ServiceRequests (14 across clients + statuses) ──────────
insert into public."ServiceRequest" (id, "clientId", "serviceType", status, "assignedTo", priority, deadline, notes) values
  ('demo-sr-01', 'client-jafir-001',  'Company Formation — Mainland LLC', 'in_progress', 'PRO Officer',        'high',   now() + interval '10 days', 'MOA drafting in progress'),
  ('demo-sr-02', 'client-jafir-001',  'Residence Visa — Investor',        'review',      'Operations Manager', 'normal', now() + interval '7 days',  'Awaiting medical typing'),
  ('demo-sr-03', 'demo-cl-alfahim',   'Trade License Renewal',            'new',         'PRO Officer',        'urgent', now() + interval '3 days',  'License expires this month'),
  ('demo-sr-04', 'demo-cl-alfahim',   'Labour Card Renewal (MOHRE)',      'in_progress', 'PRO Officer',        'normal', now() + interval '14 days', 'WPS updated'),
  ('demo-sr-05', 'demo-cl-alfahim',   'VAT Registration (FTA)',           'completed',   'Operations Manager', 'normal', now() - interval '2 days',  'TRN issued'),
  ('demo-sr-06', 'demo-cl-noor',      'Freezone License — Media',         'in_progress', 'PRO Officer',        'high',   now() + interval '9 days',  'Name reservation done'),
  ('demo-sr-07', 'demo-cl-noor',      'Establishment Card',               'new',         'PRO Officer',        'normal', now() + interval '12 days', 'Documents collected'),
  ('demo-sr-08', 'demo-cl-emirates',  'Golden Visa — 10 Year',            'review',      'Operations Manager', 'high',   now() + interval '20 days', 'ICP submission under review'),
  ('demo-sr-09', 'demo-cl-emirates',  'ESR Filing',                       'completed',   'Operations Manager', 'normal', now() - interval '5 days',  'Notification submitted'),
  ('demo-sr-10', 'demo-cl-gulftech',  'Company Formation — Tech Startup', 'new',         'PRO Officer',        'high',   now() + interval '15 days', 'Initial approval pending'),
  ('demo-sr-11', 'demo-cl-gulftech',  'Bank Account Opening Assistance',  'in_progress', 'PRO Officer',        'normal', now() + interval '18 days', 'Compliance KYC stage'),
  ('demo-sr-12', 'demo-cl-marina',    'Document Attestation — MOFA',      'review',      'PRO Officer',        'normal', now() + interval '6 days',  'At MOFA counter'),
  ('demo-sr-13', 'demo-cl-marina',    'Family Visa — 3 Dependents',       'in_progress', 'Operations Manager', 'high',   now() + interval '11 days', 'Entry permits issued'),
  ('demo-sr-14', 'demo-cl-marina',    'Trade License Amendment',          'delivered',   'PRO Officer',        'low',    now() - interval '8 days',  'Activity added, handed over')
on conflict (id) do nothing;
