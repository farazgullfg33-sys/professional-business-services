"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import {
  AlertTriangle, BarChart3, CalendarDays, CheckSquare, ClipboardList, Download, FileArchive, FileBadge,
  FileText, FolderOpen, GripVertical, LayoutDashboard, LogOut, Menu, MessageSquareText, Plus, ReceiptText,
  RefreshCcw, ShieldCheck, Sparkles, UserCog, UsersRound, Loader2, Wallet, X
} from "lucide-react";
import { Button } from "@/components/Button";
import { cn } from "@/lib/utils";
import { acquisitionFunnel, leadsBySource, monthlyRevenueSeries, staffProductivity, statusBreakdown } from "@/lib/reports";
import { AcquisitionFunnelChart, LeadsBySourceChart, RevenueTrendChart, StaffProductivityChart, StatusBreakdownChart } from "@/components/admin/Charts";
import { useSSE } from "@/hooks/useSSE";
import { AdminChatbot } from "@/components/admin/AdminChatbot";

type Stats = { clients: number; leads: number; contacts: number; quoteReqs: number; services: number };
type Client = { id: string; name: string; email?: string; phone?: string; company?: string; businessType?: string; status: string; source?: string };
type Lead = { id: string; name: string; email?: string; phone?: string; serviceInterest?: string; message?: string; status: string; source: string };
type ServiceRow = { id: string; serviceType: string; status: string; priority: string; assignedTo?: string; deadline?: string; client: { name: string } };
type FollowUp = { id: string; step: string; dueDate: string; client: { name: string } };
type InvoiceRow = { id: string; amount: number; status: string; paidAt?: string; createdAt: string; quote: { client: { name: string } } };
type DocumentRow = { id: string; name: string; type: string; expiryDate?: string; client: { name: string } };

const pipelineColumns = [
  { key: "new", label: "New", dot: "bg-blue-400" },
  { key: "in_progress", label: "In Progress", dot: "bg-gold" },
  { key: "review", label: "Review", dot: "bg-amber-400" },
  { key: "completed", label: "Completed", dot: "bg-emerald-400" }
];

const modules = [
  { name: "Dashboard", icon: LayoutDashboard, detail: "Revenue, active clients, pending tasks, quick actions" },
  { name: "Clients", icon: UsersRound, detail: "Search, filters, CRUD-ready client table, source, linked services count" },
  { name: "Service Pipeline", icon: ClipboardList, detail: "Drag-drop kanban: New, In Progress, Review, Completed" },
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

const links = ["Tamm","MOHRE","ICP","Amer","GDRFA","Tas'heel","DED","ADDED","FTA","MOFA"];
const urls = ["https://www.tamm.abudhabi","https://www.mohre.gov.ae","https://icp.gov.ae","https://amer.ae","https://www.gdrfad.gov.ae","https://www.tasheel.ae","https://dubaided.gov.ae","https://added.gov.ae","https://tax.gov.ae","https://www.mofa.gov.ae"];

const bizTypes = ["trade","tech","consulting","holding","media","services","other"];
const sources = ["direct","website","referral","walk-in","social","call"];
const placeholders = ["Visa Tracker","Company Formation","License Calendar","Attestation Pipeline","Compliance Calendar","Documents","Communication Log","Staff & Performance"];

const inputClass = "rounded-md border border-edge bg-base px-3 py-2 text-sm text-heading placeholder:text-muted focus:border-gold focus:outline-none";

const currency = (value: number) =>
  new Intl.NumberFormat("en-AE", { style: "currency", currency: "AED", maximumFractionDigits: 0 }).format(value || 0);

function revenueTotals(invoices: InvoiceRow[] = []) {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  let today = 0, month = 0, ytd = 0;
  for (const inv of invoices) {
    if (inv.status !== "paid") continue;
    const paidOn = new Date(inv.paidAt || inv.createdAt);
    const amount = Number(inv.amount) || 0;
    if (paidOn >= startOfYear) ytd += amount;
    if (paidOn >= startOfMonth) month += amount;
    if (paidOn >= startOfDay) today += amount;
  }
  return { today, month, ytd };
}

function pendingTaskCounts(data: any) {
  const openServices = ((data?.services ?? []) as ServiceRow[]).filter((s) => !["completed", "delivered"].includes(s.status)).length;
  const pendingInvoices = ((data?.invoices ?? []) as InvoiceRow[]).filter((i) => i.status !== "paid").length;
  const dueSoon = ((data?.followUps ?? []) as FollowUp[]).filter((f) => new Date(f.dueDate).getTime() <= Date.now() + 1000 * 60 * 60 * 24 * 7).length;
  return { openServices, pendingInvoices, dueSoon, total: openServices + pendingInvoices + dueSoon };
}

function expiringDocuments(documents: DocumentRow[] = []) {
  return documents
    .filter((d) => d.expiryDate)
    .map((d) => ({ ...d, daysLeft: Math.ceil((new Date(d.expiryDate as string).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) }))
    .filter((d) => d.daysLeft <= 60)
    .sort((a, b) => a.daysLeft - b.daysLeft);
}

export function AdminPanel({ role, stats: initialStats }: { role?: string; stats: Stats }) {
  const [active, setActive] = useState("Dashboard");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [showNewClient, setShowNewClient] = useState(false);
  const [showNewQuote, setShowNewQuote] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const fetchData = () => {
    setLoading(true);
    fetch("/api/admin/data").then(r=>r.json()).then(d=>{setData(d);setLoading(false)}).catch(()=>setLoading(false));
  };

  useEffect(() => { fetchData(); }, [active]);

  const { connected: live } = useSSE("/api/admin/events", () => fetchData());

  const activeModule = useMemo(() => modules.find(m => m.name === active) ?? modules[0], [active]);
  const revenue = useMemo(() => revenueTotals(data?.invoices), [data]);
  const pending = useMemo(() => pendingTaskCounts(data), [data]);
  const alerts = useMemo(() => expiringDocuments(data?.documents), [data]);
  const revenueSeries = useMemo(() => monthlyRevenueSeries(data?.invoices), [data]);
  const pipelineBreakdown = useMemo(() => statusBreakdown(data?.services), [data]);
  const funnel = useMemo(() => acquisitionFunnel({
    leads: initialStats.leads,
    quoteReqs: initialStats.quoteReqs,
    clients: initialStats.clients,
    completed: (data?.services ?? []).filter((s: ServiceRow) => ["completed", "delivered"].includes(s.status)).length
  }), [data, initialStats]);
  const sourceBreakdown = useMemo(() => leadsBySource(data?.leads), [data]);
  const productivity = useMemo(() => staffProductivity(data?.services), [data]);

  const updateServiceStatus = async (id: string, status: string) => {
    setData((prev: any) => prev ? { ...prev, services: prev.services.map((s: ServiceRow) => s.id === id ? { ...s, status } : s) } : prev);
    const r = await fetch(`/api/admin/services/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    if (!r.ok) fetchData();
  };

  const exportCSV = () => {
    if (!data?.clients) return;
    const rows = data.clients.map((c:Client) => [c.name,c.email,c.phone,c.company,c.businessType,c.source,c.status].join(","));
    const csv = "Name,Email,Phone,Company,Type,Source,Status\n"+rows.join("\n");
    const blob = new Blob([csv],{type:"text/csv"});
    const a = document.createElement("a"); a.href=URL.createObjectURL(blob); a.download="clients-export.csv"; a.click();
  };

  const handleNewClient = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const r = await fetch("/api/admin/clients", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(Object.fromEntries(f)) });
    if (r.ok) { setShowNewClient(false); setActive("Clients"); fetchData(); }
  };

  const handleNewQuote = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const r = await fetch("/api/admin/quote/create", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(Object.fromEntries(f)) });
    if (r.ok) { setShowNewQuote(false); fetchData(); alert("Quote created! Check Quotes & Invoices tab."); }
  };

  return (
    <main className="min-h-screen bg-base text-body">
      {/* MOBILE TOP BAR */}
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-edge bg-base/95 px-4 py-3 backdrop-blur lg:hidden">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-gold/40 bg-gold/10 text-gold">
            <Sparkles size={16} />
          </span>
          <h1 className="font-heading text-base font-bold text-heading">PRO Admin</h1>
        </div>
        <button
          onClick={() => setMobileNavOpen(true)}
          aria-label="Open menu"
          className="flex h-10 w-10 items-center justify-center rounded-md border border-edge text-heading active:bg-panel"
        >
          <Menu size={20} />
        </button>
      </div>

      {/* MOBILE OVERLAY */}
      <AnimatePresence>
        {mobileNavOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
            onClick={() => setMobileNavOpen(false)}
          />
        )}
      </AnimatePresence>

      <div className="grid lg:grid-cols-[280px_1fr]">
        <aside
          className={cn(
            "glass-panel fixed inset-y-0 left-0 z-50 w-[82vw] max-w-[300px] overflow-y-auto border-r border-edge p-5 shadow-soft transition-transform duration-300 ease-out",
            "lg:sticky lg:top-0 lg:z-auto lg:h-screen lg:w-auto lg:max-w-none lg:translate-x-0 lg:shadow-none",
            mobileNavOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <div className="flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-gold/40 bg-gold/10 text-gold">
                <Sparkles size={18} />
              </span>
              <div>
                <h1 className="font-heading text-lg font-bold text-heading">PRO Admin</h1>
                <p className="text-xs text-muted">Role: {role ?? "staff"}</p>
              </div>
            </div>
            <button
              onClick={() => setMobileNavOpen(false)}
              aria-label="Close menu"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-edge text-muted hover:text-heading lg:hidden"
            >
              <X size={17} />
            </button>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xs font-medium">
            <span className={cn("h-1.5 w-1.5 rounded-full", live ? "bg-emerald-400 animate-pulse" : "bg-muted")} />
            <span className={live ? "text-emerald-300" : "text-muted"}>{live ? "Live" : "Reconnecting..."}</span>
          </div>
          <nav className="mt-7 grid gap-1">
            {modules.map(m => { const I=m.icon; const isActive = active === m.name; return (
              <button
                key={m.name}
                onClick={()=>{setActive(m.name); setMobileNavOpen(false);}}
                className={cn(
                  "flex min-h-11 items-center gap-3 rounded-md border px-3 py-2 text-left text-sm font-semibold transition",
                  isActive ? "border-gold/30 bg-gold/15 text-gold shadow-[0_0_0_1px_rgba(201,168,76,0.08)_inset]" : "border-transparent text-muted hover:border-edge hover:bg-panel hover:text-heading"
                )}
              >
                <I size={17}/> {m.name}
              </button>
            );})}
          </nav>
        </aside>

        <section className="p-4 sm:p-5 md:p-8">
          <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
            <div>
              <h2 className="font-heading text-xl sm:text-2xl font-semibold text-heading">{activeModule.name}</h2>
              <p className="text-sm text-muted">{activeModule.detail}</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button onClick={()=>setShowNewClient(true)}><Plus size={16}/> New Client</Button>
              <Button variant="outline" onClick={()=>{setShowNewQuote(true);setActive("Quotes & Invoices");}}><FileText size={16}/> New Quote</Button>
              <Button variant="outline" onClick={exportCSV}><Download size={16}/> Export</Button>
              <Button variant="ghost" onClick={async()=>{ await createClient().auth.signOut(); window.location.href="/admin/login"; }}><LogOut size={16}/></Button>
            </div>
          </div>

          {loading ? <div className="mb-4 flex items-center gap-3 text-sm text-muted"><Loader2 className="animate-spin" size={18}/> Loading...</div> : null}

          {/* MODALS */}
          {showNewClient && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={()=>setShowNewClient(false)}>
              <motion.div
                initial={{ opacity: 0, y: 12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className="glass-panel w-full max-w-lg mx-4 rounded-lg p-6 shadow-soft"
                onClick={e=>e.stopPropagation()}
              >
                <h3 className="text-xl font-heading font-bold text-heading mb-4">New Client Intake</h3>
                <form className="grid gap-3" onSubmit={handleNewClient}>
                  <input name="name" placeholder="Full Name *" className={inputClass} required/>
                  <div className="grid grid-cols-2 gap-3"><input name="email" type="email" placeholder="Email" className={inputClass}/><input name="phone" placeholder="Phone" className={inputClass}/></div>
                  <div className="grid grid-cols-2 gap-3"><input name="company" placeholder="Company" className={inputClass}/><select name="businessType" className={inputClass}><option value="">Business Type</option>{bizTypes.map(t=><option key={t} value={t}>{t}</option>)}</select></div>
                  <select name="source" className={inputClass}>{sources.map(s=><option key={s} value={s}>{s}</option>)}</select>
                  <textarea name="notes" placeholder="Notes" className={cn(inputClass,"h-20")}/>
                  <Button type="submit">Add Client</Button>
                </form>
              </motion.div>
            </div>
          )}
          {showNewQuote && data && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={()=>setShowNewQuote(false)}>
              <motion.div
                initial={{ opacity: 0, y: 12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className="glass-panel w-full max-w-lg mx-4 rounded-lg p-6 shadow-soft"
                onClick={e=>e.stopPropagation()}
              >
                <h3 className="text-xl font-heading font-bold text-heading mb-4">Generate Quote & Invoice</h3>
                <form className="grid gap-3" onSubmit={handleNewQuote}>
                  <select name="clientId" className={inputClass} required><option value="">Select Client</option>{data.clients?.map((c:any)=><option key={c.id} value={c.id}>{c.name}{c.company?` (${c.company})`:""}</option>)}</select>
                  <input name="services" placeholder="Services: Trade License, Visa Stamping..." className={inputClass} required/>
                  <div className="grid grid-cols-2 gap-3"><input name="govFees" type="number" step="0.01" placeholder="Govt Fees (AED)" className={inputClass}/><input name="proFees" type="number" step="0.01" placeholder="PRO Fees (AED)" className={inputClass}/></div>
                  <Button type="submit">Generate</Button>
                </form>
              </motion.div>
            </div>
          )}

          <AnimatePresence mode="wait">
            <motion.div key={active} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}>

              {/* DASHBOARD */}
              {active==="Dashboard" && (
                <div className="space-y-6">
                  {alerts.length > 0 && (
                    <div className="glass-panel rounded-lg p-5 shadow-soft transition hover:border-gold/25">
                      <h3 className="flex items-center gap-2 font-heading font-semibold text-heading"><AlertTriangle size={18} className="text-gold"/> Expiry Alerts</h3>
                      <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        {alerts.slice(0, 6).map((d) => (
                          <div key={d.id} className="flex items-center justify-between rounded-md border border-edge bg-panel px-3 py-2 text-sm">
                            <div>
                              <p className="font-medium text-heading">{d.name}</p>
                              <p className="text-xs text-muted">{d.client.name} &middot; {d.type}</p>
                            </div>
                            <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", d.daysLeft <= 7 ? "bg-red-500/15 text-red-300" : d.daysLeft <= 30 ? "bg-amber-500/15 text-amber-300" : "bg-gold/15 text-gold")}>
                              {d.daysLeft < 0 ? "Expired" : `${d.daysLeft}d left`}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="grid gap-4 md:grid-cols-3">
                    {([["Today", revenue.today], ["This Month", revenue.month], ["Year to Date", revenue.ytd]] as [string, number][]).map(([label, value], i) => (
                      <motion.div
                        key={label}
                        className="glass-panel rounded-lg p-5 shadow-soft transition hover:border-gold/25"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                      >
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label} Revenue</p>
                          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-gold/15 text-gold"><Wallet size={16}/></span>
                        </div>
                        <p className="mt-3 font-heading text-3xl font-bold text-heading">{currency(value)}</p>
                      </motion.div>
                    ))}
                  </div>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="glass-panel rounded-lg p-5 shadow-soft transition hover:border-gold/25">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted">Active Clients</p>
                        <span className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-400/15 text-blue-300"><UsersRound size={16}/></span>
                      </div>
                      <p className="mt-3 font-heading text-3xl font-bold text-heading">{initialStats.clients}</p>
                      <p className="mt-1 text-xs text-gold">{initialStats.leads} leads in pipeline</p>
                    </div>
                    <div className="glass-panel rounded-lg p-5 shadow-soft transition hover:border-gold/25">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted">Pending Tasks</p>
                        <span className="flex h-8 w-8 items-center justify-center rounded-md bg-amber-400/15 text-amber-300"><ClipboardList size={16}/></span>
                      </div>
                      <p className="mt-3 font-heading text-3xl font-bold text-heading">{pending.total}</p>
                      <p className="mt-1 text-xs text-muted">{pending.openServices} open &middot; {pending.pendingInvoices} unpaid &middot; {pending.dueSoon} due soon</p>
                    </div>
                    <div className="glass-panel rounded-lg p-5 shadow-soft transition hover:border-gold/25">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted">Quote Requests</p>
                        <span className="flex h-8 w-8 items-center justify-center rounded-md bg-emerald-400/15 text-emerald-300"><FileText size={16}/></span>
                      </div>
                      <p className="mt-3 font-heading text-3xl font-bold text-heading">{initialStats.quoteReqs}</p>
                      <p className="mt-1 text-xs text-muted">{initialStats.contacts} contact messages</p>
                    </div>
                  </div>

                  <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
                    <div className="glass-panel rounded-lg p-5 shadow-soft transition hover:border-gold/25 sm:p-6">
                      <h3 className="font-heading font-semibold text-heading text-lg">Revenue Trend</h3>
                      <div className="mt-2 -ml-2">
                        <RevenueTrendChart data={revenueSeries} />
                      </div>
                    </div>
                    <div className="glass-panel rounded-lg p-5 shadow-soft transition hover:border-gold/25 sm:p-6">
                      <h3 className="font-heading font-semibold text-heading text-lg">Pipeline by Status</h3>
                      {pipelineBreakdown.length > 0 ? <StatusBreakdownChart data={pipelineBreakdown} /> : <p className="mt-8 text-center text-sm text-muted">No service requests yet.</p>}
                    </div>
                  </div>

                  <div className="glass-panel rounded-lg p-5 shadow-soft transition hover:border-gold/25 sm:p-6">
                    <h3 className="font-heading font-semibold text-heading text-lg">Client Acquisition Funnel</h3>
                    <AcquisitionFunnelChart data={funnel} />
                  </div>

                  <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
                    <div className="glass-panel rounded-lg p-5 shadow-soft transition hover:border-gold/25 sm:p-6">
                      <h3 className="font-heading font-semibold text-heading text-lg">Pipeline Overview</h3>
                      <div className="mt-4 grid gap-3 sm:grid-cols-2 md:grid-cols-4">{pipelineColumns.map(col=>(
                        <div key={col.key} className="rounded-md border border-edge bg-panel p-3 transition hover:border-gold/25">
                          <p className="flex items-center gap-2 text-sm font-semibold text-heading"><span className={cn("h-2 w-2 rounded-full", col.dot)} />{col.label}</p>
                          <p className="text-xs text-muted mt-1">{data?.services?.filter((x:ServiceRow)=>x.status===col.key).length||0} items</p>
                        </div>
                      ))}</div>
                    </div>
                    <aside className="space-y-4">
                      <div className="glass-panel rounded-lg p-5 shadow-soft transition hover:border-gold/25">
                        <h3 className="font-heading font-semibold text-heading">Quick Links</h3>
                        <div className="mt-3 grid grid-cols-2 gap-1.5">{links.map((l,i)=><a key={l} href={urls[i]} target="_blank" rel="noreferrer" className="rounded border border-edge px-2 py-1.5 text-xs font-medium text-body hover:border-gold hover:text-gold">{l}</a>)}</div>
                      </div>
                      <div className="glass-panel rounded-lg p-5 shadow-soft transition hover:border-gold/25">
                        <h3 className="font-heading font-semibold text-heading">Quick Actions</h3>
                        <div className="mt-3 grid gap-2">
                          <Button onClick={()=>{setShowNewClient(true)}}>New Client</Button>
                          <Button variant="outline" onClick={()=>{setShowNewQuote(true);setActive("Quotes & Invoices")}}>Generate Quote</Button>
                          <Button variant="outline" onClick={exportCSV}>Export CSV</Button>
                        </div>
                      </div>
                    </aside>
                  </div>
                </div>
              )}

              {/* TABLES */}
              {active==="Clients" && data && <div className="glass-panel rounded-lg shadow-soft"><div className="overflow-x-auto"><table className="w-full min-w-[560px] text-sm"><thead className="bg-panel text-heading"><tr><th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted">Name</th><th className="px-4 py-3 hidden sm:table-cell text-left text-xs font-semibold uppercase tracking-wide text-muted">Email</th><th className="px-4 py-3 hidden sm:table-cell text-left text-xs font-semibold uppercase tracking-wide text-muted">Phone</th><th className="px-4 py-3 hidden md:table-cell text-left text-xs font-semibold uppercase tracking-wide text-muted">Company</th><th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted">Type</th><th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted">Source</th></tr></thead><tbody className="divide-y divide-edge">{data.clients?.map((c:Client)=><tr key={c.id} className="transition hover:bg-panel/60"><td className="px-4 py-3 font-medium text-heading"><Link href={`/admin/clients/${c.id}`} className="hover:text-gold hover:underline">{c.name}</Link></td><td className="px-4 py-3 hidden sm:table-cell text-muted">{c.email||"-"}</td><td className="px-4 py-3 hidden sm:table-cell text-muted">{c.phone||"-"}</td><td className="px-4 py-3 hidden md:table-cell text-muted">{c.company||"-"}</td><td className="px-4 py-3 text-xs text-body">{c.businessType||"-"}</td><td className="px-4 py-3"><span className="bg-gold/10 text-gold text-xs px-2 py-0.5 rounded-full">{c.source||"-"}</span></td></tr>)}</tbody></table></div></div>}

              {active==="Service Pipeline" && data && (
                <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
                  {pipelineColumns.map((col) => {
                    const items = ((data.services ?? []) as ServiceRow[]).filter((s) => s.status === col.key);
                    return (
                      <div
                        key={col.key}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => { e.preventDefault(); const id = e.dataTransfer.getData("text/plain"); if (id) updateServiceStatus(id, col.key); }}
                        className="glass-panel min-h-[220px] rounded-lg p-3 shadow-soft"
                      >
                        <div className="flex items-center justify-between border-b border-edge px-1 pb-2.5">
                          <h3 className="flex items-center gap-2 font-heading text-sm font-semibold text-heading">
                            <span className={cn("h-2 w-2 rounded-full", col.dot)} /> {col.label}
                          </h3>
                          <span className="rounded-full bg-panel px-2 py-0.5 text-xs font-medium text-muted">{items.length}</span>
                        </div>
                        <div className="mt-2 space-y-2">
                          {items.map((s) => (
                            <div
                              key={s.id}
                              draggable
                              onDragStart={(e) => e.dataTransfer.setData("text/plain", s.id)}
                              className="cursor-grab rounded-md border border-edge bg-panel p-3 text-sm transition hover:border-gold/30 active:cursor-grabbing"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <p className="font-semibold text-heading">{s.client.name}</p>
                                <GripVertical size={14} className="mt-0.5 hidden shrink-0 text-muted sm:block" />
                              </div>
                              <p className="mt-1 text-xs text-body">{s.serviceType}</p>
                              <div className="mt-2 flex items-center justify-between text-xs text-muted">
                                <span>{s.assignedTo || "Unassigned"}</span>
                                {s.deadline ? <span>{new Date(s.deadline).toLocaleDateString()}</span> : null}
                              </div>
                              <select
                                value={s.status}
                                onChange={(e) => updateServiceStatus(s.id, e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                                aria-label={`Move ${s.client.name} to stage`}
                                className="mt-2.5 min-h-9 w-full rounded-md border border-edge bg-base px-2 text-xs font-medium text-heading focus:border-gold focus:outline-none"
                              >
                                {pipelineColumns.map((c) => <option key={c.key} value={c.key}>{c.key === s.status ? `${c.label} (current)` : `Move to ${c.label}`}</option>)}
                              </select>
                            </div>
                          ))}
                          {items.length === 0 && <p className="px-1 py-8 text-center text-xs text-muted">Drop here</p>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {active==="Leads" && data && <div className="glass-panel rounded-lg shadow-soft"><div className="overflow-x-auto"><table className="w-full min-w-[560px] text-sm"><thead className="bg-panel text-heading"><tr><th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted">Name</th><th className="px-4 py-3 hidden sm:table-cell text-left text-xs font-semibold uppercase tracking-wide text-muted">Email</th><th className="px-4 py-3 hidden sm:table-cell text-left text-xs font-semibold uppercase tracking-wide text-muted">Phone</th><th className="px-4 py-3 hidden md:table-cell text-left text-xs font-semibold uppercase tracking-wide text-muted">Interest</th><th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted">Status</th><th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted">Source</th></tr></thead><tbody className="divide-y divide-edge">{data.leads?.map((l:Lead)=><tr key={l.id} className="transition hover:bg-panel/60"><td className="px-4 py-3 font-medium text-heading">{l.name}</td><td className="px-4 py-3 hidden sm:table-cell text-muted">{l.email||"-"}</td><td className="px-4 py-3 hidden sm:table-cell text-muted">{l.phone||"-"}</td><td className="px-4 py-3 hidden md:table-cell text-muted">{l.serviceInterest||"-"}</td><td className="px-4 py-3 text-body">{l.status}</td><td className="px-4 py-3"><span className="bg-gold/10 text-gold text-xs px-2 py-0.5 rounded-full">{l.source}</span></td></tr>)}</tbody></table></div></div>}

              {active==="Quotes & Invoices" && data && <div className="space-y-6">
                <div className="glass-panel rounded-lg shadow-soft"><h3 className="px-4 py-3 font-heading font-semibold text-heading border-b border-edge">Quote Requests (Website)</h3><div className="overflow-x-auto"><table className="w-full min-w-[560px] text-sm"><thead className="bg-panel"><tr><th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted">Name</th><th className="px-4 py-3 hidden sm:table-cell text-left text-xs font-semibold uppercase tracking-wide text-muted">Email</th><th className="px-4 py-3 hidden sm:table-cell text-left text-xs font-semibold uppercase tracking-wide text-muted">Company</th><th className="px-4 py-3 hidden md:table-cell text-left text-xs font-semibold uppercase tracking-wide text-muted">Service</th><th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted">Date</th></tr></thead><tbody className="divide-y divide-edge">{data.quoteReqs?.map((q:any)=><tr key={q.id} className="transition hover:bg-panel/60"><td className="px-4 py-3 font-medium text-heading">{q.name}</td><td className="px-4 py-3 hidden sm:table-cell text-muted">{q.email}</td><td className="px-4 py-3 hidden sm:table-cell text-muted">{q.company||"-"}</td><td className="px-4 py-3 hidden md:table-cell text-muted">{q.serviceInterest||"-"}</td><td className="px-4 py-3 text-muted">{new Date(q.createdAt).toLocaleDateString()}</td></tr>)}</tbody></table></div></div>
                <div className="glass-panel rounded-lg shadow-soft"><h3 className="px-4 py-3 font-heading font-semibold text-heading border-b border-edge">Generated Quotes</h3><div className="overflow-x-auto"><table className="w-full min-w-[560px] text-sm"><thead className="bg-panel"><tr><th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted">Client</th><th className="px-4 py-3 hidden sm:table-cell text-left text-xs font-semibold uppercase tracking-wide text-muted">Services</th><th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted">Govt</th><th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted">PRO</th><th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted">Total</th><th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted">PDF</th></tr></thead><tbody className="divide-y divide-edge">{data.quotesList?.map((q:any)=><tr key={q.id} className="transition hover:bg-panel/60"><td className="px-4 py-3 font-medium text-heading">{q.client.name}</td><td className="px-4 py-3 hidden sm:table-cell text-muted text-xs">{q.services}</td><td className="px-4 py-3 text-body">AED {q.govFees}</td><td className="px-4 py-3 text-body">AED {q.proFees}</td><td className="px-4 py-3 font-bold text-heading">AED {q.total}</td><td className="px-4 py-3"><a href={`/api/admin/quote/pdf?id=${q.id}`} target="_blank" className="text-gold font-semibold text-xs hover:underline">Download PDF</a></td></tr>)}</tbody></table></div></div>
                <div className="glass-panel rounded-lg shadow-soft"><h3 className="px-4 py-3 font-heading font-semibold text-heading border-b border-edge">Invoices</h3><div className="overflow-x-auto"><table className="w-full min-w-[520px] text-sm"><thead className="bg-panel"><tr><th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted">Invoice #</th><th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted">Client</th><th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted">Amount</th><th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted">Status</th><th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted">PDF</th></tr></thead><tbody className="divide-y divide-edge">{data.invoices?.map((inv:any)=><tr key={inv.id} className="transition hover:bg-panel/60"><td className="px-4 py-3 font-medium text-heading">INV-{inv.id.slice(0,8)}</td><td className="px-4 py-3 text-body">{inv.quote.client.name}</td><td className="px-4 py-3 font-bold text-heading">AED {inv.amount}</td><td className="px-4 py-3"><span className={inv.status==="paid"?"bg-emerald-500/15 text-emerald-300 text-xs px-2 py-0.5 rounded-full":"bg-amber-500/15 text-amber-300 text-xs px-2 py-0.5 rounded-full"}>{inv.status}</span></td><td className="px-4 py-3"><a href={`/api/admin/invoice/pdf?id=${inv.id}`} target="_blank" className="text-gold font-semibold text-xs hover:underline">Download PDF</a></td></tr>)}</tbody></table></div></div>
              </div>}

              {active==="Follow-ups" && data && <div className="glass-panel rounded-lg shadow-soft"><div className="overflow-x-auto"><table className="w-full min-w-[420px] text-sm"><thead className="bg-panel"><tr><th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted">Client</th><th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted">Step</th><th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted">Due</th></tr></thead><tbody className="divide-y divide-edge">{data.followUps?.map((f:FollowUp)=><tr key={f.id} className="transition hover:bg-panel/60"><td className="px-4 py-3 font-medium text-heading">{f.client.name}</td><td className="px-4 py-3 text-body">{f.step}</td><td className="px-4 py-3 text-muted">{new Date(f.dueDate).toLocaleDateString()}</td></tr>)}</tbody></table></div></div>}

              {placeholders.includes(active) && <div className="glass-panel rounded-lg p-8 text-center shadow-soft"><p className="text-muted text-lg">Coming Soon</p><p className="text-muted/70 text-sm mt-2">Database schema ready. Next phase build.</p></div>}

              {active==="Reports" && <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="grid flex-1 gap-5 md:grid-cols-3">{[["Total Clients",initialStats.clients],["Total Leads",initialStats.leads],["Contacts",initialStats.contacts],["Quote Requests",initialStats.quoteReqs],["Active Services",initialStats.services]].map(([l,v])=><div key={l} className="glass-panel rounded-lg p-5 shadow-soft transition hover:border-gold/25"><p className="text-sm text-muted">{l}</p><p className="text-3xl font-heading font-bold text-heading">{v as number}</p></div>)}</div>
                  <a href="/api/admin/reports/pdf" target="_blank" className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-md bg-gold px-5 py-3 text-sm font-semibold text-navy shadow-gold transition hover:bg-[#b7963f]"><Download size={16}/> Monthly Report (PDF)</a>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                  <div className="glass-panel rounded-lg p-5 shadow-soft transition hover:border-gold/25 sm:p-6">
                    <h3 className="font-heading font-semibold text-heading text-lg">Revenue Breakdown</h3>
                    <div className="mt-2 -ml-2"><RevenueTrendChart data={revenueSeries} /></div>
                  </div>
                  <div className="glass-panel rounded-lg p-5 shadow-soft transition hover:border-gold/25 sm:p-6">
                    <h3 className="font-heading font-semibold text-heading text-lg">Leads by Source</h3>
                    {sourceBreakdown.length > 0 ? <LeadsBySourceChart data={sourceBreakdown} /> : <p className="mt-8 text-center text-sm text-muted">No leads yet.</p>}
                  </div>
                </div>

                <div className="glass-panel rounded-lg p-5 shadow-soft transition hover:border-gold/25 sm:p-6">
                  <h3 className="font-heading font-semibold text-heading text-lg">Staff Productivity</h3>
                  {productivity.length > 0 ? <StaffProductivityChart data={productivity} /> : <p className="mt-8 text-center text-sm text-muted">No assignments yet.</p>}
                </div>
              </div>}
            </motion.div>
          </AnimatePresence>
        </section>
      </div>
      <AdminChatbot clients={data?.clients ?? []} />
    </main>
  );
}
