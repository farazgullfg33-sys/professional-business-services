import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { adminEventBus } from "@/lib/events";

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { clientId, type, dueDate, status, notes } = await request.json();
  if (!clientId || !type || !dueDate) return NextResponse.json({ error: "clientId, type, dueDate required" }, { status: 400 });

  const db = createAdminClient();
  const { data, error } = await db.from("ComplianceDeadline").insert({
    clientId,
    type,
    dueDate,
    status: status || "pending",
    notes: notes || null,
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  adminEventBus.emit({ type: "created", entity: "compliance" });
  return NextResponse.json({ ok: true, data });
}
