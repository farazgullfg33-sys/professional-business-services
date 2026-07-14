# PRO Office — Supabase Table Reference

Project: `bvaykkygqxbbrfxbnyhv.supabase.co`
All primary keys are `text` (UUID via `gen_random_uuid()::text`).
All timestamps are `timestamptz` in UTC.

---

## Client
Main client records. Central reference for most other tables.

| Column        | Type    | Required | Notes                                      |
|---------------|---------|----------|--------------------------------------------|
| id            | text    | PK       | auto-generated UUID                        |
| name          | text    | ✓        |                                            |
| email         | text    |          |                                            |
| phone         | text    |          |                                            |
| company       | text    |          |                                            |
| businessType  | text    |          | trade/tech/consulting/holding/media/services/other |
| status        | text    | default  | active / inactive (default: active)        |
| source        | text    |          | direct/website/referral/walk-in/social/call |
| notes         | text    |          |                                            |
| createdAt     | timestamptz | auto |                                            |

---

## Lead
Prospective clients before formal onboarding.

| Column          | Type    | Required | Notes                          |
|-----------------|---------|----------|--------------------------------|
| id              | text    | PK       |                                |
| name            | text    | ✓        |                                |
| email           | text    |          |                                |
| phone           | text    |          |                                |
| serviceInterest | text    |          |                                |
| message         | text    |          |                                |
| source          | text    | ✓        | website/chatbot/referral/call  |
| status          | text    | ✓        | new/contacted/qualified/converted/lost (default: new) |
| assignedTo      | text    |          | staff name                     |
| createdAt       | timestamptz | auto |                                |

---

## Visa
Per-client visa records.

| Column           | Type        | Required | Notes                                        |
|------------------|-------------|----------|----------------------------------------------|
| id               | text        | PK       |                                              |
| clientId         | text        | ✓        | FK → Client.id                               |
| type             | text        | ✓        | employment/family/golden/visit               |
| status           | text        | default  | applied/approved/renewed/expired (default: applied) |
| applicationDate  | timestamptz |          |                                              |
| expiryDate       | timestamptz |          | used for expiry alerts                       |
| remarks          | text        |          |                                              |
| createdAt        | timestamptz | auto     |                                              |

---

## License
Trade licenses per client.

| Column        | Type        | Required | Notes                                         |
|---------------|-------------|----------|-----------------------------------------------|
| id            | text        | PK       |                                               |
| clientId      | text        | ✓        | FK → Client.id                                |
| licenseNumber | text        |          |                                               |
| type          | text        |          | Commercial/Professional/Industrial/Tourism/Freezone |
| issueDate     | timestamptz |          |                                               |
| expiryDate    | timestamptz |          |                                               |
| status        | text        | default  | active/renewal_due/expired/cancelled (default: active) |
| createdAt     | timestamptz | auto     |                                               |

---

## ServiceRequest
Services being delivered to clients.

| Column      | Type        | Required | Notes                                         |
|-------------|-------------|----------|-----------------------------------------------|
| id          | text        | PK       |                                               |
| clientId    | text        | ✓        | FK → Client.id                                |
| serviceType | text        | ✓        | e.g. "Trade License Renewal", "Visa Processing" |
| status      | text        | default  | new/in_progress/review/completed/delivered    |
| assignedTo  | text        |          | staff name                                    |
| priority    | text        | default  | normal/high/urgent (default: normal)          |
| deadline    | timestamptz |          |                                               |
| notes       | text        |          |                                               |
| createdAt   | timestamptz | auto     |                                               |

---

## FollowUp
Scheduled follow-up tasks per client.

| Column    | Type        | Required | Notes             |
|-----------|-------------|----------|-------------------|
| id        | text        | PK       |                   |
| clientId  | text        | ✓        | FK → Client.id    |
| step      | text        | ✓        | e.g. "Call back", "Send quote" |
| dueDate   | timestamptz | ✓        |                   |
| completed | boolean     | default  | default: false    |
| notes     | text        |          |                   |

---

## Quote
Generated quotes for clients.

| Column    | Type        | Required | Notes                       |
|-----------|-------------|----------|-----------------------------|
| id        | text        | PK       |                             |
| clientId  | text        | ✓        | FK → Client.id              |
| services  | text        | ✓        | description of services     |
| govFees   | float       | default  | government fees (AED)       |
| proFees   | float       | default  | PRO service fees (AED)      |
| total     | float       | default  | govFees + proFees           |
| status    | text        | default  | draft/sent/approved/rejected (default: draft) |
| createdAt | timestamptz | auto     |                             |

---

## Invoice
Invoices linked to quotes.

| Column        | Type        | Required | Notes                      |
|---------------|-------------|----------|----------------------------|
| id            | text        | PK       |                            |
| quoteId       | text        | ✓        | FK → Quote.id              |
| amount        | float       | ✓        | AED                        |
| status        | text        | default  | pending/paid/cancelled (default: pending) |
| paymentMethod | text        |          | Bank Transfer/Cash/Card    |
| paidAt        | timestamptz |          |                            |
| createdAt     | timestamptz | auto     |                            |

---

## Document
Client documents with expiry tracking.

| Column     | Type        | Required | Notes                                    |
|------------|-------------|----------|------------------------------------------|
| id         | text        | PK       |                                          |
| clientId   | text        | ✓        | FK → Client.id                           |
| name       | text        | ✓        | document display name                    |
| type       | text        | ✓        | passport/visa/trade_license/tenancy/moa/ejari/other |
| fileUrl    | text        | ✓        | Google Drive / OneDrive / Dropbox link   |
| expiryDate | timestamptz |          | used for dashboard expiry alerts         |
| createdAt  | timestamptz | auto     |                                          |

---

## Staff
Staff profile table (auth managed separately via Supabase Auth).

| Column   | Type    | Required | Notes                        |
|----------|---------|----------|------------------------------|
| id       | text    | PK       |                              |
| name     | text    | ✓        |                              |
| email    | text    | ✓        | unique                       |
| password | text    | ✓        | bcrypt hash (legacy field)   |
| role     | text    | ✓        | admin/manager/pro            |
| active   | boolean | default  | default: true                |

Note: Do NOT query or return the `password` field. Always `--select "id,name,email,role,active"`.

---

## Attestation
Document attestation pipeline with custody checkpoints.

| Column       | Type        | Required | Notes                                           |
|--------------|-------------|----------|-------------------------------------------------|
| id           | text        | PK       |                                                 |
| clientId     | text        | ✓        | FK → Client.id                                  |
| documentName | text        | ✓        |                                                 |
| documentType | text        |          | educational/commercial/personal/marriage/birth  |
| checkpoint   | text        | default  | original_received → notary → mofa → embassy → delivered |
| status       | text        | default  | in_progress/completed/on_hold (default: in_progress) |
| notes        | text        |          |                                                 |
| createdAt    | timestamptz | auto     |                                                 |

**Checkpoint order:** `original_received` → `notary` → `mofa` → `embassy` → `delivered`

---

## CommunicationLog
Timestamped log of all client communications.

| Column    | Type        | Required | Notes                         |
|-----------|-------------|----------|-------------------------------|
| id        | text        | PK       |                               |
| clientId  | text        | ✓        | FK → Client.id                |
| type      | text        | ✓        | call/email/visit/whatsapp     |
| staffName | text        | ✓        | who logged it                 |
| summary   | text        | ✓        | what was discussed            |
| outcome   | text        |          | result / next action          |
| createdAt | timestamptz | auto     |                               |

---

## FormationChecklist
Per-client company formation 14-step checklist (one row per step).

| Column    | Type        | Required | Notes                          |
|-----------|-------------|----------|--------------------------------|
| id        | text        | PK       |                                |
| clientId  | text        | ✓        | FK → Client.id                 |
| step      | integer     | ✓        | 1–14                           |
| name      | text        | ✓        | step label                     |
| completed | boolean     | default  | default: false                 |
| notes     | text        |          |                                |
| createdAt | timestamptz | auto     |                                |

**Steps 1–14:**
1. Name Reservation
2. Initial Approval
3. MOA Drafting
4. MOA Notarization
5. EJARI (Office Lease)
6. Trade License Application
7. Trade License Issued
8. Immigration File Card
9. Establishment Card
10. First Visa Quota
11. Bank Account Opening
12. VAT / TRN Registration
13. Chamber of Commerce
14. Final Handover

---

## ComplianceDeadline
Regulatory compliance deadlines per client.

| Column    | Type        | Required | Notes                               |
|-----------|-------------|----------|-------------------------------------|
| id        | text        | PK       |                                     |
| clientId  | text        | ✓        | FK → Client.id                      |
| type      | text        | ✓        | ESR/VAT/AML/PDPL/Audit/WPS/Other    |
| dueDate   | timestamptz | ✓        |                                     |
| status    | text        | default  | pending/completed/overdue           |
| notes     | text        |          |                                     |

---

## ContactSubmission
Public contact form submissions (from professionalbusines.com/contact).

| Column    | Type        | Required | Notes              |
|-----------|-------------|----------|--------------------|
| id        | text        | PK       |                    |
| name      | text        | ✓        |                    |
| email     | text        | ✓        |                    |
| phone     | text        |          |                    |
| message   | text        | ✓        |                    |
| read      | boolean     | default  | default: false     |
| createdAt | timestamptz | auto     |                    |

---

## QuoteRequest
Public quote request form submissions.

| Column          | Type        | Required | Notes                  |
|-----------------|-------------|----------|------------------------|
| id              | text        | PK       |                        |
| name            | text        | ✓        |                        |
| email           | text        | ✓        |                        |
| phone           | text        |          |                        |
| company         | text        |          |                        |
| serviceInterest | text        | ✓        |                        |
| message         | text        |          |                        |
| status          | text        | default  | new/reviewed/converted  |
| createdAt       | timestamptz | auto     |                        |

---

## Relationships Summary

```
Client (1) ──< Lead            (source leads before conversion)
Client (1) ──< Visa
Client (1) ──< License
Client (1) ──< ServiceRequest
Client (1) ──< FollowUp
Client (1) ──< Document
Client (1) ──< Attestation
Client (1) ──< CommunicationLog
Client (1) ──< FormationChecklist
Client (1) ──< ComplianceDeadline
Client (1) ──< Quote
Quote   (1) ──< Invoice
```

All foreign key columns use the pattern `clientId`, `quoteId`, etc. (camelCase, no underscore).
