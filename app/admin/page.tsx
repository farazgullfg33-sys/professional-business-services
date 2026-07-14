import { AdminPanel } from "@/components/admin/AdminPanel";
import { LoginForm } from "@/components/admin/LoginForm";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Admin"
};

export default async function AdminPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return <LoginForm />;

  const role = (user.app_metadata?.role as string | undefined) ?? "pro";

  const db = createAdminClient();
  const [
    { count: clients },
    { count: leads },
    { count: contacts },
    { count: quoteReqs },
    { count: services }
  ] = await Promise.all([
    db.from("Client").select("*", { count: "exact", head: true }),
    db.from("Lead").select("*", { count: "exact", head: true }),
    db.from("ContactSubmission").select("*", { count: "exact", head: true }),
    db.from("QuoteRequest").select("*", { count: "exact", head: true }),
    db.from("ServiceRequest").select("*", { count: "exact", head: true })
  ]);

  return <AdminPanel role={role} stats={{
    clients: clients ?? 0,
    leads: leads ?? 0,
    contacts: contacts ?? 0,
    quoteReqs: quoteReqs ?? 0,
    services: services ?? 0
  }} />;
}
