import { getServerSession } from "next-auth";
import { AdminPanel } from "@/components/admin/AdminPanel";
import { LoginForm } from "@/components/admin/LoginForm";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Admin"
};

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  if (!session) return <LoginForm />;

  const [clients, leads, contacts, quotes, services] = await Promise.all([
    prisma.client.count(),
    prisma.lead.count(),
    prisma.contactSubmission.count(),
    prisma.quoteRequest.count(),
    prisma.serviceRequest.count()
  ]);

  return <AdminPanel role={session.user?.role} stats={{ clients, leads, contacts, quotes, services }} />;
}
