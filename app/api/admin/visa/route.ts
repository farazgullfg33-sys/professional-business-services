import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { adminEventBus } from "@/lib/events";

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { clientId, type, status, applicationDate, expiryDate, remarks } = await request.json();
  if (!clientId || !type) return NextResponse.json({ error: "clientId and type required" }, { status: 400 });

  const db = createAdminClient();
  const { data, error } = await db.from("Visa").insert({
    clientId,
    type,
    status: status || "applied",
    applicationDate: applicationDate || null,
    expiryDate: expiryDate || null,
    remarks: remarks || null,
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  adminEventBus.emit({ type: "created", entity: "visa" });
  return NextResponse.json({ ok: true, data });
}
