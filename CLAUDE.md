# 🔷 PRO SERVICES UAE — CLAUDE.md (Project Context)

## Project Overview
- **Client:** Muhammad Waqas, CEO, Professional Business Services
- **Location:** Abu Dhabi, UAE | **Phone:** +971 568 185 548
- **Site:** pro.aiinvention.tech | **Admin:** admin-pro.aiinvention.tech
- **Goal:** Build premium PRO services system → impress Waqas → pitch Faraz as AI Manager
- **AI Invention:** ZERO public mention — backend only, white-label
- **Hidden Page:** /ai-invention (in repo, unlinked from nav)

## Brand Identity
- **Navy:** #0a1628 | **Gold:** #c9a84c | **White:** #ffffff
- **Light BG:** #f8fafc | **Text:** #334155 | **Muted:** #64748b | **Border:** #e2e8f0
- **Heading Font:** Playfair Display | **Body Font:** Inter
- **Vibe:** Premium PRO office, physical team, govt counters — NOT law firm, NOT AI

## Stack
- **Frontend:** Next.js, Tailwind CSS
- **Backend:** Prisma, PostgreSQL 16
- **Deploy:** Docker, Traefik (ai-invention_default network)
- **Repo:** professional-business-services (GitHub)

## Key Design Rules
- Light theme only
- Professional, high-trust feel
- Team photos, office images (professional stock or placeholder)
- Service cards with icons, gradient accents (navy→gold)
- CTA buttons: Gold #c9a84c on Navy bg
- Float contact button (WhatsApp)

## 20 PRO Services (Quick Reference)
1. Company Formation — Mainland LLC, freezone, branch setup
2. Visa Processing — Entry, residence, family, Golden, Green
3. License Renewal & Amendment — Trade license, activities
4. Document Attestation — Educational, marriage, commercial, MOFA
5. Government Liaison — ICP, GDRFA, MOHRE, DED, ADDED visits
6. MOHRE Labour — Work permits, Akdi, WPS, Emiratisation
7. Tamm Portal — Abu Dhabi unified government portal
8. Compliance — ESR, VAT, AML, PDPL, contract review
9. Immigration — Golden visa 10yr, Green visa 5yr
10. Oil & Gas — ICV, ISO, ADNOC registration
11. Client Intake — Needs discovery, document checklist
12. Client Tracking — Pipeline, expiry alerts, dashboard
13. Client Support — Status updates, complaint handling
14. Finance & Billing — Invoicing, payment, reconciliation
15. HR & Payroll — Staff, attendance, WPS, leave
16. Lead Generation — Cold calls, WhatsApp, email, referrals
17. Operations — Task assignment, KPIs, QA, escalations
18. Receptionist Chatbot — 24/7 FAQ, lead capture
19. SEO Content — Blog posts, UAE business guides
20. Social Media — Instagram, Facebook, LinkedIn

## Architecture
- Main site: Landing pages, service pages, about, blog, contact, quote
- Admin: File tracking, client pipeline, staff dashboard, reports
- Hidden /ai-invention page: Partnership pitch for Waqas Bhai
- Email: hello@aiinvention.tech (temporary — use Zoho Mail when pro domain bought)

## Development Rules
- NEVER modify database schema without approval
- Prisma migrations: `npx prisma migrate dev --name <name>`
- Build: `npm run build` → verify no errors
- Deploy: Git push → VPS Hermes deploys via Docker

## Design Tokens (CSS Variables)
```css
:root {
  --navy: #0a1628;
  --gold: #c9a84c;
  --white: #ffffff;
  --light-bg: #f8fafc;
  --text: #334155;
  --muted: #64748b;
  --border: #e2e8f0;
  --heading-font: 'Playfair Display', serif;
  --body-font: 'Inter', sans-serif;
}
```

## Interview Info
- "Muhammad Waqas" publicly | "Waqas Bhai" privately (Faraz only)
- Faraz = AI Invention UAE Manager (hidden)
- Strategy: System impressive ho → then pitch → then Faraz hired
