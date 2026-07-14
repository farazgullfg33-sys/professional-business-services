import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { adminEventBus } from "@/lib/events";

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { clientId, name, type, fileUrl, expiryDate } = await request.json();
  if (!clientId || !name || !type || !fileUrl) {
    return NextResponse.json({ error: "clientId, name, type, fileUrl required" }, { status: 400 });
  }

  const db = createAdminClient();
  const { data, error } = await db.from("Document").insert({
    clientId,
    name,
    type,
    fileUrl,
    expiryDate: expiryDate || null,
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  adminEventBus.emit({ type: "created", entity: "document" });
  return NextResponse.json({ ok: true, data });
}
