import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [clients, leads, contacts, quotes, services, followUps, recent] = await Promise.all([
    prisma.client.findMany({ orderBy: { createdAt: "desc" }, take: 50 }),
    prisma.lead.findMany({ orderBy: { createdAt: "desc" }, take: 50 }),
    prisma.contactSubmission.findMany({ orderBy: { createdAt: "desc" }, take: 50 }),
    prisma.quoteRequest.findMany({ orderBy: { createdAt: "desc" }, take: 50 }),
    prisma.serviceRequest.findMany({ orderBy: { createdAt: "desc" }, take: 50, include: { client: { select: { name: true } } } }),
    prisma.followUp.findMany({ orderBy: { dueDate: "asc" }, take: 50, include: { client: { select: { name: true } } } }),
    prisma.client.findMany({ orderBy: { createdAt: "desc" }, take: 5, select: { name: true, company: true, createdAt: true } })
  ]);

  const counts = {
    clients: await prisma.client.count(),
    leads: await prisma.lead.count(),
    contacts: await prisma.contactSubmission.count(),
    quotes: await prisma.quoteRequest.count(),
    services: await prisma.serviceRequest.count(),
    followUps: await prisma.followUp.count(),
  };

  return NextResponse.json({ counts, clients, leads, contacts, quotes, services, followUps, recent });
}
