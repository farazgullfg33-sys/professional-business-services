import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { adminEventBus } from "@/lib/events";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { clientId, services, govFees, proFees } = await request.json();
  if (!clientId || !services) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const total = (Number(govFees) || 0) + (Number(proFees) || 0);

  const quote = await prisma.quote.create({
    data: {
      clientId,
      services,
      govFees: Number(govFees) || 0,
      proFees: Number(proFees) || 0,
      total,
      status: "draft"
    }
  });

  // Auto-create invoice
  await prisma.invoice.create({
    data: {
      quoteId: quote.id,
      amount: total,
      status: "pending"
    }
  });

  adminEventBus.emit({ type: "created", entity: "invoice" });

  return NextResponse.json({ ok: true, quote, invoice: true });
}
