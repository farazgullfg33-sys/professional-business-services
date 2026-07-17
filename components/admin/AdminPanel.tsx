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
type Lead = { id: string; name: string; email?: string; phone?: string; serviceInterest?: string; message?: string; notes?: string; status: string; source: string; createdAt?: string };
type ServiceRow = { id: string; clientId: string; serviceType: string; status: string; priority: string; assignedTo?: string; deadline?: string; client?: { name: string } };
type FollowUp = { id: string; step: string; dueDate: string; client: { name: string } };
type InvoiceRow = { id: string; amount: number; status: string; paidAt?: string; createdAt: string; quote: { client: { name: string } } };
type DocumentRow = { id: string; name: string; type: string; fileUrl?: string; expiryDate?: string; client: { name: string } };
type VisaRow = { id: string; type: string; status: string; applicationDate?: string; expiryDate?: string; remarks?: string; client: { name: string } };
type LicenseRow = { id: string; licenseNumber?: string; type?: string; issueDate?: string; expiryDate?: string; status: string; client: { name: string } };
type FormationRow = { id: string; clientId: string; step: number; name: string; completed: boolean; notes?: string };
type ComplianceRow = { id: string; type: string; dueDate: string; status: string; notes?: string; client: { name: string } };
type StaffRow = { id: string; name: string; email: string; role: string; active: boolean };
type AttestationRow = { id: string; clientId: string; documentName: string; documentType?: string; checkpoint: string; status: string; notes?: string; createdAt: string; client: { name: string } };
type CommLogRow = { id: string; type: string; staffName: string; summary: string; outcome?: string; createdAt: string; client: { name: string } };

const pipelineColumns = [
  { key: "new", label: "New", dot: "bg-blue-400" },
  { key: "in_progress", label: "In Progress", dot: "bg-gold" },
  { key: "review", label: "Review", dot: "bg-amber-400" },
  { key: "completed", label: "Completed", dot: "bg-emerald-400" }
];

const modules = [
  { name: "Dashboard", icon: LayoutDashboard, detail: "Revenue, active clients, pending tasks, quick actions" },
  { name: "Clients", icon: UsersRound, detail: "Search, filters, CRUD-ready client table, source, linked services count" },
  { name: "Leads", icon: Sparkles, detail: "Lead pipeline, source tracking, status management" },
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
const placeholders: string[] = []; // all modules built

const ATTESTATION_CHECKPOINTS = ["original_received","notary","mofa","embassy","delivered"] as const;
const CHECKPOINT_LABEL: Record<string, string> = {
  original_received: "Original Received",
  notary: "Notary",
  mofa: "MOFA",
  embassy: "Embassy",
  delivered: "Delivered",
};

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
  const [showAddVisa, setShowAddVisa] = useState(false);
  const [showAddLicense, setShowAddLicense] = useState(false);
  const [showAddCompliance, setShowAddCompliance] = useState(false);
  const [showAddDocument, setShowAddDocument] = useState(false);
  const [showAddStaff, setShowAddStaff] = useState(false);
  const [formationClientId, setFormationClientId] = useState("");
  const [moduleSearch, setModuleSearch] = useState<Record<string, string>>({});
  const [showAddAttestation, setShowAddAttestation] = useState(false);
  const [showAddCommLog, setShowAddCommLog] = useState(false);
  const [commLogTypeFilter, setCommLogTypeFilter] = useState("all");
  const [leadSourceFilter, setLeadSourceFilter] = useState("all");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [leadNoteText, setLeadNoteText] = useState("");
  const [leadPrefill, setLeadPrefill] = useState<{ name?: string; email?: string; phone?: string } | null>(null);
  const [convertingLeadId, setConvertingLeadId] = useState<string | null>(null);

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
    leads: data?.counts?.leads ?? initialStats.leads,
    quoteReqs: data?.counts?.quoteReqs ?? initialStats.quoteReqs,
    clients: data?.counts?.clients ?? initialStats.clients,
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
    if (r.ok) {
      setShowNewClient(false);
      setLeadPrefill(null);
      if (convertingLeadId) {
        await fetch(`/api/admin/leads/${convertingLeadId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "converted" }) });
        setData((prev: any) => prev ? { ...prev, leads: prev.leads?.map((l: Lead) => l.id === convertingLeadId ? { ...l, status: "converted" } : l) } : prev);
        setConvertingLeadId(null);
      }
      setActive("Clients");
      fetchData();
    }
  };

  const handleNewQuote = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const r = await fetch("/api/admin/quote/create", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(Object.fromEntries(f)) });
    if (r.ok) { setShowNewQuote(false); fetchData(); alert("Quote created! Check Quotes & Invoices tab."); }
  };

  const postForm = async (url: string, e: React.FormEvent<HTMLFormElement>, onDone: () => void) => {
    e.preventDefault();
    const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(Object.fromEntries(new FormData(e.currentTarget))) });
    if (r.ok) { onDone(); fetchData(); }
    else { const d = await r.json().catch(() => ({})); alert(`Error: ${d.error || r.status}`); }
  };

  const toggleFormationStep = async (id: string, completed: boolean) => {
    setData((prev: any) => {
      if (!prev) return prev;
      const updated: FormationRow[] = prev.formation?.map((f: FormationRow) => f.id === id ? { ...f, completed } : f) ?? [];
      // If all 14 steps now complete, find and auto-complete the formation service
      const clientId = prev.formation?.find((f: FormationRow) => f.id === id)?.clientId;
      if (clientId && completed) {
        const clientSteps: FormationRow[] = updated.filter((f: FormationRow) => f.clientId === clientId);
        if (clientSteps.length === 14 && clientSteps.every((f: FormationRow) => f.completed)) {
          const svc = (prev.services ?? []).find((s: ServiceRow) => s.clientId === clientId && s.serviceType === "company_formation" && s.status !== "completed");
          if (svc) {
            fetch(`/api/admin/services/${svc.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "completed" }) });
            return { ...prev, formation: updated, services: prev.services.map((s: ServiceRow) => s.id === svc.id ? { ...s, status: "completed" } : s) };
          }
        }
      }
      return { ...prev, formation: updated };
    });
    await fetch(`/api/admin/formation/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ completed }) });
  };

  const startFormation = async (clientId: string) => {
    const r = await fetch("/api/admin/formation", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ clientId }) });
    if (!r.ok) { const d = await r.json(); alert(d.error || "Failed"); return; }
    // Create a matching ServiceRequest so it appears on the pipeline board
    await fetch("/api/admin/services", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ clientId, serviceType: "company_formation", status: "in_progress", priority: "normal" }) });
    fetchData();
  };

  const toggleStaffActive = async (id: string, active: boolean) => {
    setData((prev: any) => prev ? { ...prev, staff: prev.staff?.map((s: StaffRow) => s.id === id ? { ...s, active } : s) } : prev);
    await fetch(`/api/admin/staff/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ active }) });
  };

  const deleteRecord = async (endpoint: string) => {
    if (!confirm("Delete this record? This cannot be undone.")) return;
    const r = await fetch(endpoint, { method: "DELETE" });
    if (r.ok) fetchData();
  };

  const advanceCheckpoint = async (row: AttestationRow) => {
    const idx = ATTESTATION_CHECKPOINTS.indexOf(row.checkpoint as typeof ATTESTATION_CHECKPOINTS[number]);
    if (idx === -1 || idx >= ATTESTATION_CHECKPOINTS.length - 1) return;
    const next = ATTESTATION_CHECKPOINTS[idx + 1];
    const isLast = idx + 1 === ATTESTATION_CHECKPOINTS.length - 1;
    setData((prev: any) => prev ? {
      ...prev,
      attestations: prev.attestations?.map((a: AttestationRow) =>
        a.id === row.id ? { ...a, checkpoint: next, status: isLast ? "completed" : "in_progress" } : a
      )
    } : prev);
    await fetch(`/api/admin/attestation/${row.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ checkpoint: next, status: isLast ? "completed" : "in_progress" }),
    });
  };

  const saveLeadNote = async () => {
    if (!selectedLead) return;
    await fetch(`/api/admin/leads/${selectedLead.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ notes: leadNoteText }) });
    setData((prev: any) => prev ? { ...prev, leads: prev.leads?.map((l: Lead) => l.id === selectedLead.id ? { ...l, notes: leadNoteText } : l) } : prev);
    setSelectedLead(sl => sl ? { ...sl, notes: leadNoteText } : sl);
  };

  const searchFilter = (items: any[], key: string, fields: string[]) => {
    const q = (moduleSearch[key] ?? "").toLowerCase().trim();
    if (!q) return items;
    return items.filter(item => fields.some(f => {
      const val = f.split(".").reduce((o: any, k: string) => o?.[k], item);
      return String(val ?? "").toLowerCase().includes(q);
    }));
  };

  const daysLeft = (date?: string) => date ? Math.ceil((new Date(date).getTime() - Date.now()) / 86400000) : null;

  const expiryBadge = (days: number | null) => {
    if (days === null) return null;
    const cls = days < 0 ? "bg-red-500/15 text-red-300" : days <= 30 ? "bg-amber-500/15 text-amber-300" : days <= 60 ? "bg-gold/15 text-gold" : "bg-emerald-500/15 text-emerald-300";
    return <span className={cn("text-xs px-2 py-0.5 rounded-full", cls)}>{days < 0 ? "Expired" : `${days}d`}</span>;
  };

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      applied: "bg-blue-500/15 text-blue-300", approved: "bg-emerald-500/15 text-emerald-300",
      renewed: "bg-blue-400/15 text-blue-200", expired: "bg-red-500/15 text-red-300",
      active: "bg-emerald-500/15 text-emerald-300", inactive: "bg-red-500/15 text-red-300",
      pending: "bg-amber-500/15 text-amber-300", completed: "bg-emerald-500/15 text-emerald-300",
      new: "bg-blue-500/15 text-blue-300", in_progress: "bg-gold/15 text-gold",
    };
    return <span className={cn("text-xs px-2 py-0.5 rounded-full capitalize", map[status] ?? "bg-panel text-muted")}>{status}</span>;
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
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => { setShowNewClient(false); setLeadPrefill(null); setConvertingLeadId(null); }}>
              <motion.div
                initial={{ opacity: 0, y: 12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className="glass-panel w-full max-w-lg mx-4 rounded-lg p-6 shadow-soft"
                onClick={e=>e.stopPropagation()}
              >
                <h3 className="text-xl font-heading font-bold text-heading mb-4">{convertingLeadId ? "Convert Lead to Client" : "New Client Intake"}</h3>
                <form key={leadPrefill?.name ?? "new"} className="grid gap-3" onSubmit={handleNewClient}>
                  <input name="name" placeholder="Full Name *" defaultValue={leadPrefill?.name ?? ""} className={inputClass} required/>
                  <div className="grid grid-cols-2 gap-3">
                    <input name="email" type="email" placeholder="Email" defaultValue={leadPrefill?.email ?? ""} className={inputClass}/>
                    <input name="phone" placeholder="Phone" defaultValue={leadPrefill?.phone ?? ""} className={inputClass}/>
                  </div>
                  <div className="grid grid-cols-2 gap-3"><input name="company" placeholder="Company" className={inputClass}/><select name="businessType" className={inputClass}><option value="">Business Type</option>{bizTypes.map(t=><option key={t} value={t}>{t}</option>)}</select></div>
                  <select name="source" className={inputClass}>{sources.map(s=><option key={s} value={s}>{s}</option>)}</select>
                  <textarea name="notes" placeholder="Notes" className={cn(inputClass,"h-20")}/>
                  <Button type="submit">{convertingLeadId ? "Convert & Create Client" : "Add Client"}</Button>
                </form>
              </motion.div>
            </div>
          )}
          {/* LEAD DETAIL SLIDEOVER */}
          <AnimatePresence>
            {selectedLead && (
              <>
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
                  onClick={() => setSelectedLead(null)}
                />
                <motion.div
                  initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
                  transition={{ type: "tween", duration: 0.22 }}
                  className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-[460px] glass-panel border-l border-edge shadow-soft flex flex-col"
                  onClick={e => e.stopPropagation()}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between border-b border-edge px-6 py-4">
                    <div>
                      <h3 className="font-heading text-lg font-bold text-heading">{selectedLead.name}</h3>
                      <span className={cn("mt-1 inline-block text-xs px-2 py-0.5 rounded-full capitalize",
                        selectedLead.status === "new" ? "bg-blue-500/15 text-blue-300" :
                        selectedLead.status === "contacted" ? "bg-gold/15 text-gold" :
                        selectedLead.status === "qualified" ? "bg-emerald-500/15 text-emerald-300" :
                        selectedLead.status === "converted" ? "bg-emerald-600/20 text-emerald-200" :
                        "bg-red-500/15 text-red-300"
                      )}>{selectedLead.status}</span>
                    </div>
                    <button onClick={() => setSelectedLead(null)} className="ml-4 flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-edge text-muted hover:text-heading"><X size={16} /></button>
                  </div>

                  {/* Scrollable body */}
                  <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
                    {/* Contact info */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-muted uppercase tracking-wide mb-1">Email</p>
                        <p className="text-sm text-heading">{selectedLead.email || "—"}</p>
                        {selectedLead.email && (
                          <button onClick={() => navigator.clipboard.writeText(selectedLead.email!)} className="mt-1 text-xs text-gold hover:underline">Copy Email</button>
                        )}
                      </div>
                      <div>
                        <p className="text-xs text-muted uppercase tracking-wide mb-1">Phone</p>
                        <p className="text-sm text-heading">{selectedLead.phone || "—"}</p>
                        {selectedLead.phone && (
                          <button onClick={() => navigator.clipboard.writeText(selectedLead.phone!)} className="mt-1 text-xs text-gold hover:underline">Copy Phone</button>
                        )}
                      </div>
                      <div>
                        <p className="text-xs text-muted uppercase tracking-wide mb-1">Source</p>
                        <span className="inline-block bg-gold/10 text-gold text-xs px-2 py-0.5 rounded-full capitalize">{selectedLead.source}</span>
                      </div>
                      <div>
                        <p className="text-xs text-muted uppercase tracking-wide mb-1">Created</p>
                        <p className="text-sm text-heading">{selectedLead.createdAt ? new Date(selectedLead.createdAt).toLocaleDateString("en-AE", { day: "numeric", month: "short", year: "numeric" }) : "—"}</p>
                      </div>
                    </div>

                    {/* Service interest */}
                    {selectedLead.serviceInterest && (
                      <div>
                        <p className="text-xs text-muted uppercase tracking-wide mb-1">Service Interest</p>
                        <p className="text-sm text-heading">{selectedLead.serviceInterest}</p>
                      </div>
                    )}

                    {/* Message */}
                    {selectedLead.message && (
                      <div>
                        <p className="text-xs text-muted uppercase tracking-wide mb-1">Message</p>
                        <p className="text-sm text-body leading-relaxed whitespace-pre-wrap">{selectedLead.message}</p>
                      </div>
                    )}

                    {/* Notes */}
                    <div>
                      <p className="text-xs text-muted uppercase tracking-wide mb-2">Notes</p>
                      <textarea
                        value={leadNoteText}
                        onChange={e => setLeadNoteText(e.target.value)}
                        placeholder="Add notes about this lead..."
                        className={cn(inputClass, "w-full h-24 resize-none")}
                      />
                      <button
                        onClick={saveLeadNote}
                        className="mt-2 rounded-md border border-gold/40 bg-gold/10 px-3 py-1.5 text-xs font-medium text-gold hover:bg-gold/20 transition"
                      >Save Note</button>
                    </div>
                  </div>

                  {/* Footer — Convert to Client */}
                  <div className="border-t border-edge px-6 py-4">
                    <button
                      disabled={selectedLead.status === "converted"}
                      onClick={() => {
                        setLeadPrefill({ name: selectedLead.name, email: selectedLead.email, phone: selectedLead.phone });
                        setConvertingLeadId(selectedLead.id);
                        setSelectedLead(null);
                        setShowNewClient(true);
                      }}
                      className="w-full rounded-md bg-navy border border-gold/40 px-4 py-2.5 text-sm font-semibold text-gold hover:bg-navy/80 transition disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {selectedLead.status === "converted" ? "Already Converted" : "Convert to Client →"}
                    </button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>

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

          {/* ADD VISA MODAL */}
          {showAddVisa && data && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowAddVisa(false)}>
              <motion.div initial={{ opacity: 0, y: 12, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} className="glass-panel w-full max-w-lg mx-4 rounded-lg p-6 shadow-soft" onClick={e => e.stopPropagation()}>
                <h3 className="text-xl font-heading font-bold text-heading mb-4">Add Visa Record</h3>
                <form className="grid gap-3" onSubmit={e => postForm("/api/admin/visa", e, () => setShowAddVisa(false))}>
                  <select name="clientId" className={inputClass} required><option value="">Select Client *</option>{data.clients?.map((c: any) => <option key={c.id} value={c.id}>{c.name}{c.company ? ` (${c.company})` : ""}</option>)}</select>
                  <div className="grid grid-cols-2 gap-3">
                    <select name="type" className={inputClass} required><option value="">Visa Type *</option><option value="employment">Employment</option><option value="family">Family</option><option value="golden">Golden</option><option value="visit">Visit</option></select>
                    <select name="status" className={inputClass}><option value="applied">Applied</option><option value="approved">Approved</option><option value="renewed">Renewed</option><option value="expired">Expired</option></select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="text-xs text-muted">Application Date</label><input name="applicationDate" type="date" className={cn(inputClass, "mt-1 w-full")} /></div>
                    <div><label className="text-xs text-muted">Expiry Date</label><input name="expiryDate" type="date" className={cn(inputClass, "mt-1 w-full")} /></div>
                  </div>
                  <textarea name="remarks" placeholder="Remarks" className={cn(inputClass, "h-16")} />
                  <Button type="submit">Add Visa Record</Button>
                </form>
              </motion.div>
            </div>
          )}

          {/* ADD LICENSE MODAL */}
          {showAddLicense && data && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowAddLicense(false)}>
              <motion.div initial={{ opacity: 0, y: 12, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} className="glass-panel w-full max-w-lg mx-4 rounded-lg p-6 shadow-soft" onClick={e => e.stopPropagation()}>
                <h3 className="text-xl font-heading font-bold text-heading mb-4">Add Trade License</h3>
                <form className="grid gap-3" onSubmit={e => postForm("/api/admin/license", e, () => setShowAddLicense(false))}>
                  <select name="clientId" className={inputClass} required><option value="">Select Client *</option>{data.clients?.map((c: any) => <option key={c.id} value={c.id}>{c.name}{c.company ? ` (${c.company})` : ""}</option>)}</select>
                  <div className="grid grid-cols-2 gap-3">
                    <input name="licenseNumber" placeholder="License Number" className={inputClass} />
                    <select name="type" className={inputClass}><option value="">License Type</option><option value="Commercial">Commercial</option><option value="Professional">Professional</option><option value="Industrial">Industrial</option><option value="Tourism">Tourism</option><option value="Freezone">Freezone</option></select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="text-xs text-muted">Issue Date</label><input name="issueDate" type="date" className={cn(inputClass, "mt-1 w-full")} /></div>
                    <div><label className="text-xs text-muted">Expiry Date</label><input name="expiryDate" type="date" className={cn(inputClass, "mt-1 w-full")} /></div>
                  </div>
                  <select name="status" className={inputClass}><option value="active">Active</option><option value="renewal_due">Renewal Due</option><option value="expired">Expired</option><option value="cancelled">Cancelled</option></select>
                  <Button type="submit">Add License</Button>
                </form>
              </motion.div>
            </div>
          )}

          {/* ADD COMPLIANCE MODAL */}
          {showAddCompliance && data && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowAddCompliance(false)}>
              <motion.div initial={{ opacity: 0, y: 12, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} className="glass-panel w-full max-w-lg mx-4 rounded-lg p-6 shadow-soft" onClick={e => e.stopPropagation()}>
                <h3 className="text-xl font-heading font-bold text-heading mb-4">Add Compliance Deadline</h3>
                <form className="grid gap-3" onSubmit={e => postForm("/api/admin/compliance", e, () => setShowAddCompliance(false))}>
                  <select name="clientId" className={inputClass} required><option value="">Select Client *</option>{data.clients?.map((c: any) => <option key={c.id} value={c.id}>{c.name}{c.company ? ` (${c.company})` : ""}</option>)}</select>
                  <select name="type" className={inputClass} required><option value="">Compliance Type *</option><option value="ESR">ESR (Economic Substance)</option><option value="VAT">VAT Return</option><option value="AML">AML / CFT</option><option value="PDPL">PDPL (Data Protection)</option><option value="Audit">Annual Audit</option><option value="WPS">WPS Filing</option><option value="Other">Other</option></select>
                  <div><label className="text-xs text-muted">Due Date *</label><input name="dueDate" type="date" className={cn(inputClass, "mt-1 w-full")} required /></div>
                  <select name="status" className={inputClass}><option value="pending">Pending</option><option value="completed">Completed</option><option value="overdue">Overdue</option></select>
                  <textarea name="notes" placeholder="Notes" className={cn(inputClass, "h-16")} />
                  <Button type="submit">Add Deadline</Button>
                </form>
              </motion.div>
            </div>
          )}

          {/* ADD DOCUMENT MODAL */}
          {showAddDocument && data && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowAddDocument(false)}>
              <motion.div initial={{ opacity: 0, y: 12, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} className="glass-panel w-full max-w-lg mx-4 rounded-lg p-6 shadow-soft" onClick={e => e.stopPropagation()}>
                <h3 className="text-xl font-heading font-bold text-heading mb-4">Add Document</h3>
                <form className="grid gap-3" onSubmit={e => postForm("/api/admin/documents", e, () => setShowAddDocument(false))}>
                  <select name="clientId" className={inputClass} required><option value="">Select Client *</option>{data.clients?.map((c: any) => <option key={c.id} value={c.id}>{c.name}{c.company ? ` (${c.company})` : ""}</option>)}</select>
                  <input name="name" placeholder="Document Name *" className={inputClass} required />
                  <select name="type" className={inputClass} required><option value="">Document Type *</option><option value="passport">Passport</option><option value="visa">Visa</option><option value="trade_license">Trade License</option><option value="tenancy">Tenancy Contract</option><option value="moa">MOA</option><option value="ejari">EJARI</option><option value="other">Other</option></select>
                  <input name="fileUrl" placeholder="File URL (Drive / OneDrive / Dropbox link) *" className={inputClass} required />
                  <div><label className="text-xs text-muted">Expiry Date (optional)</label><input name="expiryDate" type="date" className={cn(inputClass, "mt-1 w-full")} /></div>
                  <Button type="submit">Add Document</Button>
                </form>
              </motion.div>
            </div>
          )}

          {/* ADD ATTESTATION MODAL */}
          {showAddAttestation && data && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowAddAttestation(false)}>
              <motion.div initial={{ opacity: 0, y: 12, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} className="glass-panel w-full max-w-lg mx-4 rounded-lg p-6 shadow-soft" onClick={e => e.stopPropagation()}>
                <h3 className="text-xl font-heading font-bold text-heading mb-4">Start Attestation</h3>
                <form className="grid gap-3" onSubmit={e => postForm("/api/admin/attestation", e, () => setShowAddAttestation(false))}>
                  <select name="clientId" className={inputClass} required><option value="">Select Client *</option>{data.clients?.map((c: any) => <option key={c.id} value={c.id}>{c.name}{c.company ? ` (${c.company})` : ""}</option>)}</select>
                  <input name="documentName" placeholder="Document Name *" className={inputClass} required />
                  <select name="documentType" className={inputClass}><option value="">Document Category</option><option value="educational">Educational</option><option value="commercial">Commercial</option><option value="personal">Personal</option><option value="marriage">Marriage</option><option value="birth">Birth Certificate</option></select>
                  <textarea name="notes" placeholder="Notes (optional)" className={cn(inputClass, "h-16")} />
                  <Button type="submit">Start Attestation</Button>
                </form>
              </motion.div>
            </div>
          )}

          {/* ADD COMM LOG MODAL */}
          {showAddCommLog && data && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowAddCommLog(false)}>
              <motion.div initial={{ opacity: 0, y: 12, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} className="glass-panel w-full max-w-lg mx-4 rounded-lg p-6 shadow-soft" onClick={e => e.stopPropagation()}>
                <h3 className="text-xl font-heading font-bold text-heading mb-4">Log Communication</h3>
                <form className="grid gap-3" onSubmit={e => postForm("/api/admin/commlog", e, () => setShowAddCommLog(false))}>
                  <select name="clientId" className={inputClass} required><option value="">Select Client *</option>{data.clients?.map((c: any) => <option key={c.id} value={c.id}>{c.name}{c.company ? ` (${c.company})` : ""}</option>)}</select>
                  <div className="grid grid-cols-2 gap-3">
                    <select name="type" className={inputClass} required><option value="">Type *</option><option value="call">Call</option><option value="email">Email</option><option value="visit">Visit</option><option value="whatsapp">WhatsApp</option></select>
                    <input name="staffName" placeholder="Staff Name *" className={inputClass} required />
                  </div>
                  <textarea name="summary" placeholder="Summary / What was discussed *" className={cn(inputClass, "h-20")} required />
                  <textarea name="outcome" placeholder="Outcome / Next action (optional)" className={cn(inputClass, "h-16")} />
                  <Button type="submit">Log Communication</Button>
                </form>
              </motion.div>
            </div>
          )}

          {/* ADD STAFF MODAL */}
          {showAddStaff && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowAddStaff(false)}>
              <motion.div initial={{ opacity: 0, y: 12, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} className="glass-panel w-full max-w-lg mx-4 rounded-lg p-6 shadow-soft" onClick={e => e.stopPropagation()}>
                <h3 className="text-xl font-heading font-bold text-heading mb-4">Add Staff Member</h3>
                <p className="text-sm text-muted mb-4">Adds the staff profile. Set up Supabase Auth separately for login access.</p>
                <form className="grid gap-3" onSubmit={e => postForm("/api/admin/staff", e, () => setShowAddStaff(false))}>
                  <input name="name" placeholder="Full Name *" className={inputClass} required />
                  <input name="email" type="email" placeholder="Email *" className={inputClass} required />
                  <select name="role" className={inputClass}><option value="pro">PRO Officer</option><option value="manager">Manager</option><option value="admin">Admin</option></select>
                  <Button type="submit">Add Staff</Button>
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
                              <p className="text-xs text-muted">{d.client?.name ?? "—"} &middot; {d.type}</p>
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
                      <p className="mt-3 font-heading text-3xl font-bold text-heading">{data?.counts?.clients ?? initialStats.clients}</p>
                      <p className="mt-1 text-xs text-gold">{data?.counts?.leads ?? initialStats.leads} leads in pipeline</p>
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
                      <p className="mt-3 font-heading text-3xl font-bold text-heading">{data?.counts?.quoteReqs ?? initialStats.quoteReqs}</p>
                      <p className="mt-1 text-xs text-muted">{data?.counts?.contacts ?? initialStats.contacts} contact messages</p>
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
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="font-heading font-semibold text-heading text-lg">Pipeline Overview</h3>
                        <span className="rounded-full bg-gold/10 px-3 py-1 text-xs font-semibold text-gold">{data?.counts?.services ?? initialStats.services} active services</span>
                      </div>
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
                                <p className="font-semibold text-heading">{s.client?.name ?? (data.clients as Client[])?.find((c: Client) => c.id === s.clientId)?.name ?? "—"}</p>
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
                                aria-label={`Move ${s.client?.name ?? "client"} to stage`}
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

              {active==="Leads" && data && (
                <div className="space-y-4">
                  {/* Source filter tabs */}
                  <div className="flex flex-wrap gap-2">
                    {["all","chatbot","website","direct","referral","call"].map(src => (
                      <button key={src} onClick={() => setLeadSourceFilter(src)}
                        className={cn("px-3 py-1.5 rounded-full text-xs font-medium capitalize transition",
                          leadSourceFilter === src ? "bg-navy text-white" : "bg-panel border border-edge text-muted hover:border-gold hover:text-heading"
                        )}>{src === "all" ? "All Sources" : src}</button>
                    ))}
                  </div>
                  {/* Search */}
                  <input value={moduleSearch["leads"] ?? ""} onChange={e => setModuleSearch(p => ({ ...p, leads: e.target.value }))} placeholder="Search leads..." className={cn(inputClass, "w-full max-w-sm")} />
                  {/* Table */}
                  <div className="glass-panel rounded-lg shadow-soft">
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[860px] text-sm">
                        <thead className="bg-panel"><tr>{["Name","Email","Phone","Interest","Notes","Source","Status","Created",""].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted">{h}</th>)}</tr></thead>
                        <tbody className="divide-y divide-edge">
                          {(() => {
                            let rows: Lead[] = data.leads ?? [];
                            if (leadSourceFilter !== "all") rows = rows.filter((l: Lead) => l.source === leadSourceFilter);
                            const q = (moduleSearch["leads"] ?? "").toLowerCase();
                            if (q) rows = rows.filter((l: Lead) => [l.name, l.email, l.phone, l.serviceInterest, l.source, l.notes].some(v => v?.toLowerCase().includes(q)));
                            if (rows.length === 0) return (
                              <tr><td colSpan={9} className="px-4 py-12 text-center text-muted">No leads found.</td></tr>
                            );
                            return rows.map((l: Lead) => (
                              <tr key={l.id} className="cursor-pointer transition hover:bg-panel/60" onClick={() => { setSelectedLead(l); setLeadNoteText(l.notes ?? ""); }}>
                                <td className="px-4 py-3 font-medium text-heading">{l.name}</td>
                                <td className="px-4 py-3 text-muted">{l.email || "—"}</td>
                                <td className="px-4 py-3 text-muted">{l.phone || "—"}</td>
                                <td className="px-4 py-3 text-muted text-xs">{l.serviceInterest || "—"}</td>
                                <td className="px-4 py-3 text-muted text-xs max-w-[140px] truncate">{l.notes || "—"}</td>
                                <td className="px-4 py-3"><span className="bg-gold/10 text-gold text-xs px-2 py-0.5 rounded-full capitalize">{l.source}</span></td>
                                <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                                  <select value={l.status} onChange={async e => {
                                    const newStatus = e.target.value;
                                    setData((prev: any) => ({ ...prev, leads: prev.leads.map((x: Lead) => x.id === l.id ? { ...x, status: newStatus } : x) }));
                                    await fetch(`/api/admin/leads/${l.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: newStatus }) });
                                  }} className="rounded border border-edge bg-base px-2 py-1 text-xs text-heading focus:border-gold focus:outline-none">
                                    {["new","contacted","qualified","converted","lost"].map(s => <option key={s} value={s}>{s}</option>)}
                                  </select>
                                </td>
                                <td className="px-4 py-3 text-muted text-xs">{l.createdAt ? new Date(l.createdAt).toLocaleDateString() : "—"}</td>
                                <td className="px-4 py-3 text-right" onClick={e => e.stopPropagation()}><button onClick={() => deleteRecord(`/api/admin/leads/${l.id}`)} className="text-xs text-red-400 hover:underline">Delete</button></td>
                              </tr>
                            ));
                          })()}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {active==="Quotes & Invoices" && data && <div className="space-y-6">
                <div className="glass-panel rounded-lg shadow-soft"><h3 className="px-4 py-3 font-heading font-semibold text-heading border-b border-edge">Quote Requests (Website)</h3><div className="overflow-x-auto"><table className="w-full min-w-[560px] text-sm"><thead className="bg-panel"><tr><th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted">Name</th><th className="px-4 py-3 hidden sm:table-cell text-left text-xs font-semibold uppercase tracking-wide text-muted">Email</th><th className="px-4 py-3 hidden sm:table-cell text-left text-xs font-semibold uppercase tracking-wide text-muted">Company</th><th className="px-4 py-3 hidden md:table-cell text-left text-xs font-semibold uppercase tracking-wide text-muted">Service</th><th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted">Date</th></tr></thead><tbody className="divide-y divide-edge">{data.quoteReqs?.map((q:any)=><tr key={q.id} className="transition hover:bg-panel/60"><td className="px-4 py-3 font-medium text-heading">{q.name}</td><td className="px-4 py-3 hidden sm:table-cell text-muted">{q.email}</td><td className="px-4 py-3 hidden sm:table-cell text-muted">{q.company||"-"}</td><td className="px-4 py-3 hidden md:table-cell text-muted">{q.serviceInterest||"-"}</td><td className="px-4 py-3 text-muted">{new Date(q.createdAt).toLocaleDateString()}</td></tr>)}</tbody></table></div></div>
                <div className="glass-panel rounded-lg shadow-soft"><h3 className="px-4 py-3 font-heading font-semibold text-heading border-b border-edge">Generated Quotes</h3><div className="overflow-x-auto"><table className="w-full min-w-[560px] text-sm"><thead className="bg-panel"><tr><th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted">Client</th><th className="px-4 py-3 hidden sm:table-cell text-left text-xs font-semibold uppercase tracking-wide text-muted">Services</th><th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted">Govt</th><th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted">PRO</th><th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted">Total</th><th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted">PDF</th></tr></thead><tbody className="divide-y divide-edge">{data.quotesList?.map((q:any)=><tr key={q.id} className="transition hover:bg-panel/60"><td className="px-4 py-3 font-medium text-heading">{q.client?.name ?? "—"}</td><td className="px-4 py-3 hidden sm:table-cell text-muted text-xs">{q.services}</td><td className="px-4 py-3 text-body">AED {q.govFees}</td><td className="px-4 py-3 text-body">AED {q.proFees}</td><td className="px-4 py-3 font-bold text-heading">AED {q.total}</td><td className="px-4 py-3"><div className="flex gap-3"><a href={`/api/admin/quote/pdf?id=${q.id}`} target="_blank" className="text-gold font-semibold text-xs hover:underline">Quotation</a><a href={`/api/admin/quote/pdf?id=${q.id}&variant=icv`} target="_blank" className="text-gold font-semibold text-xs hover:underline">ICV &amp; ADNOC</a></div></td></tr>)}</tbody></table></div></div>
                <div className="glass-panel rounded-lg shadow-soft"><h3 className="px-4 py-3 font-heading font-semibold text-heading border-b border-edge">Invoices</h3><div className="overflow-x-auto"><table className="w-full min-w-[520px] text-sm"><thead className="bg-panel"><tr><th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted">Invoice #</th><th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted">Client</th><th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted">Amount</th><th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted">Status</th><th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted">PDF</th></tr></thead><tbody className="divide-y divide-edge">{data.invoices?.map((inv:any)=><tr key={inv.id} className="transition hover:bg-panel/60"><td className="px-4 py-3 font-medium text-heading">INV-{inv.id.slice(0,8)}</td><td className="px-4 py-3 text-body">{inv.quote?.client?.name ?? "—"}</td><td className="px-4 py-3 font-bold text-heading">AED {inv.amount}</td><td className="px-4 py-3"><span className={inv.status==="paid"?"bg-emerald-500/15 text-emerald-300 text-xs px-2 py-0.5 rounded-full":"bg-amber-500/15 text-amber-300 text-xs px-2 py-0.5 rounded-full"}>{inv.status}</span></td><td className="px-4 py-3"><a href={`/api/admin/invoice/pdf?id=${inv.id}`} target="_blank" className="text-gold font-semibold text-xs hover:underline">Download PDF</a></td></tr>)}</tbody></table></div></div>
              </div>}

              {active==="Follow-ups" && data && <div className="glass-panel rounded-lg shadow-soft"><div className="overflow-x-auto"><table className="w-full min-w-[420px] text-sm"><thead className="bg-panel"><tr><th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted">Client</th><th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted">Step</th><th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted">Due</th></tr></thead><tbody className="divide-y divide-edge">{data.followUps?.map((f:FollowUp)=><tr key={f.id} className="transition hover:bg-panel/60"><td className="px-4 py-3 font-medium text-heading">{f.client?.name ?? "—"}</td><td className="px-4 py-3 text-body">{f.step}</td><td className="px-4 py-3 text-muted">{new Date(f.dueDate).toLocaleDateString()}</td></tr>)}</tbody></table></div></div>}

              {/* VISA TRACKER */}
              {active === "Visa Tracker" && (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <input value={moduleSearch["visa"] ?? ""} onChange={e => setModuleSearch(p => ({ ...p, visa: e.target.value }))} placeholder="Search visas..." className={cn(inputClass, "flex-1 min-w-[160px]")} />
                    <Button onClick={() => setShowAddVisa(true)}><Plus size={16} /> Add Visa</Button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {(["applied","approved","renewed","expired"] as const).map(st => (
                      <div key={st} className="glass-panel rounded-lg p-4 shadow-soft">
                        <p className="text-xs text-muted capitalize">{st}</p>
                        <p className="mt-1 font-heading text-2xl font-bold text-heading">{(data?.visas ?? []).filter((v: VisaRow) => v.status === st).length}</p>
                      </div>
                    ))}
                  </div>
                  <div className="glass-panel rounded-lg shadow-soft">
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[620px] text-sm">
                        <thead className="bg-panel"><tr>{["Client","Type","Status","Applied","Expires","Days Left",""].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted">{h}</th>)}</tr></thead>
                        <tbody className="divide-y divide-edge">
                          {searchFilter(data?.visas ?? [], "visa", ["type","status","client.name","remarks"]).map((v: VisaRow) => {
                            const d = daysLeft(v.expiryDate);
                            return (
                              <tr key={v.id} className="transition hover:bg-panel/60">
                                <td className="px-4 py-3 font-medium text-heading">{v.client?.name ?? "—"}</td>
                                <td className="px-4 py-3 capitalize text-body">{v.type}</td>
                                <td className="px-4 py-3">{statusBadge(v.status)}</td>
                                <td className="px-4 py-3 text-muted">{v.applicationDate ? new Date(v.applicationDate).toLocaleDateString() : "—"}</td>
                                <td className="px-4 py-3 text-muted">{v.expiryDate ? new Date(v.expiryDate).toLocaleDateString() : "—"}</td>
                                <td className="px-4 py-3">{expiryBadge(d)}</td>
                                <td className="px-4 py-3 text-right"><button onClick={() => deleteRecord(`/api/admin/visa/${v.id}`)} className="text-xs text-red-400 hover:underline">Delete</button></td>
                              </tr>
                            );
                          })}
                          {(data?.visas ?? []).length === 0 && <tr><td colSpan={7} className="px-4 py-12 text-center text-muted">No visa records yet. <button onClick={() => setShowAddVisa(true)} className="text-gold hover:underline">Add the first one.</button></td></tr>}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* COMPANY FORMATION */}
              {active === "Company Formation" && data && (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <select value={formationClientId} onChange={e => setFormationClientId(e.target.value)} className={cn(inputClass, "flex-1 min-w-[200px]")}>
                      <option value="">All Clients</option>
                      {data.clients?.map((c: any) => <option key={c.id} value={c.id}>{c.name}{c.company ? ` — ${c.company}` : ""}</option>)}
                    </select>
                  </div>
                  {(() => {
                    const allFormation: FormationRow[] = data?.formation ?? [];
                    const clientIds: string[] = formationClientId
                      ? [formationClientId]
                      : Array.from(new Set(allFormation.map((f: FormationRow) => f.clientId)));

                    const clientsWithNoFormation = (data.clients ?? []).filter((c: any) =>
                      !allFormation.some((f: FormationRow) => f.clientId === c.id) &&
                      (!formationClientId || c.id === formationClientId)
                    );

                    return (
                      <div className="space-y-4">
                        {clientIds.map((cid: string) => {
                          const steps = allFormation.filter((f: FormationRow) => f.clientId === cid).sort((a, b) => a.step - b.step);
                          const pct = steps.length > 0 ? Math.round((steps.filter(s => s.completed).length / steps.length) * 100) : 0;
                          const clientName = data.clients?.find((c: any) => c.id === cid)?.name ?? cid;
                          return (
                            <div key={cid} className="glass-panel rounded-lg p-5 shadow-soft">
                              <div className="flex items-center justify-between mb-3">
                                <div>
                                  <h3 className="font-heading font-semibold text-heading">{clientName}</h3>
                                  <p className="text-xs text-muted">{steps.filter(s => s.completed).length} / {steps.length} steps completed</p>
                                </div>
                                <span className={cn("text-sm font-bold", pct === 100 ? "text-emerald-400" : "text-gold")}>{pct}%</span>
                              </div>
                              <div className="w-full h-1.5 rounded-full bg-panel mb-4">
                                <div className="h-full rounded-full bg-gold transition-all" style={{ width: `${pct}%` }} />
                              </div>
                              <div className="grid gap-1.5">
                                {steps.map(s => (
                                  <label key={s.id} className="flex items-center gap-3 rounded-md border border-edge px-3 py-2 text-sm cursor-pointer hover:border-gold/30 transition">
                                    <input type="checkbox" checked={s.completed} onChange={e => toggleFormationStep(s.id, e.target.checked)} className="accent-gold h-4 w-4" />
                                    <span className={cn(s.completed ? "line-through text-muted" : "text-body")}>
                                      <span className="text-xs text-muted mr-2">{s.step}.</span>{s.name}
                                    </span>
                                    {s.completed && <span className="ml-auto text-emerald-400"><CheckSquare size={14}/></span>}
                                  </label>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                        {clientsWithNoFormation.map((c: any) => (
                          <div key={c.id} className="glass-panel rounded-lg p-5 shadow-soft flex items-center justify-between">
                            <div>
                              <p className="font-heading font-semibold text-heading">{c.name}{c.company ? ` — ${c.company}` : ""}</p>
                              <p className="text-xs text-muted">No formation checklist started</p>
                            </div>
                            <Button variant="outline" onClick={() => startFormation(c.id)}><Plus size={14}/> Start Formation</Button>
                          </div>
                        ))}
                        {clientIds.length === 0 && clientsWithNoFormation.length === 0 && (
                          <div className="glass-panel rounded-lg p-8 text-center shadow-soft">
                            <p className="text-muted">No clients found. Add a client first.</p>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* LICENSE CALENDAR */}
              {active === "License Calendar" && (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <input value={moduleSearch["license"] ?? ""} onChange={e => setModuleSearch(p => ({ ...p, license: e.target.value }))} placeholder="Search licenses..." className={cn(inputClass, "flex-1 min-w-[160px]")} />
                    <Button onClick={() => setShowAddLicense(true)}><Plus size={16} /> Add License</Button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {(["active","renewal_due","expired","cancelled"] as const).map(st => (
                      <div key={st} className="glass-panel rounded-lg p-4 shadow-soft">
                        <p className="text-xs text-muted capitalize">{st.replace("_"," ")}</p>
                        <p className="mt-1 font-heading text-2xl font-bold text-heading">{(data?.licenses ?? []).filter((l: LicenseRow) => l.status === st).length}</p>
                      </div>
                    ))}
                  </div>
                  <div className="glass-panel rounded-lg shadow-soft">
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[660px] text-sm">
                        <thead className="bg-panel"><tr>{["Client","License No","Type","Issued","Expires","Days Left","Status",""].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted">{h}</th>)}</tr></thead>
                        <tbody className="divide-y divide-edge">
                          {searchFilter(data?.licenses ?? [], "license", ["licenseNumber","type","status","client.name"]).map((l: LicenseRow) => {
                            const d = daysLeft(l.expiryDate);
                            return (
                              <tr key={l.id} className="transition hover:bg-panel/60">
                                <td className="px-4 py-3 font-medium text-heading">{l.client?.name ?? "—"}</td>
                                <td className="px-4 py-3 text-body">{l.licenseNumber || "—"}</td>
                                <td className="px-4 py-3 text-muted">{l.type || "—"}</td>
                                <td className="px-4 py-3 text-muted">{l.issueDate ? new Date(l.issueDate).toLocaleDateString() : "—"}</td>
                                <td className="px-4 py-3 text-muted">{l.expiryDate ? new Date(l.expiryDate).toLocaleDateString() : "—"}</td>
                                <td className="px-4 py-3">{expiryBadge(d)}</td>
                                <td className="px-4 py-3">{statusBadge(l.status)}</td>
                                <td className="px-4 py-3 text-right"><button onClick={() => deleteRecord(`/api/admin/license/${l.id}`)} className="text-xs text-red-400 hover:underline">Delete</button></td>
                              </tr>
                            );
                          })}
                          {(data?.licenses ?? []).length === 0 && <tr><td colSpan={8} className="px-4 py-12 text-center text-muted">No licenses yet. <button onClick={() => setShowAddLicense(true)} className="text-gold hover:underline">Add the first one.</button></td></tr>}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* COMPLIANCE CALENDAR */}
              {active === "Compliance Calendar" && (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <input value={moduleSearch["compliance"] ?? ""} onChange={e => setModuleSearch(p => ({ ...p, compliance: e.target.value }))} placeholder="Search compliance..." className={cn(inputClass, "flex-1 min-w-[160px]")} />
                    <Button onClick={() => setShowAddCompliance(true)}><Plus size={16} /> Add Deadline</Button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {(["pending","completed","overdue"] as const).map(st => (
                      <div key={st} className="glass-panel rounded-lg p-4 shadow-soft">
                        <p className="text-xs text-muted capitalize">{st}</p>
                        <p className="mt-1 font-heading text-2xl font-bold text-heading">{(data?.compliance ?? []).filter((c: ComplianceRow) => c.status === st).length}</p>
                      </div>
                    ))}
                  </div>
                  <div className="glass-panel rounded-lg shadow-soft">
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[580px] text-sm">
                        <thead className="bg-panel"><tr>{["Client","Type","Due Date","Days Left","Status","Notes",""].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted">{h}</th>)}</tr></thead>
                        <tbody className="divide-y divide-edge">
                          {searchFilter(data?.compliance ?? [], "compliance", ["type","status","notes","client.name"]).map((c: ComplianceRow) => {
                            const d = daysLeft(c.dueDate);
                            return (
                              <tr key={c.id} className="transition hover:bg-panel/60">
                                <td className="px-4 py-3 font-medium text-heading">{c.client?.name ?? "—"}</td>
                                <td className="px-4 py-3"><span className="rounded bg-navy/10 px-2 py-0.5 text-xs font-semibold text-heading">{c.type}</span></td>
                                <td className="px-4 py-3 text-muted">{new Date(c.dueDate).toLocaleDateString()}</td>
                                <td className="px-4 py-3">{c.status !== "completed" ? expiryBadge(d) : <span className="text-xs text-muted">—</span>}</td>
                                <td className="px-4 py-3">
                                  <select value={c.status} onChange={async e => { await fetch(`/api/admin/compliance/${c.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: e.target.value }) }); fetchData(); }} className="rounded border border-edge bg-base px-2 py-1 text-xs text-heading focus:border-gold focus:outline-none">
                                    <option value="pending">pending</option><option value="completed">completed</option><option value="overdue">overdue</option>
                                  </select>
                                </td>
                                <td className="px-4 py-3 text-muted text-xs max-w-[140px] truncate">{c.notes || "—"}</td>
                                <td className="px-4 py-3 text-right"><button onClick={() => deleteRecord(`/api/admin/compliance/${c.id}`)} className="text-xs text-red-400 hover:underline">Delete</button></td>
                              </tr>
                            );
                          })}
                          {(data?.compliance ?? []).length === 0 && <tr><td colSpan={7} className="px-4 py-12 text-center text-muted">No deadlines yet. <button onClick={() => setShowAddCompliance(true)} className="text-gold hover:underline">Add the first one.</button></td></tr>}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* DOCUMENTS */}
              {active === "Documents" && (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <input value={moduleSearch["docs"] ?? ""} onChange={e => setModuleSearch(p => ({ ...p, docs: e.target.value }))} placeholder="Search documents..." className={cn(inputClass, "flex-1 min-w-[160px]")} />
                    <Button onClick={() => setShowAddDocument(true)}><Plus size={16} /> Add Document</Button>
                  </div>
                  <div className="glass-panel rounded-lg shadow-soft">
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[620px] text-sm">
                        <thead className="bg-panel"><tr>{["Client","Document","Type","Expires","Days Left","Link",""].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted">{h}</th>)}</tr></thead>
                        <tbody className="divide-y divide-edge">
                          {searchFilter(data?.documents ?? [], "docs", ["name","type","client.name"]).map((d: DocumentRow) => {
                            const dl = daysLeft(d.expiryDate);
                            return (
                              <tr key={d.id} className="transition hover:bg-panel/60">
                                <td className="px-4 py-3 font-medium text-heading">{d.client?.name ?? "—"}</td>
                                <td className="px-4 py-3 text-heading">{d.name}</td>
                                <td className="px-4 py-3"><span className="rounded bg-panel px-2 py-0.5 text-xs text-muted capitalize">{d.type}</span></td>
                                <td className="px-4 py-3 text-muted">{d.expiryDate ? new Date(d.expiryDate).toLocaleDateString() : "—"}</td>
                                <td className="px-4 py-3">{dl !== null ? expiryBadge(dl) : <span className="text-xs text-muted">—</span>}</td>
                                <td className="px-4 py-3">{d.fileUrl ? <a href={d.fileUrl} target="_blank" rel="noreferrer" className="text-gold text-xs hover:underline">Open</a> : "—"}</td>
                                <td className="px-4 py-3 text-right"><button onClick={() => deleteRecord(`/api/admin/documents/${d.id}`)} className="text-xs text-red-400 hover:underline">Delete</button></td>
                              </tr>
                            );
                          })}
                          {(data?.documents ?? []).length === 0 && <tr><td colSpan={7} className="px-4 py-12 text-center text-muted">No documents yet. <button onClick={() => setShowAddDocument(true)} className="text-gold hover:underline">Add the first one.</button></td></tr>}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* STAFF & PERFORMANCE */}
              {active === "Staff & Performance" && (
                <div className="space-y-6">
                  <div className="flex flex-wrap items-center gap-3">
                    <input value={moduleSearch["staff"] ?? ""} onChange={e => setModuleSearch(p => ({ ...p, staff: e.target.value }))} placeholder="Search staff..." className={cn(inputClass, "flex-1 min-w-[160px]")} />
                    <Button onClick={() => setShowAddStaff(true)}><Plus size={16} /> Add Staff</Button>
                  </div>
                  <div className="glass-panel rounded-lg shadow-soft">
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[460px] text-sm">
                        <thead className="bg-panel"><tr>{["Name","Email","Role","Active","Tasks",""].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted">{h}</th>)}</tr></thead>
                        <tbody className="divide-y divide-edge">
                          {searchFilter(data?.staff ?? [], "staff", ["name","email","role"]).map((s: StaffRow) => {
                            const taskCount = (data?.services ?? []).filter((sr: ServiceRow) => sr.assignedTo === s.name).length;
                            return (
                              <tr key={s.id} className="transition hover:bg-panel/60">
                                <td className="px-4 py-3 font-medium text-heading">{s.name}</td>
                                <td className="px-4 py-3 text-muted">{s.email}</td>
                                <td className="px-4 py-3"><span className={cn("text-xs px-2 py-0.5 rounded-full capitalize", s.role === "admin" ? "bg-gold/15 text-gold" : s.role === "manager" ? "bg-blue-500/15 text-blue-300" : "bg-panel text-muted")}>{s.role}</span></td>
                                <td className="px-4 py-3">
                                  <button onClick={() => toggleStaffActive(s.id, !s.active)} className={cn("text-xs px-2 py-0.5 rounded-full transition hover:opacity-80", s.active ? "bg-emerald-500/15 text-emerald-300" : "bg-red-500/15 text-red-300")}>
                                    {s.active ? "Active" : "Inactive"}
                                  </button>
                                </td>
                                <td className="px-4 py-3 text-body">{taskCount}</td>
                                <td className="px-4 py-3 text-right"><button onClick={() => deleteRecord(`/api/admin/staff/${s.id}`)} className="text-xs text-red-400 hover:underline">Delete</button></td>
                              </tr>
                            );
                          })}
                          {(data?.staff ?? []).length === 0 && <tr><td colSpan={6} className="px-4 py-12 text-center text-muted">No staff yet. <button onClick={() => setShowAddStaff(true)} className="text-gold hover:underline">Add the first member.</button></td></tr>}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  {data && productivity.length > 0 && (
                    <div className="glass-panel rounded-lg p-5 shadow-soft sm:p-6">
                      <h3 className="font-heading font-semibold text-heading text-lg mb-2">Staff Productivity</h3>
                      <StaffProductivityChart data={productivity} />
                    </div>
                  )}
                </div>
              )}

              {/* ATTESTATION PIPELINE */}
              {active === "Attestation Pipeline" && (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <input value={moduleSearch["attest"] ?? ""} onChange={e => setModuleSearch(p => ({ ...p, attest: e.target.value }))} placeholder="Search documents..." className={cn(inputClass, "flex-1 min-w-[160px]")} />
                    <Button onClick={() => setShowAddAttestation(true)}><Plus size={16} /> Start Attestation</Button>
                  </div>

                  {/* summary counts */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {(["in_progress","completed","on_hold"] as const).map(st => (
                      <div key={st} className="glass-panel rounded-lg p-4 shadow-soft">
                        <p className="text-xs text-muted capitalize">{st.replace("_"," ")}</p>
                        <p className="mt-1 font-heading text-2xl font-bold text-heading">{(data?.attestations ?? []).filter((a: AttestationRow) => a.status === st).length}</p>
                      </div>
                    ))}
                  </div>

                  {/* cards */}
                  <div className="space-y-3">
                    {searchFilter(data?.attestations ?? [], "attest", ["documentName","documentType","client.name"]).map((a: AttestationRow) => {
                      const cpIdx = ATTESTATION_CHECKPOINTS.indexOf(a.checkpoint as typeof ATTESTATION_CHECKPOINTS[number]);
                      const isLast = cpIdx === ATTESTATION_CHECKPOINTS.length - 1;
                      return (
                        <div key={a.id} className="glass-panel rounded-lg p-5 shadow-soft">
                          <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                            <div>
                              <p className="font-heading font-semibold text-heading">{a.documentName}</p>
                              <p className="text-xs text-muted mt-0.5">{a.client?.name ?? "—"}{a.documentType ? ` · ${a.documentType}` : ""}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              {statusBadge(a.status)}
                              {!isLast && a.status !== "on_hold" && (
                                <button onClick={() => advanceCheckpoint(a)} className="inline-flex items-center gap-1 rounded-md border border-gold/40 bg-gold/10 px-2.5 py-1 text-xs font-semibold text-gold hover:bg-gold/20 transition">
                                  Next Step →
                                </button>
                              )}
                              <select
                                value={a.status}
                                onChange={async e => { await fetch(`/api/admin/attestation/${a.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: e.target.value }) }); fetchData(); }}
                                className="rounded border border-edge bg-base px-2 py-1 text-xs text-heading focus:border-gold focus:outline-none"
                              >
                                <option value="in_progress">In Progress</option>
                                <option value="completed">Completed</option>
                                <option value="on_hold">On Hold</option>
                              </select>
                              <button onClick={() => deleteRecord(`/api/admin/attestation/${a.id}`)} className="text-xs text-red-400 hover:underline">Delete</button>
                            </div>
                          </div>

                          {/* checkpoint pipeline */}
                          <div className="flex items-center gap-0">
                            {ATTESTATION_CHECKPOINTS.map((cp, i) => {
                              const done = i < cpIdx;
                              const current = i === cpIdx;
                              return (
                                <div key={cp} className="flex flex-1 items-center">
                                  <div className="flex flex-col items-center flex-shrink-0">
                                    <div className={cn(
                                      "flex h-7 w-7 items-center justify-center rounded-full border-2 text-xs font-bold transition",
                                      done ? "border-emerald-400 bg-emerald-400/20 text-emerald-300"
                                           : current ? "border-gold bg-gold/20 text-gold"
                                           : "border-edge bg-panel text-muted"
                                    )}>
                                      {done ? "✓" : i + 1}
                                    </div>
                                    <span className={cn("mt-1 text-center text-[10px] leading-tight max-w-[56px]", current ? "text-gold font-semibold" : done ? "text-emerald-300" : "text-muted")}>
                                      {CHECKPOINT_LABEL[cp]}
                                    </span>
                                  </div>
                                  {i < ATTESTATION_CHECKPOINTS.length - 1 && (
                                    <div className={cn("flex-1 h-0.5 mx-1 mb-4 rounded-full", done ? "bg-emerald-400/50" : "bg-edge")} />
                                  )}
                                </div>
                              );
                            })}
                          </div>

                          {a.notes && <p className="mt-3 text-xs text-muted border-t border-edge pt-2">{a.notes}</p>}
                        </div>
                      );
                    })}
                    {(data?.attestations ?? []).length === 0 && (
                      <div className="glass-panel rounded-lg p-10 text-center shadow-soft">
                        <p className="text-muted">No attestation records yet.</p>
                        <button onClick={() => setShowAddAttestation(true)} className="mt-2 text-gold text-sm hover:underline">Start the first one.</button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* COMMUNICATION LOG */}
              {active === "Communication Log" && (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <input value={moduleSearch["commlog"] ?? ""} onChange={e => setModuleSearch(p => ({ ...p, commlog: e.target.value }))} placeholder="Search communications..." className={cn(inputClass, "flex-1 min-w-[160px]")} />
                    <Button onClick={() => setShowAddCommLog(true)}><Plus size={16} /> Log Communication</Button>
                  </div>

                  {/* type filter tabs */}
                  <div className="flex flex-wrap gap-2">
                    {["all","call","email","visit","whatsapp"].map(t => (
                      <button key={t} onClick={() => setCommLogTypeFilter(t)} className={cn("rounded-full border px-3 py-1 text-xs font-semibold capitalize transition", commLogTypeFilter === t ? "border-gold bg-gold/15 text-gold" : "border-edge text-muted hover:border-gold/50 hover:text-body")}>
                        {t === "all" ? "All" : t === "call" ? "📞 Call" : t === "email" ? "✉️ Email" : t === "visit" ? "🏢 Visit" : "💬 WhatsApp"}
                      </button>
                    ))}
                  </div>

                  <div className="glass-panel rounded-lg shadow-soft">
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[620px] text-sm">
                        <thead className="bg-panel"><tr>{["Date","Client","Type","Summary","Outcome","Staff",""].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted">{h}</th>)}</tr></thead>
                        <tbody className="divide-y divide-edge">
                          {searchFilter(
                            (data?.commlog ?? []).filter((l: CommLogRow) => commLogTypeFilter === "all" || l.type === commLogTypeFilter),
                            "commlog",
                            ["summary","outcome","staffName","client.name"]
                          ).map((l: CommLogRow) => (
                            <tr key={l.id} className="transition hover:bg-panel/60">
                              <td className="px-4 py-3 text-muted whitespace-nowrap">{new Date(l.createdAt).toLocaleDateString()}</td>
                              <td className="px-4 py-3 font-medium text-heading">{l.client?.name ?? "—"}</td>
                              <td className="px-4 py-3">
                                <span className={cn("text-xs px-2 py-0.5 rounded-full capitalize font-medium",
                                  l.type === "call" ? "bg-blue-500/15 text-blue-300"
                                  : l.type === "email" ? "bg-purple-500/15 text-purple-300"
                                  : l.type === "visit" ? "bg-emerald-500/15 text-emerald-300"
                                  : "bg-green-500/15 text-green-300"
                                )}>
                                  {l.type === "call" ? "📞" : l.type === "email" ? "✉️" : l.type === "visit" ? "🏢" : "💬"} {l.type}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-body max-w-[200px] truncate" title={l.summary}>{l.summary}</td>
                              <td className="px-4 py-3 text-muted max-w-[160px] truncate text-xs" title={l.outcome ?? ""}>{l.outcome || "—"}</td>
                              <td className="px-4 py-3 text-muted">{l.staffName}</td>
                              <td className="px-4 py-3 text-right"><button onClick={() => deleteRecord(`/api/admin/commlog/${l.id}`)} className="text-xs text-red-400 hover:underline">Delete</button></td>
                            </tr>
                          ))}
                          {(data?.commlog ?? []).filter((l: CommLogRow) => commLogTypeFilter === "all" || l.type === commLogTypeFilter).length === 0 && (
                            <tr><td colSpan={7} className="px-4 py-12 text-center text-muted">No communications logged yet. <button onClick={() => setShowAddCommLog(true)} className="text-gold hover:underline">Log the first one.</button></td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}


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
