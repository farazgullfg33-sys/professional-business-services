-- Run in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/bvaykkygqxbbrfxbnyhv/sql
--
-- Adds the notes column to Lead table (used by Lead detail slideover).

alter table public."Lead" add column if not exists notes text;
