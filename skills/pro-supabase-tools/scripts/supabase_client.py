"""
Supabase REST API client for PRO office operations.
Uses service_role key — bypasses RLS, full access to all tables.
No supabase-py dependency — pure requests.
"""

import os
import json
import sys
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

try:
    import requests
except ImportError:
    print("ERROR: 'requests' not installed. Run: pip install requests")
    sys.exit(1)

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass  # dotenv optional


# ── Config ──────────────────────────────────────────────────────────────────

SUPABASE_URL = (
    os.getenv("SUPABASE_URL")
    or os.getenv("NEXT_PUBLIC_SUPABASE_URL")
    or ""
).rstrip("/")

SERVICE_ROLE_KEY = (
    os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    or os.getenv("SERVICE_ROLE_KEY")
    or ""
)

ANON_KEY = (
    os.getenv("SUPABASE_ANON_KEY")
    or os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
    or ""
)

VALID_TABLES = {
    "Client", "Lead", "Visa", "License", "ServiceRequest", "FollowUp",
    "Quote", "Invoice", "Document", "Staff", "Attestation", "CommunicationLog",
    "FormationChecklist", "ComplianceDeadline", "ContactSubmission", "QuoteRequest",
}

REQUIRED_FIELDS = {
    "Client":            ["name"],
    "Lead":              ["name", "source", "status"],
    "Visa":              ["clientId", "type"],
    "License":           ["clientId"],
    "ServiceRequest":    ["clientId", "serviceType"],
    "FollowUp":          ["clientId", "step", "dueDate"],
    "Quote":             ["clientId", "services"],
    "Invoice":           ["quoteId", "amount"],
    "Document":          ["clientId", "name", "type", "fileUrl"],
    "Staff":             ["name", "email", "password", "role"],
    "Attestation":       ["clientId", "documentName"],
    "CommunicationLog":  ["clientId", "type", "staffName", "summary"],
    "FormationChecklist":["clientId", "step", "name"],
    "ComplianceDeadline":["clientId", "type", "dueDate"],
    "ContactSubmission": ["name", "email", "message"],
    "QuoteRequest":      ["name", "email", "serviceInterest"],
}

CHECKPOINT_ORDER = [
    "original_received", "notary", "mofa", "embassy", "delivered"
]

CHECKPOINT_LABEL = {
    "original_received": "Original Received",
    "notary":            "Notary Attestation",
    "mofa":              "MOFA Attestation",
    "embassy":           "Embassy Attestation",
    "delivered":         "Delivered to Client",
}


# ── Helpers ──────────────────────────────────────────────────────────────────

def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _fmt_date(s: Optional[str]) -> str:
    if not s:
        return "—"
    try:
        dt = datetime.fromisoformat(s.replace("Z", "+00:00"))
        return dt.strftime("%d %b %Y")
    except Exception:
        return s[:10]


def _days_left(iso_date: Optional[str]) -> Optional[int]:
    if not iso_date:
        return None
    try:
        dt = datetime.fromisoformat(iso_date.replace("Z", "+00:00"))
        delta = dt.replace(tzinfo=timezone.utc) - datetime.now(timezone.utc)
        return delta.days
    except Exception:
        return None


def _col(value: Any, width: int) -> str:
    """Left-justify a value in a fixed-width column."""
    s = str(value) if value is not None else "—"
    return s[:width].ljust(width)


def _separator(widths: List[int]) -> str:
    return "+" + "+".join("-" * (w + 2) for w in widths) + "+"


def _row(values: List[Any], widths: List[int]) -> str:
    cells = [" " + _col(v, w) + " " for v, w in zip(values, widths)]
    return "|" + "|".join(cells) + "|"


def format_table(rows: List[Dict], columns: List[str], title: str = "") -> str:
    """Render a list of dicts as a plain-text table."""
    if not rows:
        return f"{title}\n(no records)" if title else "(no records)"

    widths = [max(len(c), max((len(str(r.get(c) or "")) for r in rows), default=0)) for c in columns]
    widths = [min(w, 40) for w in widths]  # cap at 40 chars per column

    sep = _separator(widths)
    header = _row(columns, widths)
    lines = []
    if title:
        lines.append(f"\n── {title} ──")
    lines += [sep, header, sep]
    for r in rows:
        lines.append(_row([r.get(c) for c in columns], widths))
    lines.append(sep)
    lines.append(f"  {len(rows)} record(s)")
    return "\n".join(lines)


# ── SupabaseClient ───────────────────────────────────────────────────────────

class SupabaseClient:
    """
    Thin wrapper around Supabase REST API (PostgREST).
    Uses service_role key — full access, no RLS.
    """

    def __init__(self):
        if not SUPABASE_URL:
            raise RuntimeError(
                "SUPABASE_URL not set. "
                "Export SUPABASE_URL=https://bvaykkygqxbbrfxbnyhv.supabase.co"
            )
        if not SERVICE_ROLE_KEY:
            raise RuntimeError(
                "SUPABASE_SERVICE_ROLE_KEY not set. Check your env vars."
            )
        self.base = f"{SUPABASE_URL}/rest/v1"
        self.headers = {
            "apikey":        SERVICE_ROLE_KEY,
            "Authorization": f"Bearer {SERVICE_ROLE_KEY}",
            "Content-Type":  "application/json",
            "Prefer":        "return=representation",
        }

    def _url(self, table: str) -> str:
        return f"{self.base}/{table}"

    def _check_table(self, table: str):
        if table not in VALID_TABLES:
            close = [t for t in VALID_TABLES if table.lower() in t.lower()]
            hint = f" Did you mean: {', '.join(close)}?" if close else ""
            raise ValueError(f"Unknown table '{table}'.{hint}")

    # ── READ ────────────────────────────────────────────────────────────────

    def query(
        self,
        table: str,
        select: str = "*",
        filters: Optional[List[str]] = None,
        order: Optional[str] = None,
        limit: int = 50,
    ) -> List[Dict]:
        """
        SELECT from a table with optional filters.
        filters format: ["field.op.value", ...]  e.g. ["status.eq.active"]
        order format: "field.asc" or "field.desc"
        """
        self._check_table(table)
        params: Dict[str, str] = {"select": select, "limit": str(limit)}

        if filters:
            for f in filters:
                parts = f.split(".", 2)
                if len(parts) != 3:
                    raise ValueError(
                        f"Bad filter '{f}'. Use format: field.operator.value  "
                        f"e.g. status.eq.active"
                    )
                field, op, value = parts
                params[field] = f"{op}.{value}"

        if order:
            # "field.asc" → "field" with header Prefer: order=asc
            # PostgREST uses ?order=field.asc
            params["order"] = order.replace(".", " ", 1) if "." in order else order

        try:
            r = requests.get(self._url(table), headers=self.headers, params=params, timeout=15)
            r.raise_for_status()
            return r.json()
        except requests.HTTPError as e:
            raise RuntimeError(f"Supabase query error: {r.status_code} — {r.text}") from e

    def get_by_id(self, table: str, record_id: str) -> Optional[Dict]:
        """Fetch a single record by id."""
        results = self.query(table, filters=[f"id.eq.{record_id}"], limit=1)
        return results[0] if results else None

    def count(self, table: str, filters: Optional[List[str]] = None) -> int:
        """Return the count of matching rows."""
        self._check_table(table)
        params: Dict[str, str] = {"select": "id"}
        if filters:
            for f in filters:
                parts = f.split(".", 2)
                if len(parts) == 3:
                    params[parts[0]] = f"{parts[1]}.{parts[2]}"
        headers = {**self.headers, "Prefer": "count=exact"}
        try:
            r = requests.head(self._url(table), headers=headers, params=params, timeout=10)
            r.raise_for_status()
            cr = r.headers.get("content-range", "0/0")
            return int(cr.split("/")[-1]) if "/" in cr else 0
        except Exception:
            return 0

    def query_related(
        self,
        table: str,
        select: str,
        filters: Optional[List[str]] = None,
        limit: int = 50,
    ) -> List[Dict]:
        """
        Query with embedded relations.
        select example: "*,client:Client(name,email),Visa(*)"
        """
        return self.query(table, select=select, filters=filters, limit=limit)

    # ── WRITE ───────────────────────────────────────────────────────────────

    def insert(self, table: str, data: Dict) -> Dict:
        """INSERT a single row. Validates required fields."""
        self._check_table(table)
        required = REQUIRED_FIELDS.get(table, [])
        missing = [f for f in required if not data.get(f)]
        if missing:
            raise ValueError(
                f"Missing required field(s) for {table}: {', '.join(missing)}\n"
                f"Required: {', '.join(required)}"
            )
        try:
            r = requests.post(self._url(table), headers=self.headers, json=data, timeout=15)
            r.raise_for_status()
            result = r.json()
            return result[0] if isinstance(result, list) else result
        except requests.HTTPError as e:
            raise RuntimeError(f"Insert failed: {r.status_code} — {r.text}") from e

    def update(self, table: str, record_id: str, data: Dict) -> Dict:
        """UPDATE a record by id."""
        self._check_table(table)
        if not record_id:
            raise ValueError("record id is required for update")
        params = {"id": f"eq.{record_id}"}
        try:
            r = requests.patch(self._url(table), headers=self.headers, params=params, json=data, timeout=15)
            r.raise_for_status()
            result = r.json()
            return result[0] if isinstance(result, list) and result else {"id": record_id, **data}
        except requests.HTTPError as e:
            raise RuntimeError(f"Update failed: {r.status_code} — {r.text}") from e

    def delete(self, table: str, record_id: str) -> bool:
        """DELETE a record by id."""
        self._check_table(table)
        params = {"id": f"eq.{record_id}"}
        try:
            r = requests.delete(self._url(table), headers=self.headers, params=params, timeout=15)
            r.raise_for_status()
            return True
        except requests.HTTPError as e:
            raise RuntimeError(f"Delete failed: {r.status_code} — {r.text}") from e

    # ── REPORTS ─────────────────────────────────────────────────────────────

    def report_dashboard(self) -> str:
        """High-level dashboard: counts of all key entities."""
        lines = ["\n═══════════════════════════════════════",
                 "   PRO OFFICE DASHBOARD",
                 "═══════════════════════════════════════"]
        items = [
            ("Clients (total)",    "Client",            None),
            ("Leads (new)",        "Lead",              ["status.eq.new"]),
            ("Open Services",      "ServiceRequest",    ["status.neq.completed"]),
            ("Pending Visas",      "Visa",              ["status.eq.applied"]),
            ("Active Licenses",    "License",           ["status.eq.active"]),
            ("Pending Invoices",   "Invoice",           ["status.eq.pending"]),
            ("Follow-ups Due",     "FollowUp",          ["completed.eq.false"]),
            ("Attestations Active","Attestation",       ["status.eq.in_progress"]),
            ("Compliance Pending", "ComplianceDeadline",["status.eq.pending"]),
        ]
        for label, table, filters in items:
            try:
                n = self.count(table, filters)
                lines.append(f"  {label:<28} {n}")
            except Exception:
                lines.append(f"  {label:<28} (error)")
        lines.append("═══════════════════════════════════════\n")
        return "\n".join(lines)

    def report_pending_tasks(self) -> str:
        """All open services + unpaid invoices + upcoming follow-ups."""
        parts = []

        try:
            services = self.query("ServiceRequest", filters=["status.neq.completed"], order="createdAt.desc", limit=20)
            if services:
                cols = ["id", "serviceType", "status", "priority", "assignedTo"]
                parts.append(format_table(services, cols, f"Open Services ({len(services)})"))
        except Exception as e:
            parts.append(f"Services: error — {e}")

        try:
            invoices = self.query("Invoice", filters=["status.eq.pending"], limit=20)
            if invoices:
                cols = ["id", "amount", "status", "createdAt"]
                parts.append(format_table(invoices, cols, f"Unpaid Invoices ({len(invoices)})"))
        except Exception as e:
            parts.append(f"Invoices: error — {e}")

        try:
            followups = self.query("FollowUp", filters=["completed.eq.false"], order="dueDate.asc", limit=20)
            if followups:
                cols = ["id", "clientId", "step", "dueDate"]
                parts.append(format_table(followups, cols, f"Pending Follow-ups ({len(followups)})"))
        except Exception as e:
            parts.append(f"Follow-ups: error — {e}")

        return "\n\n".join(parts) if parts else "No pending tasks."

    def report_weekly_activity(self) -> str:
        """New leads, updated services, new clients from the last 7 days."""
        from datetime import timedelta
        cutoff = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()
        parts = []

        try:
            leads = self.query("Lead", filters=[f"createdAt.gte.{cutoff}"], order="createdAt.desc", limit=30)
            parts.append(format_table(leads, ["id", "name", "source", "status", "createdAt"], f"New Leads this week ({len(leads)})"))
        except Exception as e:
            parts.append(f"Leads: error — {e}")

        try:
            clients = self.query("Client", filters=[f"createdAt.gte.{cutoff}"], order="createdAt.desc", limit=20)
            parts.append(format_table(clients, ["id", "name", "company", "source", "createdAt"], f"New Clients this week ({len(clients)})"))
        except Exception as e:
            parts.append(f"Clients: error — {e}")

        return "\n\n".join(parts) if parts else "No activity in the last 7 days."

    def report_visa_alerts(self) -> str:
        """Visas expiring within 90 days or already expired."""
        visas = self.query("Visa", order="expiryDate.asc", limit=100)
        alerts = []
        for v in visas:
            d = _days_left(v.get("expiryDate"))
            if d is not None and d <= 90:
                alerts.append({**v, "_daysLeft": d})
        if not alerts:
            return "No visa alerts — all visas have expiry dates > 90 days away."
        lines = ["\n── Visa Alerts (expiring within 90 days) ──"]
        for v in sorted(alerts, key=lambda x: x["_daysLeft"]):
            d = v["_daysLeft"]
            flag = "🔴 EXPIRED" if d < 0 else f"🟡 {d}d left" if d <= 30 else f"🟠 {d}d left"
            lines.append(f"  {flag}  type={v.get('type','?')}  status={v.get('status','?')}  expires={_fmt_date(v.get('expiryDate'))}  id={v['id'][:8]}")
        return "\n".join(lines)

    def report_expiring_docs(self) -> str:
        """Documents expiring within 60 days."""
        docs = self.query("Document", limit=100)
        expiring = []
        for d in docs:
            days = _days_left(d.get("expiryDate"))
            if days is not None and days <= 60:
                expiring.append({**d, "_daysLeft": days})
        if not expiring:
            return "No documents expiring within 60 days."
        return format_table(
            sorted(expiring, key=lambda x: x["_daysLeft"]),
            ["id", "name", "type", "clientId", "expiryDate", "_daysLeft"],
            f"Documents Expiring Soon ({len(expiring)})"
        )

    def report_lead_summary(self) -> str:
        """Lead counts grouped by status."""
        leads = self.query("Lead", limit=500)
        from collections import Counter
        counts = Counter(l.get("status", "unknown") for l in leads)
        lines = [f"\n── Lead Summary ({len(leads)} total) ──"]
        for status, n in sorted(counts.items(), key=lambda x: -x[1]):
            lines.append(f"  {status:<20} {n}")
        sources = Counter(l.get("source", "unknown") for l in leads)
        lines.append("")
        lines.append("  By Source:")
        for src, n in sorted(sources.items(), key=lambda x: -x[1]):
            lines.append(f"    {src:<20} {n}")
        return "\n".join(lines)

    def report_revenue(self) -> str:
        """Revenue breakdown from paid invoices."""
        invoices = self.query("Invoice", limit=500)
        paid = [i for i in invoices if i.get("status") == "paid"]
        pending = [i for i in invoices if i.get("status") == "pending"]
        total_paid = sum(float(i.get("amount") or 0) for i in paid)
        total_pending = sum(float(i.get("amount") or 0) for i in pending)
        lines = [
            "\n── Revenue Report ──",
            f"  Paid invoices:       {len(paid)}   AED {total_paid:,.0f}",
            f"  Pending invoices:    {len(pending)}   AED {total_pending:,.0f}",
            f"  Total pipeline:      AED {total_paid + total_pending:,.0f}",
        ]
        return "\n".join(lines)

    def report_checklist(self, client_id: str) -> str:
        """Formation checklist progress for a single client."""
        steps = self.query("FormationChecklist", filters=[f"clientId.eq.{client_id}"], order="step.asc", limit=20)
        if not steps:
            return f"No formation checklist found for client {client_id}."
        done = sum(1 for s in steps if s.get("completed"))
        pct = int(done / len(steps) * 100)
        lines = [f"\n── Formation Checklist (client: {client_id}) ── {done}/{len(steps)} ({pct}%) ──"]
        for s in steps:
            tick = "✓" if s.get("completed") else "○"
            lines.append(f"  {tick} Step {s.get('step','?'):>2}. {s.get('name','?')}")
        return "\n".join(lines)

    # ── COMPLEX OPS ─────────────────────────────────────────────────────────

    def convert_lead_to_client(self, lead_id: str) -> str:
        """Read lead → create client → update lead status to 'converted'."""
        lead = self.get_by_id("Lead", lead_id)
        if not lead:
            return f"ERROR: Lead '{lead_id}' not found."

        client_data = {
            "name":          lead.get("name", "Unknown"),
            "email":         lead.get("email"),
            "phone":         lead.get("phone"),
            "source":        lead.get("source", "converted_lead"),
            "status":        "active",
        }
        client = self.insert("Client", client_data)
        self.update("Lead", lead_id, {"status": "converted"})

        return (
            f"✓ Lead '{lead.get('name')}' converted to Client.\n"
            f"  New client ID: {client.get('id', '?')}\n"
            f"  Lead status updated to: converted"
        )

    def advance_attestation(self, attestation_id: str) -> str:
        """Move attestation to the next checkpoint."""
        record = self.get_by_id("Attestation", attestation_id)
        if not record:
            return f"ERROR: Attestation '{attestation_id}' not found."

        current = record.get("checkpoint", "original_received")
        idx = CHECKPOINT_ORDER.index(current) if current in CHECKPOINT_ORDER else -1
        if idx == -1:
            return f"ERROR: Unknown checkpoint '{current}'."
        if idx >= len(CHECKPOINT_ORDER) - 1:
            return f"Attestation is already at the final stage: {CHECKPOINT_LABEL[current]}."

        next_cp = CHECKPOINT_ORDER[idx + 1]
        is_final = idx + 1 == len(CHECKPOINT_ORDER) - 1
        new_status = "completed" if is_final else "in_progress"

        self.update("Attestation", attestation_id, {
            "checkpoint": next_cp,
            "status":     new_status,
        })
        return (
            f"✓ Attestation advanced.\n"
            f"  Document: {record.get('documentName','?')}\n"
            f"  {CHECKPOINT_LABEL[current]} → {CHECKPOINT_LABEL[next_cp]}\n"
            f"  Status: {new_status}"
        )
