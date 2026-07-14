import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";

const schema = z.object({
  name: z.string().optional().default(""),
  email: z.string().email(),
  phone: z.string().optional().default(""),
  message: z.string().min(2)
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid submission" }, { status: 400 });
  }

  const db = createAdminClient();
  await Promise.all([
    db.from("ContactSubmission").insert(parsed.data),
    db.from("Lead").insert({
      name: parsed.data.name || "Website Contact",
      email: parsed.data.email,
      phone: parsed.data.phone,
      message: parsed.data.message,
      source: "website"
    })
  ]);

  return NextResponse.json({ ok: true });
}
