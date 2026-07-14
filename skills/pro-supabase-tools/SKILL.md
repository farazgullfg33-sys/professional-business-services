---
name: pro-supabase-tools
version: 1.0.0
description: CLI-based PRO office management via Supabase REST API — query, insert, update, report, and complex operations across all 16 PRO office tables.
triggers:
  - "pro tools"
  - "pro query"
  - "pro insert"
  - "pro update"
  - "pro report"
  - "supabase tools"
  - "Waqas ko tools do"
  - "pro convert"
  - "pro advance"
  - "pro checklist"
  - "pro leads"
  - "pro clients"
  - "pro visas"
model: deepseek-chat
env_required:
  - SUPABASE_URL              # https://<project-ref>.supabase.co
  - SUPABASE_SERVICE_ROLE_KEY  # service_role key (full access, bypasses RLS)
  - SUPABASE_ANON_KEY          # anon/publishable key
script: skills/pro-supabase-tools/scripts/pro_tools.py
---

# PRO Supabase Tools — Hermes Skill

CLI tool for PRO office staff to manage all operations via natural language.
No browser needed. All data goes directly to Supabase REST API.

## How to invoke this skill

When a trigger is detected, map the user's intent to the correct `pro_tools.py` command
and run it with `python skills/pro-supabase-tools/scripts/pro_tools.py <subcommand> [args]`.

Return the stdout output verbatim. Do NOT reformat or summarise the output.

---

## Command Reference

### 1. QUERY — Read data from any table

```bash
python skills/pro-supabase-tools/scripts/pro_tools.py query \
  --table <TableName> \
  [--select "field1,field2"] \
  [--filter "field.op.value"] \
  [--order "field.asc|field.desc"] \
  [--limit 20]
```

**Filter operators:** `eq`, `neq`, `gt`, `gte`, `lt`, `lte`, `like`, `ilike`, `is`
**Multiple --filter flags are ANDed.**

#### Natural language → command mappings

| User says | Command |
|-----------|---------|
| "pro query: all leads" | `query --table Lead --limit 50` |
| "pro query: new leads" | `query --table Lead --filter "status.eq.new"` |
| "pro query: active clients" | `query --table Client --filter "status.eq.active"` |
| "pro query: pending visas" | `query --table Visa --filter "status.eq.applied"` |
| "pro query: expiring visas this month" | `query --table Visa --filter "status.neq.expired" --order "expiryDate.asc"` |
| "pro query: unpaid invoices" | `query --table Invoice --filter "status.eq.pending"` |
| "pro query: open services" | `query --table ServiceRequest --filter "status.neq.completed"` |
| "pro query: staff" | `query --table Staff --select "id,name,email,role,active"` |
| "pro query: upcoming compliance deadlines" | `query --table ComplianceDeadline --filter "status.eq.pending" --order "dueDate.asc"` |
| "pro query: recent leads" | `query --table Lead --order "createdAt.desc" --limit 10` |
| "pro query: clients with pending services" | `query --table ServiceRequest --filter "status.eq.new" --select "clientId,serviceType,status"` |
| "pro query: formation progress for client X" | `query --table FormationChecklist --filter "clientId.eq.X" --order "step.asc"` |
| "pro query: attestations in progress" | `query --table Attestation --filter "status.eq.in_progress"` |
| "pro query: communication log for client X" | `query --table CommunicationLog --filter "clientId.eq.X" --order "createdAt.desc"` |

---

### 2. INSERT — Add new records

```bash
python skills/pro-supabase-tools/scripts/pro_tools.py insert \
  --table <TableName> \
  --data '{"field":"value","field2":"value2"}'
```

#### Natural language → command mappings

| User says | Command |
|-----------|---------|
| "pro insert: client name Ahmed, email a@b.com, phone 050..." | `insert --table Client --data '{"name":"Ahmed","email":"a@b.com","phone":"050..."}'` |
| "pro insert: lead from chatbot, name X, phone Y" | `insert --table Lead --data '{"name":"X","phone":"Y","source":"chatbot","status":"new"}'` |
| "pro insert: visa for client abc, type employment" | `insert --table Visa --data '{"clientId":"abc","type":"employment","status":"applied"}'` |
| "pro insert: service for client abc, trade license renewal" | `insert --table ServiceRequest --data '{"clientId":"abc","serviceType":"Trade License Renewal","status":"new","priority":"normal"}'` |
| "pro insert: compliance ESR deadline for client abc, due 2025-03-31" | `insert --table ComplianceDeadline --data '{"clientId":"abc","type":"ESR","dueDate":"2025-03-31","status":"pending"}'` |
| "pro insert: log call with client abc" | `insert --table CommunicationLog --data '{"clientId":"abc","type":"call","staffName":"PRO Officer","summary":"..."}'` |

**Required fields per table — always validate before insert. See references/tables.md.**

---

### 3. UPDATE — Modify existing records

```bash
python skills/pro-supabase-tools/scripts/pro_tools.py update \
  --table <TableName> \
  --id <record_id> \
  --data '{"field":"newvalue"}'
```

#### Natural language → command mappings

| User says | Command |
|-----------|---------|
| "pro update: lead abc status converted" | `update --table Lead --id abc --data '{"status":"converted"}'` |
| "pro update: visa xyz approved" | `update --table Visa --id xyz --data '{"status":"approved"}'` |
| "pro update: service abc completed" | `update --table ServiceRequest --id abc --data '{"status":"completed"}'` |
| "pro update: invoice abc paid" | `update --table Invoice --id abc --data '{"status":"paid","paidAt":"<today ISO>"}'` |
| "pro update: compliance abc done" | `update --table ComplianceDeadline --id abc --data '{"status":"completed"}'` |
| "pro update: client abc inactive" | `update --table Client --id abc --data '{"status":"inactive"}'` |
| "pro update: formation step abc completed" | `update --table FormationChecklist --id abc --data '{"completed":true}'` |

---

### 4. REPORTS — Aggregated summaries

```bash
python skills/pro-supabase-tools/scripts/pro_tools.py report --type <report_name> [--client-id <id>]
```

| User says | Command |
|-----------|---------|
| "pro report: pending tasks" | `report --type pending_tasks` |
| "pro report: weekly activity" | `report --type weekly_activity` |
| "pro report: checklist for client abc" | `report --type checklist --client-id abc` |
| "pro report: expiring documents" | `report --type expiring_docs` |
| "pro report: lead summary" | `report --type lead_summary` |
| "pro report: revenue" | `report --type revenue` |
| "pro report: visa alerts" | `report --type visa_alerts` |
| "pro report: dashboard" | `report --type dashboard` |

---

### 5. COMPLEX OPERATIONS

```bash
# Convert a lead to a client (reads lead data, creates client record)
python skills/pro-supabase-tools/scripts/pro_tools.py convert-lead --id <lead_id>

# Advance attestation checkpoint to next stage
python skills/pro-supabase-tools/scripts/pro_tools.py advance-attestation --id <attestation_id>
```

| User says | Command |
|-----------|---------|
| "pro convert lead abc to client" | `convert-lead --id abc` |
| "pro advance attestation abc" | `advance-attestation --id abc` |

---

## Environment Setup

Set these in your Hermes config or `.env`:

```
SUPABASE_URL=https://bvaykkygqxbbrfxbnyhv.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
SUPABASE_ANON_KEY=<your-anon-key>
```

## Dependencies

```bash
pip install requests python-dotenv
```

No other deps needed. Does NOT use supabase-py — pure REST via `requests`.

## Output format

All output is plain text — tables, counts, summaries. No JSON, no HTML.
Each command returns a human-readable result that Hermes can relay directly to the user.

## Error handling

All errors are caught and returned as plain text messages like:
`ERROR: Table "Visa" not found — check table name and try again.`
`ERROR: Required field "clientId" missing from insert data.`

Hermes should relay these error messages directly without modification.
