import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { adminEventBus } from "@/lib/events";

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { clientId, type, staffName, summary, outcome } = await request.json();
  if (!clientId || !type || !staffName || !summary) {
    return NextResponse.json({ error: "clientId, type, staffName, summary required" }, { status: 400 });
  }

  const db = createAdminClient();
  const { data, error } = await db.from("CommunicationLog").insert({
    clientId,
    type,
    staffName,
    summary,
    outcome: outcome || null,
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  adminEventBus.emit({ type: "created", entity: "client" });
  return NextResponse.json({ ok: true, data });
}
