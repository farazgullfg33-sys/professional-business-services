# PRO Office Operations Playbook

## 20 Specialist Roles — Complete UAE PRO Office System

This playbook defines the complete operational model of a UAE PRO services office.
Every specialist role, workflow, dependency, and data requirement is documented here.

---

### Ai Receptionist Chatbot
**Role:** >-

---

### Client Intake Manager
**Role:** >-

---

### Client Support Helpline
**Role:** >-

---

### Client Tracking System
**Role:** >-

---

### Finance Billing
**Role:** >-

---

### Hr Payroll
**Role:** >-

---

### Immigration Specialist
**Role:** >-

---

### Lead Generation Outreach
**Role:** >-

---

### Oil Gas Compliance
**Role:** >-

---

### Operations Manager
**Role:** >-

---

### Pro Company Former
**Role:** >-

---

### Pro Compliance Officer
**Role:** >-

---

### Pro Document Attester
**Role:** >-

---

### Pro Government Liaison
**Role:** >-

---

### Pro License Manager
**Role:** >-

---

### Pro Mohre Portal
**Role:** >-

---

### Pro Tamm Portal
**Role:** >-

---

### Pro Visa Processor
**Role:** >-

---

### Seo Content Writer
**Role:** >-

---

### Social Media Manager
**Role:** >-

---


## Data Model Requirements

### Core Tables (Prisma)
1. **Client** — name, email, phone, company, businessType, status, source, notes, createdAt
2. **ServiceRequest** — clientId, serviceType, status, assignedTo, priority, deadline, notes, createdAt
3. **Document** — clientId, name, type, fileUrl, expiryDate, createdAt
4. **CommunicationLog** — clientId, type, staffName, summary, outcome, createdAt
5. **FollowUp** — clientId, step, dueDate, completed, notes
6. **Quote** — clientId, services, govFees, proFees, total, status, createdAt
7. **Invoice** — quoteId, amount, status, paymentMethod, paidAt, createdAt
8. **Lead** — name, email, phone, serviceInterest, message, source, status, assignedTo, createdAt
9. **Staff** — name, email, password, role, active
10. **FormationChecklist** — clientId, steps (JSON), createdAt

### Service Types (serviceType enum)
- company_formation, visa_processing, license_renewal, license_amendment
- document_attestation, government_liaison, compliance_check
- immigration_golden, immigration_green, mohre_labour, tamm_services
- pro_outsourcing, oil_gas_compliance, business_consulting

### Status Pipeline
New → Documents Collected → Submitted → Under Review → Approved → Completed → Delivered

### Expiry Monitoring
- License: 60/30/14/7 day alerts
- Visa: 30/14/7 day alerts
- Emirates ID: 30/14 day alerts
- Labour Card: 30/14 day alerts
- Tenancy: 60/30 day alerts

## Admin Panel Must Support
1. Dashboard with revenue, active clients, pending tasks, expiry alerts
2. Client CRUD with document upload and expiry tracking
3. Service pipeline (Kanban: New → In Progress → Review → Completed)
4. Quote generation → automatic invoice creation → payment tracking
5. PDF reports (monthly, client-specific)
6. Staff assignment and workload tracking
7. Real-time SSE updates
8. Chatbot for admin assistance
9. Formation checklist (14-step per client)
10. Communication log with timestamps

## Website Must Show
- All core services with descriptions
- UAE government portal references
- Process workflow (visual)
- Quote request form
- Contact with office location
- Blog for UAE business updates
