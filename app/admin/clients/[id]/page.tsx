import { getServerSession } from "next-auth";
import { notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { LoginForm } from "@/components/admin/LoginForm";
import { ClientDetail } from "@/components/admin/ClientDetail";

export const dynamic = "force-dynamic";
export const metadata = { title: "Client" };

export default async function ClientDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return <LoginForm />;

  const client = await prisma.client.findUnique({
    where: { id: params.id },
    include: {
      services: { orderBy: { createdAt: "desc" } },
      documents: { orderBy: { createdAt: "desc" } },
      communications: { orderBy: { createdAt: "desc" } },
      followUps: { orderBy: { dueDate: "asc" } },
      quotes: { orderBy: { createdAt: "desc" }, include: { invoices: true } }
    }
  });

  if (!client) notFound();

  return <ClientDetail client={client} />;
}
