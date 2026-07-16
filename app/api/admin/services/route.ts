import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { adminEventBus } from "@/lib/events";

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { clientId, serviceType, status = "new", priority = "normal", assignedTo, deadline, notes } = body;
  if (!clientId || !serviceType) {
    return NextResponse.json({ error: "clientId and serviceType are required" }, { status: 400 });
  }

  const db = createAdminClient();
  const { data, error } = await db
    .from("ServiceRequest")
    .insert({ clientId, serviceType, status, priority, assignedTo, deadline, notes })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  adminEventBus.emit({ type: "created", entity: "service" });
  return NextResponse.json({ ok: true, data });
}
