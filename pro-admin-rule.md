# PRO Admin Rule

Always load the `pro-project-deploy-workflow` skill when working on the PRO project.

Pipeline Overview comes from the `ServiceRequest` table joined with the `Client` table via `clientId`.

---

## Details

- **Project:** Professional Business Services (PRO) — `admin.professionalbusines.com/admin`
- **Supabase project:** `bvaykkygqxbbrfxbnyhv`
- **Docker container:** `professionalbs-web-1`
- **Git branch:** `supabase-migration-3d`

### Pipeline Overview data source
- Table: `public."ServiceRequest"`
- Relationship: `ServiceRequest.clientId` → `Client.id` (FK: `ServiceRequest_clientId_fkey`)
- Admin API route: `/app/api/admin/data/route.ts`
- Client names are resolved **client-side** in the admin panel from `data.clients`
  (kanban fallback), so a stale PostgREST FK cache can never blank out the pipeline.
- Pipeline columns (kanban): `new` · `in_progress` · `review` · `completed`
  (`delivered` is a valid status too).

> VPS placement: `cp /opt/data/professional-business-services/pro-admin-rule.md /opt/data/pro-admin-rule.md`
