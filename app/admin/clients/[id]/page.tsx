import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { LoginForm } from "@/components/admin/LoginForm";
import { ClientDetail } from "@/components/admin/ClientDetail";

export const dynamic = "force-dynamic";
export const metadata = { title: "Client" };

export default async function ClientDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return <LoginForm />;

  const db = createAdminClient();
  const { data: client } = await db
    .from("Client")
    .select(`
      *,
      services:ServiceRequest(*),
      documents:Document(*),
      communications:CommunicationLog(*),
      followUps:FollowUp(*),
      quotes:Quote(*, invoices:Invoice(*))
    `)
    .eq("id", params.id)
    .single();

  if (!client) notFound();

  return <ClientDetail client={client} />;
}
