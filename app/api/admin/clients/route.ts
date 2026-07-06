import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, email, phone, company, businessType, source, notes } = await request.json();
  if (!name) return NextResponse.json({ error: "Name required" }, { status: 400 });

  const client = await prisma.client.create({
    data: {
      name,
      email: email || null,
      phone: phone || null,
      company: company || null,
      businessType: businessType || null,
      source: source || "direct",
      notes: notes || null,
      status: "active"
    }
  });

  return NextResponse.json({ ok: true, client });
}
