"use client";

import { useEffect, useState, useMemo } from "react";
import { signOut } from "next-auth/react";
import {
  BarChart3, CalendarDays, CheckSquare, ClipboardList, FileArchive, FileBadge,
  FileText, FolderOpen, LayoutDashboard, LogOut, MessageSquareText, ReceiptText,
  RefreshCcw, ShieldCheck, UserCog, UsersRound, Loader2
} from "lucide-react";
import { Button } from "@/components/Button";
import { cn } from "@/lib/utils";

type Stats = { clients: number; leads: number; contacts: number; quotes: number; services: number; followUps: number; };
type Client = { id: string; name: string; email?: string; phone?: string; company?: string; businessType?: string; status: string; source?: string; createdAt: string; };
type Lead = { id: string; name: string; email?: string; phone?: string; serviceInterest?: string; message?: string; status: string; source: string; createdAt: string; };
type Quote = { id: string; name: string; email: string; phone?: string; company?: string; serviceInterest?: string; message?: string; createdAt: string; };
type ServiceRow = { id: string; serviceType: string; status: string; priority: string; assignedTo?: string; deadline?: string; client: { name: string } };
type FollowUp = { id: string; step: string; dueDate: string; client: { name: string } };

const modules = [
  { name: "Dashboard", icon: LayoutDashboard, detail: "Stats cards, today's tasks, recent activity feed, quick action buttons" },
  { name: "Clients", icon: UsersRound, detail: "Search, filters, CRUD-ready client table, source, linked services count" },
  { name: "Service Pipeline", icon: ClipboardList, detail: "Kanban: New, Assigned, In Progress, Under Review, Completed, Delivered" },
  { name: "Visa Tracker", icon: FileBadge, detail: "Visa status, expiry alerts at 60/30/14/7 days, bulk actions" },
  { name: "Company Formation", icon: CheckSquare, detail: "14-step checklist per client with progress bar" },
  { name: "License Calendar", icon: CalendarDays, detail: "Calendar and list view with renewal alerts and bulk renew" },
  { name: "Attestation Pipeline", icon: FileArchive, detail: "Chain tracking per document with custody checkpoints" },
  { name: "Compliance Calendar", icon: ShieldCheck, detail: "ESR, VAT, AML, PDPL deadlines with color coding" },
  { name: "Quotes & Invoices", icon: ReceiptText, detail: "Quote generator, quote-to-invoice conversion, payment tracking, PDF export" },
  { name: "Follow-ups", icon: RefreshCcw, detail: "Call, meeting, quote, negotiation reminders per client" },
  { name: "Documents", icon: FolderOpen, detail: "Upload zones, category tags, expiry tracking, bulk upload" },
  { name: "Communication Log", icon: MessageSquareText, detail: "Timestamped client communication with type filters" },
  { name: "Staff & Performance", icon: UserCog, detail: "Staff CRUD, task assignment, KPI dashboard" },
  { name: "Reports", icon: BarChart3, detail: "Revenue, leads by source, service breakdown, CSV export" }
];

const links = ["Tamm", "MOHRE", "ICP", "Amer", "GDRFA", "Tas'heel", "DED", "ADDED", "FTA", "MOFA"];
const urls = ["https://www.tamm.abudhabi", "https://www.mohre.gov.ae", "https://icp.gov.ae", "https://amer.ae", "https://www.gdrfad.gov.ae", "https://www.tasheel.ae", "https://dubaided.gov.ae", "https://added.gov.ae", "https://tax.gov.ae", "https://www.mofa.gov.ae"];

const dataTabs = ["Clients", "Service Pipeline", "Quotes & Invoices", "Follow-ups", "Reports"];
const placeholderTabs = ["Visa Tracker", "Company Formation", "License Calendar", "Attestation Pipeline", "Compliance Calendar", "Documents", "Communication Log", "Staff & Performance"];

export function AdminPanel({ role, stats: initialStats }: { role?: string; stats: { clients: number; leads: number; contacts: number; quotes: number; services: number } }) {
  const [active, setActive] = useState("Dashboard");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!dataTabs.includes(active)) { setData(null); return; }
    setLoading(true);
    fetch("/api/admin/data")
      .then(r => r.json()).then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [active]);

  const activeModule = useMemo(() => modules.find(m => m.name === active) ?? modules[0], [active]);

  return (
    <main className="min-h-screen bg-mist">
      <div className="grid lg:grid-cols-[280px_1fr]">
        {/* Sidebar */}
        <aside className="border-r border-navy/10 bg-white p-5">
          <h1 className="text-xl font-bold leading-tight text-navy">Professional Business Services Admin</h1>
          <p className="mt-2 text-sm text-ink/55">Role: {role}</p>
          <nav className="mt-7 grid gap-1">
            {modules.map((module) => {
              const Icon = module.icon;
              return (
                <button key={module.name} onClick={() => setActive(module.name)}
                  className={cn("flex items-center gap-3 rounded-md px-3 py-2 text-left text-sm font-semibold transition", active === module.name ? "bg-gold text-navy" : "text-ink/65 hover:bg-mist hover:text-navy")}>
                  <Icon size={17} /> {module.name}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Main */}
        <section className="p-5 md:p-8">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <h2 className="text-3xl font-semibold text-navy">{activeModule.name}</h2>
              <p className="mt-1 text-ink/60">{activeModule.detail}</p>
            </div>
            <button className="inline-flex items-center gap-2 rounded-md border border-navy/15 bg-white px-4 py-2 text-sm font-semibold text-navy" onClick={() => signOut({ callbackUrl: "/admin" })}>
              <LogOut size={16} /> Sign out
            </button>
          </div>

          {loading ? <div className="mt-6 flex items-center gap-3 text-ink/50"><Loader2 className="animate-spin" size={20} /> Loading...</div> : null}

          {/* ---- DASHBOARD ---- */}
          {active === "Dashboard" && (
            <>
              <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-5">
                {[["Clients", initialStats.clients], ["Services", initialStats.services], ["Leads", initialStats.leads], ["Contacts", initialStats.contacts], ["Quotes", initialStats.quotes]].map(([label, value]) => (
                  <div key={label as string} className="rounded-lg border border-navy/10 bg-white p-5 shadow-sm">
                    <p className="text-sm font-semibold text-ink/55">{label as string}</p>
                    <p className="mt-2 text-3xl font-bold text-navy">{value as number}</p>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ---- CLIENTS ---- */}
          {active === "Clients" && data && (
            <div className="mt-6 bg-white rounded-lg border border-navy/10 overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-mist text-navy"><tr><th className="px-4 py-3">Name</th><th className="px-4 py-3 hidden sm:table-cell">Email</th><th className="px-4 py-3 hidden sm:table-cell">Phone</th><th className="px-4 py-3 hidden md:table-cell">Type</th><th className="px-4 py-3">Source</th><th className="px-4 py-3">Status</th></tr></thead>
                <tbody className="divide-y divide-navy/10">
                  {data.clients?.map((c: Client) => (
                    <tr key={c.id}><td className="px-4 py-3 font-medium text-navy">{c.name}</td><td className="px-4 py-3 hidden sm:table-cell text-ink/60">{c.email || "-"}</td><td className="px-4 py-3 hidden sm:table-cell text-ink/60">{c.phone || "-"}</td><td className="px-4 py-3 hidden md:table-cell text-ink/60">{c.businessType || "-"}</td><td className="px-4 py-3"><span className="bg-gold/10 text-navy text-xs px-2 py-0.5 rounded-full">{c.source || "-"}</span></td><td className="px-4 py-3">{c.status}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ---- SERVICE PIPELINE ---- */}
          {active === "Service Pipeline" && data && (
            <div className="mt-6 bg-white rounded-lg border border-navy/10 overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-mist text-navy"><tr><th className="px-4 py-3">Client</th><th className="px-4 py-3">Service</th><th className="px-4 py-3 hidden sm:table-cell">Assigned</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 hidden md:table-cell">Deadline</th></tr></thead>
                <tbody className="divide-y divide-navy/10">
                  {data.services?.map((s: ServiceRow) => (
                    <tr key={s.id}><td className="px-4 py-3 font-medium text-navy">{s.client.name}</td><td className="px-4 py-3">{s.serviceType}</td><td className="px-4 py-3 hidden sm:table-cell text-ink/60">{s.assignedTo || "-"}</td><td className="px-4 py-3"><span className={cn("text-xs px-2 py-0.5 rounded-full", s.status==="in_progress"?"bg-blue-50 text-blue-700":s.status==="completed"?"bg-green-50 text-green-700":"bg-amber-50 text-amber-700")}>{s.status}</span></td><td className="px-4 py-3 hidden md:table-cell text-ink/60">{s.deadline?new Date(s.deadline).toLocaleDateString():"-"}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ---- QUOTES & INVOICES ---- */}
          {active === "Quotes & Invoices" && data && (
            <div className="mt-6 bg-white rounded-lg border border-navy/10 overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-mist text-navy"><tr><th className="px-4 py-3">Name</th><th className="px-4 py-3 hidden sm:table-cell">Email</th><th className="px-4 py-3 hidden sm:table-cell">Company</th><th className="px-4 py-3 hidden md:table-cell">Service</th><th className="px-4 py-3">Date</th></tr></thead>
                <tbody className="divide-y divide-navy/10">
                  {data.quotes?.map((q: Quote) => (
                    <tr key={q.id}><td className="px-4 py-3 font-medium text-navy">{q.name}</td><td className="px-4 py-3 hidden sm:table-cell text-ink/60">{q.email}</td><td className="px-4 py-3 hidden sm:table-cell text-ink/60">{q.company||"-"}</td><td className="px-4 py-3 hidden md:table-cell text-ink/60">{q.serviceInterest||"-"}</td><td className="px-4 py-3 text-ink/60">{new Date(q.createdAt).toLocaleDateString()}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ---- FOLLOW-UPS ---- */}
          {active === "Follow-ups" && data && (
            <div className="mt-6 bg-white rounded-lg border border-navy/10 overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-mist text-navy"><tr><th className="px-4 py-3">Client</th><th className="px-4 py-3">Step</th><th className="px-4 py-3">Due Date</th></tr></thead>
                <tbody className="divide-y divide-navy/10">
                  {data.followUps?.map((f: FollowUp) => (
                    <tr key={f.id}><td className="px-4 py-3 font-medium text-navy">{f.client.name}</td><td className="px-4 py-3">{f.step}</td><td className="px-4 py-3 text-ink/60">{new Date(f.dueDate).toLocaleDateString()}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ---- PLACEHOLDER TABS ---- */}
          {placeholderTabs.includes(active) && (
            <div className="mt-6 rounded-lg border border-navy/10 bg-white p-8 text-center">
              <p className="text-ink/50 text-lg">Coming Soon</p>
              <p className="mt-2 text-ink/40 text-sm">This module will be built in the next phase. Database schema is ready.</p>
            </div>
          )}

          {/* ---- LEADS ---- */}
          {active === "Leads" && data && (
            <div className="mt-6 bg-white rounded-lg border border-navy/10 overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-mist text-navy"><tr><th className="px-4 py-3">Name</th><th className="px-4 py-3 hidden sm:table-cell">Email</th><th className="px-4 py-3 hidden sm:table-cell">Phone</th><th className="px-4 py-3 hidden md:table-cell">Interest</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Source</th></tr></thead>
                <tbody className="divide-y divide-navy/10">
                  {data.leads?.map((l: Lead) => (
                    <tr key={l.id}><td className="px-4 py-3 font-medium text-navy">{l.name}</td><td className="px-4 py-3 hidden sm:table-cell text-ink/60">{l.email||"-"}</td><td className="px-4 py-3 hidden sm:table-cell text-ink/60">{l.phone||"-"}</td><td className="px-4 py-3 hidden md:table-cell text-ink/60">{l.serviceInterest||"-"}</td><td className="px-4 py-3">{l.status}</td><td className="px-4 py-3"><span className="bg-gold/10 text-navy text-xs px-2 py-0.5 rounded-full">{l.source}</span></td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ---- REPORTS ---- */}
          {active === "Reports" && (
            <div className="mt-6 grid gap-5 md:grid-cols-3">
              {[["Total Clients",initialStats.clients],["Total Leads",initialStats.leads],["Contact Submissions",initialStats.contacts],["Quote Requests",initialStats.quotes],["Active Services",initialStats.services]].map(([l,v])=>(
                <div key={l} className="rounded-lg border border-navy/10 bg-white p-5"><p className="text-sm text-ink/50">{l}</p><p className="text-3xl font-bold text-navy">{v as number}</p></div>
              ))}
            </div>
          )}

          {/* Quick Links + Actions Sidebar (shown for Dashboard/Services/Visa/Formation/License) */}
          {(active === "Dashboard" || active === "Service Pipeline" || active === "Visa Tracker" || active === "Company Formation" || active === "License Calendar") && (
            <div className="mt-8 grid gap-6 xl:grid-cols-[1fr_340px]">
              <div className="rounded-lg border border-navy/10 bg-white p-6 shadow-sm">
                <h3 className="text-xl font-semibold text-navy">{activeModule.name} Workspace</h3>
                {active === "Dashboard" && (
                  <div className="mt-5 grid gap-4 md:grid-cols-3">
                    {["New","Assigned","In Progress","Under Review","Completed","Delivered"].map((s,i)=>(
                      <div key={s} className="min-h-28 rounded-md border border-navy/10 bg-mist p-4"><p className="text-sm font-semibold text-navy">{s}</p><p className="mt-3 text-xs leading-5 text-ink/60">{data?.services?.filter((x:ServiceRow)=>x.status===s.toLowerCase().replace(" ","_")).length||i+1} items in pipeline</p></div>
                    ))}
                  </div>
                )}
                {active !== "Dashboard" && <p className="mt-5 text-ink/50 text-sm">Detailed {activeModule.name.toLowerCase()} workspace will appear here with live pipeline data.</p>}
              </div>
              <aside className="space-y-6">
                <div className="rounded-lg border border-navy/10 bg-white p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-navy">Quick Links Sidebar</h3>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    {links.map((link, i) => <a key={link} href={urls[i]} target="_blank" rel="noreferrer" className="rounded-md border border-navy/10 px-3 py-2 text-sm font-semibold text-navy hover:border-gold">{link}</a>)}
                  </div>
                </div>
                <div className="rounded-lg border border-navy/10 bg-white p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-navy">Quick Actions</h3>
                  <div className="mt-4 grid gap-2">
                    <Button type="button">New Client</Button>
                    <Button type="button" variant="outline">Generate Quote PDF</Button>
                    <Button type="button" variant="outline">Export CSV</Button>
                  </div>
                </div>
              </aside>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
