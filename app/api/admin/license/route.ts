import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { adminEventBus } from "@/lib/events";

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { clientId, licenseNumber, type, issueDate, expiryDate, status } = await request.json();
  if (!clientId) return NextResponse.json({ error: "clientId required" }, { status: 400 });

  const db = createAdminClient();
  const { data, error } = await db.from("License").insert({
    clientId,
    licenseNumber: licenseNumber || null,
    type: type || null,
    issueDate: issueDate || null,
    expiryDate: expiryDate || null,
    status: status || "active",
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  adminEventBus.emit({ type: "created", entity: "license" });
  return NextResponse.json({ ok: true, data });
}
