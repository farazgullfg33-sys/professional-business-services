import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { adminEventBus } from "@/lib/events";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { completed, notes } = await request.json();
  const db = createAdminClient();
  const update: Record<string, unknown> = {};
  if (completed !== undefined) update.completed = completed;
  if (notes !== undefined) update.notes = notes;

  const { error } = await db.from("FormationChecklist").update(update).eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  adminEventBus.emit({ type: "updated", entity: "formation" });
  return NextResponse.json({ ok: true });
}
