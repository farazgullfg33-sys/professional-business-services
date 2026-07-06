import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

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
  await prisma.contactSubmission.create({ data: parsed.data });
  // Also create a Lead
  await prisma.lead.create({
    data: {
      name: parsed.data.name || "Website Contact",
      email: parsed.data.email,
      phone: parsed.data.phone,
      message: parsed.data.message,
      source: "website"
    }
  });
  return NextResponse.json({ ok: true });
}
