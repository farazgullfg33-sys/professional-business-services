import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { adminEventBus } from "@/lib/events";

const FORMATION_STEPS = [
  "Name Reservation",
  "Initial Approval",
  "MOA Drafting",
  "MOA Notarization",
  "EJARI (Office Lease)",
  "Trade License Application",
  "Trade License Issued",
  "Immigration File Card",
  "Establishment Card",
  "First Visa Quota",
  "Bank Account Opening",
  "VAT / TRN Registration",
  "Chamber of Commerce",
  "Final Handover",
];

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { clientId } = await request.json();
  if (!clientId) return NextResponse.json({ error: "clientId required" }, { status: 400 });

  const db = createAdminClient();

  // Check if formation already started for this client
  const { count } = await db.from("FormationChecklist").select("*", { count: "exact", head: true }).eq("clientId", clientId);
  if ((count ?? 0) > 0) return NextResponse.json({ error: "Formation already started for this client" }, { status: 409 });

  const rows = FORMATION_STEPS.map((name, i) => ({ clientId, step: i + 1, name, completed: false }));
  const { error } = await db.from("FormationChecklist").insert(rows);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  adminEventBus.emit({ type: "created", entity: "formation" });
  return NextResponse.json({ ok: true });
}
