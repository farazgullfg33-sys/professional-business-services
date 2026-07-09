# PRO Business Services — UAE Professional Services Platform

## 📊 CURRENT STATUS — July 2026 Rebuild (Faraz Directing)

### WHO THIS IS FOR
Muhammad Waqas's personal PRO services company. CEO: Muhammad Waqas. AI Invention is INVISIBLE (white-label backend only). Faraz = behind the scenes.

### DESIGN SYSTEM
- Navy #0a1628 / Gold #c9a84c / White
- Playfair Display (headings) + Inter (body)
- Glassmorphism cards, premium consulting-firm feel
- Light/dark toggle via ThemeProvider

### ALL PHASES COMPLETE

| Phase | What | Status |
|-------|------|--------|
| 1 | White-label cleanup: AI content removed, real PRO stats | ✅ |
| 2 | Public pages: Home, About, CEO Msg, Services, Contact, Quote, Blog, FAQ, Privacy, Terms | ✅ |
| 3 | Admin panel: Dashboard, kanban pipeline, charts, SSE live, mobile fixes | ✅ |
| 4 | Telegram/WhatsApp webhook handlers | ✅ |
| 5 | Hidden /ai-invention pitch page (noindex, not linked) | ✅ |
| — | Git direct access: Claude → GitHub → VPS deploy | ✅ |

### RECENT GIT LOG (July 9, 2026)
```
bfe1ba19 style: finalize admin panel polish — remaining cleanup
fd70cd68 style: polish client detail page — mobile padding, row hover
4ae6d078 style: premium dashboard polish — icon badges, hover accents
41c27819 feat: touch-friendly kanban + responsive table scroll wrappers
2139bd4e feat: mobile hamburger sidebar drawer for admin panel
59bbee74 feat: about page — CEO bio, team placeholders, office location
0093f848 style: Phase 1 — remove AI Invention content, white-label PRO
```

### KEY FILES (what everything is)
- `lib/company.ts` — ALL company data: name, phone, stats, services, FAQs, team
- `app/page.tsx` — Homepage (hero, services grid, why-us, how-it-works, client portal, leadership, results, CTA)
- `app/about/page.tsx` — About with CEO bio + office location
- `app/ceo-message/page.tsx` — CEO message from Muhammad Waqas
- `app/services/page.tsx` — Detailed services with sections
- `app/contact/page.tsx` — Contact form + address
- `app/quote/page.tsx` — Quote request form
- `app/ai-invention/page.tsx` — HIDDEN pitch page for Waqas
- `components/SiteChrome.tsx` — Navbar, Footer, TopBar, FloatingWidgets
- `components/home/HomeSections.tsx` — HowItWorksFlow, DashboardPreview, WhyChooseUs, LeadershipTeam
- `components/admin/AdminPanel.tsx` — Main admin dashboard shell
- `components/admin/Charts.tsx` — Recharts revenue/pipeline/funnel
- `tailwind.config.ts` — Navy, gold, fonts, shadows already configured

### CRITICAL RULES (NEVER BREAK)
1. ❌ "AI Invention", "Faraz", "AI agents", "AI-powered", "automation" — ZERO on public pages
2. ❌ "Waqas Bhai" — use "Muhammad Waqas"
3. ❌ Fake testimonials with made-up names
4. ✅ Professional Business Services branding only
5. ✅ Muhammad Waqas as CEO
6. ✅ Real PRO services: ICP, MOHRE, GDRFA, TAMM
7. ✅ Git: commit after every change, push to main, no PRs
8. ✅ `git add app/ components/ lib/` — NEVER `git add .` or `-A` (includes node_modules)

### DEPLOY
- VPS ONLY: `cd /opt/professionalbs && git pull && docker compose up -d --build`
- Env vars needed: DEEPSEEK_API_KEY, TELEGRAM_BOT_TOKEN, WHATSAPP_*
- Live: https://pro.aiinvention.tech | Admin: https://admin-pro.aiinvention.tech/admin

### FARAZ'S FLOW
- Faraz opens terminal → `cd ~/projects/professional-business-services && claude`
- Gives instructions directly in Hinglish
- Claude reads this file → has ALL context → executes
- After every phase: git commit + push

## What Codex Built Here (Original Build)
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
