-- ============================================================
-- Document system: lineItems + meta JSONB on Quote & Invoice
-- Run in Supabase SQL Editor:
--   https://supabase.com/dashboard/project/bvaykkygqxbbrfxbnyhv/sql
--
-- Idempotent + non-destructive. Each document is stored as:
--   lineItems : [{ description, quantity, unitPrice, amount, refNum?, amtPaid?, expense? }]
--   meta      : { docType, clientName, company, address, contact, clientRefId,
--                 subject, referenceNo, customerId, amountPaid, expense, purpose }
-- meta snapshots the client at issue time so documents stay regeneratable.
-- Quotations + ICV both live in Quote (meta.docType = 'quotation' | 'icv').
-- ============================================================

-- Client gets an address field (used on documents, previously missing).
alter table public."Client"  add column if not exists address text;

alter table public."Quote"   add column if not exists "lineItems" jsonb not null default '[]'::jsonb;
alter table public."Quote"   add column if not exists meta        jsonb not null default '{}'::jsonb;

alter table public."Invoice" add column if not exists "lineItems" jsonb not null default '[]'::jsonb;
alter table public."Invoice" add column if not exists meta        jsonb not null default '{}'::jsonb;
alter table public."Invoice" add column if not exists "clientId"  text;
-- Allow standalone invoices (not tied to a Quote).
alter table public."Invoice" alter column "quoteId" drop not null;

-- ── Migrate existing Quotes → lineItems + meta ───────────────────
update public."Quote" q set "lineItems" = jsonb_build_array(
    jsonb_build_object(
      'description', coalesce(nullif(q.services, ''), 'Professional Services'),
      'quantity', 1, 'unitPrice', coalesce(q."proFees", 0), 'amount', coalesce(q."proFees", 0)
    ),
    jsonb_build_object(
      'description', 'Government / Authority Fees',
      'quantity', 1, 'unitPrice', coalesce(q."govFees", 0), 'amount', coalesce(q."govFees", 0)
    )
  )
where q."lineItems" is null or q."lineItems" = '[]'::jsonb;

update public."Quote" q set meta = jsonb_build_object(
    'docType', 'quotation',
    'clientName', coalesce(c.name, ''),
    'company', coalesce(c.company, ''),
    'address', coalesce(c.address, 'Abu Dhabi, UAE'),
    'contact', coalesce(c.phone, ''),
    'subject', 'Business Services Quotation',
    'clientRefId', ''
  )
  from public."Client" c
  where q."clientId" = c.id and (q.meta is null or q.meta = '{}'::jsonb);

-- ── Migrate existing Invoices → lineItems + meta + clientId ──────
update public."Invoice" inv set
    "clientId" = q."clientId",
    "lineItems" = jsonb_build_array(
      jsonb_build_object(
        'description', coalesce(nullif(q.services, ''), 'PRO Services'),
        'refNum', '',
        'quantity', 1,
        'unitPrice', coalesce(inv.amount, 0),
        'amount', coalesce(inv.amount, 0),
        'amtPaid', case when inv.status = 'paid' then coalesce(inv.amount, 0) else 0 end,
        'expense', coalesce(q."govFees", 0)
      )
    ),
    meta = jsonb_build_object(
      'clientName', coalesce(c.name, ''),
      'company', coalesce(c.company, ''),
      'address', coalesce(c.address, 'Abu Dhabi, UAE'),
      'contact', coalesce(c.phone, ''),
      'customerId', '',
      'purpose', coalesce(nullif(split_part(q.services, ',', 1), ''), 'PRO Services')
    )
  from public."Quote" q
  join public."Client" c on q."clientId" = c.id
  where inv."quoteId" = q.id and (inv."lineItems" is null or inv."lineItems" = '[]'::jsonb);
