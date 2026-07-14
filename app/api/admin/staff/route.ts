import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { adminEventBus } from "@/lib/events";

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, email, role } = await request.json();
  if (!name || !email) return NextResponse.json({ error: "name and email required" }, { status: 400 });

  const db = createAdminClient();
  const { data, error } = await db.from("Staff").insert({
    name,
    email,
    password: "pending_auth_setup",
    role: role || "pro",
    active: true,
  }).select("id, name, email, role, active").single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  adminEventBus.emit({ type: "created", entity: "staff" });
  return NextResponse.json({ ok: true, data });
}
