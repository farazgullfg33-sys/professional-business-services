#!/usr/bin/env python3
"""
PRO Supabase Tools — CLI entry point for Hermes Agent.

Usage:
  python pro_tools.py <command> [options]

Commands:
  query            Read data from a table
  insert           Insert a new record
  update           Update an existing record by ID
  delete           Delete a record by ID
  count            Count matching records
  report           Generate a named report
  convert-lead     Convert a lead to a client
  advance-attestation  Move attestation to next checkpoint

Run `python pro_tools.py --help` or `python pro_tools.py <command> --help` for details.
"""

import argparse
import json
import sys
import os

# Allow running from any directory
sys.path.insert(0, os.path.dirname(__file__))

try:
    from supabase_client import SupabaseClient, format_table
except ImportError as e:
    print(f"ERROR: Cannot import supabase_client: {e}")
    sys.exit(1)

VALID_REPORTS = [
    "dashboard", "pending_tasks", "weekly_activity",
    "checklist", "expiring_docs", "lead_summary",
    "revenue", "visa_alerts",
]


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="pro_tools",
        description="PRO office Supabase CLI tools for Hermes Agent",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    sub = parser.add_subparsers(dest="command", metavar="command")

    # ── query ─────────────────────────────────────────────────────────────
    q = sub.add_parser("query", help="Read records from a table")
    q.add_argument("--table", required=True, metavar="TableName",
                   help="Table to query (e.g. Lead, Client, Visa)")
    q.add_argument("--select", default="*", metavar="fields",
                   help="Comma-separated fields to return (default: *)")
    q.add_argument("--filter", action="append", dest="filters", metavar="field.op.value",
                   help="Filter condition, e.g. status.eq.active (repeatable)")
    q.add_argument("--order", metavar="field.asc|field.desc",
                   help="Sort order, e.g. createdAt.desc")
    q.add_argument("--limit", type=int, default=20, metavar="N",
                   help="Max rows to return (default: 20)")
    q.add_argument("--cols", metavar="col1,col2",
                   help="Display only these columns in output (comma-separated)")

    # ── insert ────────────────────────────────────────────────────────────
    i = sub.add_parser("insert", help="Insert a new record")
    i.add_argument("--table", required=True, metavar="TableName")
    i.add_argument("--data", required=True, metavar='\'{"field":"value"}\'',
                   help="JSON object with field values")

    # ── update ────────────────────────────────────────────────────────────
    u = sub.add_parser("update", help="Update a record by ID")
    u.add_argument("--table", required=True, metavar="TableName")
    u.add_argument("--id", required=True, dest="record_id", metavar="id")
    u.add_argument("--data", required=True, metavar='\'{"field":"value"}\'',
                   help="JSON object with fields to update")

    # ── delete ────────────────────────────────────────────────────────────
    d = sub.add_parser("delete", help="Delete a record by ID")
    d.add_argument("--table", required=True, metavar="TableName")
    d.add_argument("--id", required=True, dest="record_id", metavar="id")

    # ── count ─────────────────────────────────────────────────────────────
    c = sub.add_parser("count", help="Count records matching filters")
    c.add_argument("--table", required=True, metavar="TableName")
    c.add_argument("--filter", action="append", dest="filters", metavar="field.op.value")

    # ── report ────────────────────────────────────────────────────────────
    r = sub.add_parser("report", help=f"Named report. Types: {', '.join(VALID_REPORTS)}")
    r.add_argument("--type", required=True, choices=VALID_REPORTS, metavar="report_type")
    r.add_argument("--client-id", dest="client_id", metavar="id",
                   help="Required for --type checklist")

    # ── convert-lead ──────────────────────────────────────────────────────
    cl = sub.add_parser("convert-lead", help="Convert a lead to a client record")
    cl.add_argument("--id", required=True, dest="record_id", metavar="lead_id")

    # ── advance-attestation ───────────────────────────────────────────────
    aa = sub.add_parser("advance-attestation", help="Advance attestation to next checkpoint")
    aa.add_argument("--id", required=True, dest="record_id", metavar="attestation_id")

    return parser


def run():
    parser = build_parser()
    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        sys.exit(0)

    try:
        client = SupabaseClient()
    except RuntimeError as e:
        print(f"ERROR: {e}")
        sys.exit(1)

    try:
        # ── query ─────────────────────────────────────────────────────────
        if args.command == "query":
            rows = client.query(
                table=args.table,
                select=args.select,
                filters=args.filters,
                order=args.order,
                limit=args.limit,
            )
            if not rows:
                print(f"No records found in {args.table}" + (f" matching filters: {args.filters}" if args.filters else "."))
                return

            # determine display columns
            if args.cols:
                cols = [c.strip() for c in args.cols.split(",")]
            elif args.select != "*":
                cols = [c.strip() for c in args.select.split(",") if not c.strip().startswith("!")]
            else:
                # auto-detect from first row, prefer key fields
                all_keys = list(rows[0].keys())
                priority = ["id", "name", "email", "phone", "status", "type",
                            "source", "company", "role", "createdAt"]
                cols = [k for k in priority if k in all_keys]
                cols += [k for k in all_keys if k not in cols]
                cols = cols[:8]  # cap at 8 columns for readability

            filters_str = f" (filter: {', '.join(args.filters)})" if args.filters else ""
            print(format_table(rows, cols, f"{args.table}{filters_str}"))

        # ── insert ────────────────────────────────────────────────────────
        elif args.command == "insert":
            try:
                data = json.loads(args.data)
            except json.JSONDecodeError as e:
                print(f"ERROR: Invalid JSON in --data: {e}")
                sys.exit(1)
            record = client.insert(args.table, data)
            print(f"✓ Inserted into {args.table}")
            print(f"  ID: {record.get('id', '?')}")
            for k, v in record.items():
                if k != "id" and v is not None:
                    print(f"  {k}: {v}")

        # ── update ────────────────────────────────────────────────────────
        elif args.command == "update":
            try:
                data = json.loads(args.data)
            except json.JSONDecodeError as e:
                print(f"ERROR: Invalid JSON in --data: {e}")
                sys.exit(1)
            client.update(args.table, args.record_id, data)
            print(f"✓ Updated {args.table} record {args.record_id[:8]}...")
            for k, v in data.items():
                print(f"  {k} → {v}")

        # ── delete ────────────────────────────────────────────────────────
        elif args.command == "delete":
            client.delete(args.table, args.record_id)
            print(f"✓ Deleted {args.table} record {args.record_id[:8]}...")

        # ── count ─────────────────────────────────────────────────────────
        elif args.command == "count":
            n = client.count(args.table, args.filters)
            filters_str = f" matching {args.filters}" if args.filters else ""
            print(f"{args.table}{filters_str}: {n} record(s)")

        # ── report ────────────────────────────────────────────────────────
        elif args.command == "report":
            rtype = args.type
            if rtype == "dashboard":
                print(client.report_dashboard())
            elif rtype == "pending_tasks":
                print(client.report_pending_tasks())
            elif rtype == "weekly_activity":
                print(client.report_weekly_activity())
            elif rtype == "checklist":
                if not args.client_id:
                    print("ERROR: --type checklist requires --client-id <id>")
                    sys.exit(1)
                print(client.report_checklist(args.client_id))
            elif rtype == "expiring_docs":
                print(client.report_expiring_docs())
            elif rtype == "lead_summary":
                print(client.report_lead_summary())
            elif rtype == "revenue":
                print(client.report_revenue())
            elif rtype == "visa_alerts":
                print(client.report_visa_alerts())

        # ── convert-lead ──────────────────────────────────────────────────
        elif args.command == "convert-lead":
            print(client.convert_lead_to_client(args.record_id))

        # ── advance-attestation ───────────────────────────────────────────
        elif args.command == "advance-attestation":
            print(client.advance_attestation(args.record_id))

        else:
            print(f"ERROR: Unknown command '{args.command}'")
            parser.print_help()
            sys.exit(1)

    except (ValueError, RuntimeError) as e:
        print(f"ERROR: {e}")
        sys.exit(1)
    except KeyboardInterrupt:
        print("\nAborted.")
        sys.exit(0)


if __name__ == "__main__":
    run()
