import Link from "next/link";
import { ArrowLeft, Building2, Mail, Phone } from "lucide-react";
import { cn } from "@/lib/utils";

function daysUntil(date: Date) {
  return Math.ceil((new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

function expiryBadge(expiryDate: Date | null) {
  if (!expiryDate) return null;
  const days = daysUntil(expiryDate);
  const tone = days <= 7 ? "bg-red-500/15 text-red-300" : days <= 30 ? "bg-amber-500/15 text-amber-300" : days <= 60 ? "bg-gold/15 text-gold" : "bg-emerald-500/15 text-emerald-300";
  return <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", tone)}>{days < 0 ? "Expired" : `${days}d left`}</span>;
}

export function ClientDetail({ client }: { client: any }) {
  return (
    <main className="min-h-screen bg-base p-5 text-body md:p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <Link href="/admin" className="inline-flex items-center gap-2 text-sm font-semibold text-muted hover:text-gold">
          <ArrowLeft size={16} /> Back to Admin
        </Link>

        <div className="glass-panel rounded-lg p-5 shadow-soft sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="font-heading text-2xl font-bold text-heading">{client.name}</h1>
              <div className="mt-2 flex flex-wrap gap-4 text-sm text-muted">
                {client.email ? <span className="inline-flex items-center gap-1.5"><Mail size={14} /> {client.email}</span> : null}
                {client.phone ? <span className="inline-flex items-center gap-1.5"><Phone size={14} /> {client.phone}</span> : null}
                {client.company ? <span className="inline-flex items-center gap-1.5"><Building2 size={14} /> {client.company}</span> : null}
              </div>
            </div>
            <span className="rounded-full bg-gold/10 px-3 py-1 text-xs font-semibold text-gold">{client.status}</span>
          </div>
          {client.notes ? <p className="mt-4 rounded-md border border-edge bg-panel p-3 text-sm text-body">{client.notes}</p> : null}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="glass-panel rounded-lg p-5 shadow-soft transition hover:border-gold/25 sm:p-6">
            <h2 className="font-heading text-lg font-semibold text-heading">Services</h2>
            <div className="mt-4 space-y-2">
              {client.services.length === 0 && <p className="text-sm text-muted">No service requests yet.</p>}
              {client.services.map((s: any) => (
                <div key={s.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-edge bg-panel px-3 py-2.5 text-sm transition hover:border-gold/20">
                  <div>
                    <p className="font-medium text-heading">{s.serviceType}</p>
                    <p className="text-xs text-muted">{s.assignedTo || "Unassigned"} &middot; {s.deadline ? new Date(s.deadline).toLocaleDateString() : "No deadline"}</p>
                  </div>
                  <span className="rounded-full bg-blue-500/15 px-2 py-0.5 text-xs text-blue-300">{s.status}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="glass-panel rounded-lg p-5 shadow-soft transition hover:border-gold/25 sm:p-6">
            <h2 className="font-heading text-lg font-semibold text-heading">Documents & Expiry</h2>
            <div className="mt-4 space-y-2">
              {client.documents.length === 0 && <p className="text-sm text-muted">No documents on file.</p>}
              {client.documents.map((d: any) => (
                <div key={d.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-edge bg-panel px-3 py-2.5 text-sm transition hover:border-gold/20">
                  <div>
                    <p className="font-medium text-heading">{d.name}</p>
                    <p className="text-xs text-muted">{d.type}</p>
                  </div>
                  {expiryBadge(d.expiryDate)}
                </div>
              ))}
            </div>
          </section>

          <section className="glass-panel rounded-lg p-5 shadow-soft transition hover:border-gold/25 sm:p-6">
            <h2 className="font-heading text-lg font-semibold text-heading">Follow-ups</h2>
            <div className="mt-4 space-y-2">
              {client.followUps.length === 0 && <p className="text-sm text-muted">No follow-ups scheduled.</p>}
              {client.followUps.map((f: any) => (
                <div key={f.id} className="rounded-md border border-edge bg-panel px-3 py-2.5 text-sm transition hover:border-gold/20">
                  <p className="font-medium text-heading">{f.step}</p>
                  <p className="text-xs text-muted">Due {new Date(f.dueDate).toLocaleDateString()} {f.completed ? "· Completed" : ""}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="glass-panel rounded-lg p-5 shadow-soft transition hover:border-gold/25 sm:p-6">
            <h2 className="font-heading text-lg font-semibold text-heading">Communication Log</h2>
            <div className="mt-4 space-y-2">
              {client.communications.length === 0 && <p className="text-sm text-muted">No communication logged.</p>}
              {client.communications.map((c: any) => (
                <div key={c.id} className="rounded-md border border-edge bg-panel px-3 py-2.5 text-sm transition hover:border-gold/20">
                  <p className="font-medium text-heading">{c.type} &middot; {c.staffName}</p>
                  <p className="text-xs text-body mt-1">{c.summary}</p>
                  <p className="text-xs text-muted mt-1">{new Date(c.createdAt).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        <section className="glass-panel rounded-lg p-5 shadow-soft transition hover:border-gold/25 sm:p-6">
          <h2 className="font-heading text-lg font-semibold text-heading">Quotes & Invoices</h2>
          <div className="mt-4 space-y-2">
            {client.quotes.length === 0 && <p className="text-sm text-muted">No quotes generated yet.</p>}
            {client.quotes.map((q: any) => (
              <div key={q.id} className="rounded-md border border-edge bg-panel px-3 py-2.5 text-sm transition hover:border-gold/20">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium text-heading">{q.services}</p>
                  <p className="font-bold text-heading">AED {q.total}</p>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {q.invoices.map((inv: any) => (
                    <span key={inv.id} className={cn("rounded-full px-2 py-0.5 text-xs", inv.status === "paid" ? "bg-emerald-500/15 text-emerald-300" : "bg-amber-500/15 text-amber-300")}>
                      Invoice {inv.status}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
