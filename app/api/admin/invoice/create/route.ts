import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { quoteId, amount, paymentMethod } = await request.json();
  if (!quoteId || !amount) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const invoice = await prisma.invoice.create({
    data: { quoteId, amount: Number(amount), paymentMethod: paymentMethod || "Bank Transfer", status: "pending" }
  });

  return NextResponse.json({ ok: true, invoice });
}
