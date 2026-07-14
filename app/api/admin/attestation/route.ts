import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { adminEventBus } from "@/lib/events";

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { clientId, documentName, documentType, notes } = await request.json();
  if (!clientId || !documentName) {
    return NextResponse.json({ error: "clientId and documentName required" }, { status: 400 });
  }

  const db = createAdminClient();
  const { data, error } = await db.from("Attestation").insert({
    clientId,
    documentName,
    documentType: documentType || null,
    checkpoint: "original_received",
    status: "in_progress",
    notes: notes || null,
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  adminEventBus.emit({ type: "created", entity: "document" });
  return NextResponse.json({ ok: true, data });
}
