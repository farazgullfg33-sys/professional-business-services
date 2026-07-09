# PRO Business Services — UAE Professional Services Platform

## What Codex Built Here
Codex built the complete PRO office admin panel for UAE business services. 18 playbook skills defined.

## Stack
- **Frontend:** Next.js 14 App Router, TypeScript, Tailwind CSS
- **Backend:** Prisma ORM + PostgreSQL
- **Deploy:** Docker Compose on VPS (`pro-db` + `web` containers)
- **Live:** https://pro.aiinvention.tech
- **Admin:** https://admin-pro.aiinvention.tech/admin
- **Admin Login:** admin@professionalbs.local / Pass123!

## What's Built (Latest Commit: 9843cc4)
- ✅ Full admin panel: client CRUD
- ✅ Quote + invoice generation
- ✅ PDF generation
- ✅ CSV export
- ✅ Status pipeline
- ✅ Quick actions functional
- ✅ Proper modals

## 18 PRO Playbook Skills (UAE Operations)
1. **client-intake-manager** — New client onboarding
2. **client-support-helpline** — Ongoing client support
3. **client-tracking-system** — Track all client cases
4. **immigration-specialist** — UAE immigration processing
5. **pro-visa-processor** — Visa applications & renewals
6. **pro-company-former** — Company formation in UAE
7. **pro-license-manager** — Trade license management
8. **pro-compliance-officer** — Regulatory compliance
9. **pro-document-attester** — Document attestation services
10. **pro-government-liaison** — Government department coordination
11. **pro-mohre-portal** — Ministry of Human Resources & Emiratisation
12. **pro-tamm-portal** — Abu Dhabi government services
13. **finance-billing** — Invoicing, payments, financial tracking
14. **lead-generation-outreach** — Client acquisition
15. **seo-content-writer** — Content for PRO services
16. **social-media-manager** — Social media management
17. **hr-payroll** — HR & payroll management
18. **operations-manager** — Overall operations workflow
19. **oil-gas-compliance** — Oil & gas sector compliance

## Git Rules
- After EVERY file change, commit + push to origin main
- Use conventional commits: fix:, feat:, style:, refactor:
- NEVER create PRs — push directly to main
- Remote: https://farazgullfg33-sys:TOKEN@github.com/farazgullfg33-sys/professional-business-services.git

## VPS Deploy Info
- **Path on VPS:** /opt/professionalbs/
- **Docker Compose:** pro-db (PostgreSQL) + web (Next.js)
- **⚠️ Docker DNS:** Service names MUST be unique — use `pro-db` NOT `db`
- **⚠️ Traefik:** Each router needs explicit `service=` label
- **⚠️ VPS Hermes handles ALL deployment — laptop only codes + pushes**

## Codex Session History for PRO
- Codex worked on PRO playbook skills directory: `Downloads/pro office uae playbook/`
- Skills were defined as markdown files with YAML frontmatter
- Admin panel was codex-built with full CRUD

## Critical Pitfalls
1. **Docker service names** — always `pro-db`, never just `db` (conflicts with other compose files)
2. **Traefik labels** — must have explicit `traefik.http.services.<name>.loadbalancer.server.port` AND `traefik.http.routers.<name>.service=<name>`
3. **Database migrations** — always run `npx prisma migrate deploy` after schema changes
4. **Never deploy from laptop** — git push only, VPS Hermes handles Docker rebuild

## ⚠️ PRO PROJECT RULE
Faraz personally directs all PRO project work. No autonomous builds. Faraz discusses, gives input, then step-by-step work happens.
