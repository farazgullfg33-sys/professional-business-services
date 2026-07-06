"use client";

import { useEffect, useState, useMemo } from "react";
import { signOut } from "next-auth/react";
import {
  BarChart3, CalendarDays, CheckSquare, ClipboardList, FileArchive, FileBadge,
  FileText, FolderOpen, LayoutDashboard, LogOut, MessageSquareText, ReceiptText,
  RefreshCcw, ShieldCheck, UserCog, UsersRound, Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";

type Stats = { clients: number; leads: number; contacts: number; quotes: number; services: number; followUps: number; };
type Client = { id: string; name: string; email?: string; phone?: string; company?: string; businessType?: string; status: string; source?: string; createdAt: string; };
type Lead = { id: string; name: string; email?: string; phone?: string; serviceInterest?: string; message?: string; status: string; source: string; createdAt: string; };
type Quote = { id: string; name: string; email: string; phone?: string; company?: string; serviceInterest?: string; message?: string; createdAt: string; };
type ServiceRow = { id: string; serviceType: string; status: string; priority: string; assignedTo?: string; deadline?: string; client: { name: string } };
type FollowUp = { id: string; step: string; dueDate: string; client: { name: string } };
type Recent = { name: string; company?: string; createdAt: string };

const modules = [
  { name: "Dashboard", icon: LayoutDashboard },
  { name: "Clients", icon: UsersRound },
  { name: "Services", icon: ClipboardList },
  { name: "Leads", icon: FileText },
  { name: "Quotes", icon: ReceiptText },
  { name: "Follow-ups", icon: RefreshCcw },
  { name: "Staff", icon: UserCog },
  { name: "Reports", icon: BarChart3 },
];

export function AdminPanel({ role, stats: initialStats }: { role?: string; stats: { clients: number; leads: number; contacts: number; quotes: number; services: number } }) {
  const [active, setActive] = useState("Dashboard");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (active === "Dashboard") { setData(null); return; }
    setLoading(true);
    setError("");
    fetch("/api/admin/data")
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => { setError("Failed to load"); setLoading(false); });
  }, [active]);

  const activeModule = useMemo(() => modules.find(m => m.name === active) ?? modules[0], [active]);

  return (
    <main className="min-h-screen bg-mist flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-navy/10 bg-white p-4 flex-shrink-0 hidden lg:block">
        <h1 className="text-lg font-bold text-navy">PRO Admin</h1>
        <p className="text-xs text-ink/50 mt-1">Role: {role || "admin"}</p>
        <nav className="mt-6 grid gap-0.5">
          {modules.map(m => {
            const Icon = m.icon;
            return (
              <button key={m.name} onClick={() => setActive(m.name)}
                className={cn("flex items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm font-medium transition", active === m.name ? "bg-gold text-navy" : "text-ink/60 hover:bg-mist hover:text-navy")}>
                <Icon size={16} /> {m.name}
              </button>
            );
          })}
        </nav>
        <div className="mt-8 pt-4 border-t border-navy/10">
          <button onClick={() => signOut({ callbackUrl: "/admin" })} className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-ink/50 hover:text-red-600 w-full">
            <LogOut size={16} /> Sign out
          </button>
        </div>
      </aside>

      {/* Mobile nav */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-navy/10 flex overflow-x-auto">
        {modules.map(m => {
          const Icon = m.icon;
          return (
            <button key={m.name} onClick={() => setActive(m.name)}
              className={cn("flex flex-col items-center gap-0.5 px-3 py-2 text-[10px] font-medium flex-shrink-0 min-w-[64px]", active === m.name ? "text-gold" : "text-ink/50")}>
              <Icon size={18} /> {m.name}
            </button>
          );
        })}
      </div>

      {/* Main content */}
      <section className="flex-1 p-4 md:p-6 pb-20 lg:pb-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-navy">{activeModule.name}</h2>
        </div>

        {loading ? <div className="flex items-center gap-3 text-ink/50"><Loader2 className="animate-spin" size={20} /> Loading...</div> : null}
        {error ? <p className="text-red-500">{error}</p> : null}

        {/* ---- DASHBOARD ---- */}
        {active === "Dashboard" && (
          <div className="grid gap-4 md:grid-cols-5">
            {[["Clients", initialStats.clients], ["Services", initialStats.services], ["Leads", initialStats.leads], ["Contacts", initialStats.contacts], ["Quotes", initialStats.quotes]].map(([label, value]) => (
              <div key={label} className="rounded-lg border border-navy/10 bg-white p-4 shadow-sm">
                <p className="text-sm font-semibold text-ink/50">{label}</p>
                <p className="mt-1 text-3xl font-bold text-navy">{value as number}</p>
              </div>
            ))}
          </div>
        )}

        {/* ---- CLIENTS ---- */}
        {active === "Clients" && data && (
          <div className="bg-white rounded-lg border border-navy/10 overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-mist text-navy">
                <tr><th className="px-4 py-3">Name</th><th className="px-4 py-3 hidden sm:table-cell">Email</th><th className="px-4 py-3 hidden sm:table-cell">Phone</th><th className="px-4 py-3 hidden md:table-cell">Type</th><th className="px-4 py-3">Source</th><th className="px-4 py-3">Status</th></tr>
              </thead>
              <tbody className="divide-y divide-navy/10">
                {data.clients?.map((c: Client) => (
                  <tr key={c.id}><td className="px-4 py-3 font-medium text-navy">{c.name}</td><td className="px-4 py-3 hidden sm:table-cell text-ink/60">{c.email || "-"}</td><td className="px-4 py-3 hidden sm:table-cell text-ink/60">{c.phone || "-"}</td><td className="px-4 py-3 hidden md:table-cell text-ink/60">{c.businessType || "-"}</td><td className="px-4 py-3"><span className="bg-gold/10 text-navy text-xs px-2 py-0.5 rounded-full">{c.source || "-"}</span></td><td className="px-4 py-3">{c.status}</td></tr>
                ))}
                {(!data.clients || data.clients.length === 0) && <tr><td colSpan={6} className="px-4 py-8 text-center text-ink/40">No clients yet</td></tr>}
              </tbody>
            </table>
          </div>
        )}

        {/* ---- SERVICES ---- */}
        {active === "Services" && data && (
          <div className="bg-white rounded-lg border border-navy/10 overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-mist text-navy">
                <tr><th className="px-4 py-3">Client</th><th className="px-4 py-3">Service</th><th className="px-4 py-3 hidden sm:table-cell">Assigned To</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 hidden md:table-cell">Deadline</th></tr>
              </thead>
              <tbody className="divide-y divide-navy/10">
                {data.services?.map((s: ServiceRow) => (
                  <tr key={s.id}><td className="px-4 py-3 font-medium text-navy">{s.client.name}</td><td className="px-4 py-3">{s.serviceType}</td><td className="px-4 py-3 hidden sm:table-cell text-ink/60">{s.assignedTo || "-"}</td><td className="px-4 py-3"><span className={cn("text-xs px-2 py-0.5 rounded-full", s.status === "in_progress" ? "bg-blue-50 text-blue-700" : s.status === "completed" ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700")}>{s.status}</span></td><td className="px-4 py-3 hidden md:table-cell text-ink/60">{s.deadline ? new Date(s.deadline).toLocaleDateString() : "-"}</td></tr>
                ))}
                {(!data.services || data.services.length === 0) && <tr><td colSpan={5} className="px-4 py-8 text-center text-ink/40">No services yet</td></tr>}
              </tbody>
            </table>
          </div>
        )}

        {/* ---- LEADS ---- */}
        {active === "Leads" && data && (
          <div className="bg-white rounded-lg border border-navy/10 overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-mist text-navy">
                <tr><th className="px-4 py-3">Name</th><th className="px-4 py-3 hidden sm:table-cell">Email</th><th className="px-4 py-3 hidden sm:table-cell">Phone</th><th className="px-4 py-3 hidden md:table-cell">Interest</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Source</th></tr>
              </thead>
              <tbody className="divide-y divide-navy/10">
                {data.leads?.map((l: Lead) => (
                  <tr key={l.id}><td className="px-4 py-3 font-medium text-navy">{l.name}</td><td className="px-4 py-3 hidden sm:table-cell text-ink/60">{l.email || "-"}</td><td className="px-4 py-3 hidden sm:table-cell text-ink/60">{l.phone || "-"}</td><td className="px-4 py-3 hidden md:table-cell text-ink/60">{l.serviceInterest || "-"}</td><td className="px-4 py-3">{l.status}</td><td className="px-4 py-3"><span className="bg-gold/10 text-navy text-xs px-2 py-0.5 rounded-full">{l.source}</span></td></tr>
                ))}
                {(!data.leads || data.leads.length === 0) && <tr><td colSpan={6} className="px-4 py-8 text-center text-ink/40">No leads yet</td></tr>}
              </tbody>
            </table>
          </div>
        )}

        {/* ---- QUOTES ---- */}
        {active === "Quotes" && data && (
          <div className="bg-white rounded-lg border border-navy/10 overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-mist text-navy">
                <tr><th className="px-4 py-3">Name</th><th className="px-4 py-3 hidden sm:table-cell">Email</th><th className="px-4 py-3 hidden sm:table-cell">Company</th><th className="px-4 py-3 hidden md:table-cell">Service</th><th className="px-4 py-3">Date</th></tr>
              </thead>
              <tbody className="divide-y divide-navy/10">
                {data.quotes?.map((q: Quote) => (
                  <tr key={q.id}><td className="px-4 py-3 font-medium text-navy">{q.name}</td><td className="px-4 py-3 hidden sm:table-cell text-ink/60">{q.email}</td><td className="px-4 py-3 hidden sm:table-cell text-ink/60">{q.company || "-"}</td><td className="px-4 py-3 hidden md:table-cell text-ink/60">{q.serviceInterest || "-"}</td><td className="px-4 py-3 text-ink/60">{new Date(q.createdAt).toLocaleDateString()}</td></tr>
                ))}
                {(!data.quotes || data.quotes.length === 0) && <tr><td colSpan={5} className="px-4 py-8 text-center text-ink/40">No quotes yet</td></tr>}
              </tbody>
            </table>
          </div>
        )}

        {/* ---- FOLLOW-UPS ---- */}
        {active === "Follow-ups" && data && (
          <div className="bg-white rounded-lg border border-navy/10 overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-mist text-navy">
                <tr><th className="px-4 py-3">Client</th><th className="px-4 py-3">Step</th><th className="px-4 py-3">Due Date</th></tr>
              </thead>
              <tbody className="divide-y divide-navy/10">
                {data.followUps?.map((f: FollowUp) => (
                  <tr key={f.id}><td className="px-4 py-3 font-medium text-navy">{f.client.name}</td><td className="px-4 py-3">{f.step}</td><td className="px-4 py-3 text-ink/60">{new Date(f.dueDate).toLocaleDateString()}</td></tr>
                ))}
                {(!data.followUps || data.followUps.length === 0) && <tr><td colSpan={3} className="px-4 py-8 text-center text-ink/40">No follow-ups</td></tr>}
              </tbody>
            </table>
          </div>
        )}

        {/* ---- STAFF ---- */}
        {active === "Staff" && (
          <div className="bg-white rounded-lg border border-navy/10 p-6">
            <p className="text-ink/60">Staff management coming soon. Currently only role-based access is configured in the database.</p>
            <p className="mt-2 text-sm text-ink/40">Login with admin@professionalbs.local / Password123!</p>
          </div>
        )}

        {/* ---- REPORTS ---- */}
        {active === "Reports" && (
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border border-navy/10 bg-white p-5"><p className="text-sm text-ink/50">Total Clients</p><p className="text-3xl font-bold text-navy">{initialStats.clients}</p></div>
            <div className="rounded-lg border border-navy/10 bg-white p-5"><p className="text-sm text-ink/50">Total Leads</p><p className="text-3xl font-bold text-navy">{initialStats.leads}</p></div>
            <div className="rounded-lg border border-navy/10 bg-white p-5"><p className="text-sm text-ink/50">Contact Submissions</p><p className="text-3xl font-bold text-navy">{initialStats.contacts}</p></div>
            <div className="rounded-lg border border-navy/10 bg-white p-5"><p className="text-sm text-ink/50">Quote Requests</p><p className="text-3xl font-bold text-navy">{initialStats.quotes}</p></div>
            <div className="rounded-lg border border-navy/10 bg-white p-5"><p className="text-sm text-ink/50">Active Services</p><p className="text-3xl font-bold text-navy">{initialStats.services}</p></div>
          </div>
        )}
      </section>
    </main>
  );
}
