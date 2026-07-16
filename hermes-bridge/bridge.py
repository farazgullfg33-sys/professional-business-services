#!/usr/bin/env python3
"""
PRO Services receptionist bridge.
HTTP server that receives lead submissions, saves to JSONL, and inserts into Supabase.
Stdlib only — no pip packages required.
"""

import json
import os
import urllib.request
from http.server import BaseHTTPRequestHandler, HTTPServer
from urllib.parse import urlparse

LEADS_FILE = os.environ.get("LEADS_FILE", "/data/receptionist/logs/leads.jsonl")
SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://bvaykkygqxbbrfxbnyhv.supabase.co")
SUPABASE_ANON_KEY = os.environ.get("SUPABASE_ANON_KEY", "sb_publishable_jshGnyOjWqN1qFPYIEWn_A_v4hzS45S")
PORT = int(os.environ.get("BRIDGE_PORT", "3006"))


def save_lead_local(lead: dict) -> None:
  os.makedirs(os.path.dirname(LEADS_FILE), exist_ok=True)
  with open(LEADS_FILE, "a", encoding="utf-8") as f:
    f.write(json.dumps(lead, ensure_ascii=False) + "\n")


def insert_lead_supabase(lead: dict) -> None:
  payload = json.dumps({
    "name": lead.get("name", ""),
    "email": lead.get("email") or None,
    "phone": lead.get("phone") or None,
    "serviceInterest": lead.get("serviceInterest") or lead.get("service") or None,
    "message": lead.get("message") or None,
    "source": "website",
    "status": "new",
  }, ensure_ascii=False).encode("utf-8")

  req = urllib.request.Request(
    f"{SUPABASE_URL}/rest/v1/Lead",
    data=payload,
    headers={
      "Content-Type": "application/json",
      "apikey": SUPABASE_ANON_KEY,
      "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
      "Prefer": "return=minimal",
    },
    method="POST",
  )
  with urllib.request.urlopen(req, timeout=8) as resp:
    print(f"[bridge] Supabase insert: {resp.status}")


class BridgeHandler(BaseHTTPRequestHandler):
  def log_message(self, fmt, *args):
    print(f"[bridge] {self.address_string()} - {fmt % args}")

  def _send_json(self, code: int, body: dict) -> None:
    data = json.dumps(body).encode("utf-8")
    self.send_response(code)
    self.send_header("Content-Type", "application/json")
    self.send_header("Content-Length", str(len(data)))
    self.send_header("Access-Control-Allow-Origin", "*")
    self.end_headers()
    self.wfile.write(data)

  def do_OPTIONS(self):
    self.send_response(200)
    self.send_header("Access-Control-Allow-Origin", "*")
    self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
    self.send_header("Access-Control-Allow-Headers", "Content-Type")
    self.end_headers()

  def do_POST(self):
    path = urlparse(self.path).path
    if path not in ("/lead", "/api/lead"):
      self._send_json(404, {"error": "Not found"})
      return

    length = int(self.headers.get("Content-Length", 0))
    try:
      body = json.loads(self.rfile.read(length).decode("utf-8"))
    except Exception:
      self._send_json(400, {"error": "Invalid JSON"})
      return

    if not body.get("name"):
      self._send_json(400, {"error": "name is required"})
      return

    # 1. Save to local JSONL
    try:
      save_lead_local(body)
      print(f"[bridge] Lead saved locally: {body.get('name')}")
    except Exception as e:
      print(f"[bridge] Local save failed: {e}")

    # 2. Insert into Supabase
    try:
      insert_lead_supabase(body)
    except Exception as e:
      print(f"[bridge] Supabase insert failed: {e}")

    self._send_json(200, {"ok": True})

  def do_GET(self):
    path = urlparse(self.path).path
    if path == "/health":
      self._send_json(200, {"status": "ok"})
    else:
      self._send_json(404, {"error": "Not found"})


if __name__ == "__main__":
  server = HTTPServer(("0.0.0.0", PORT), BridgeHandler)
  print(f"[bridge] Listening on port {PORT}")
  print(f"[bridge] Leads file: {LEADS_FILE}")
  print(f"[bridge] Supabase URL: {SUPABASE_URL}")
  server.serve_forever()
