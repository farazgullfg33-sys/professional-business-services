"use client";

import { useEffect, useState, useMemo } from "react";
import { signOut } from "next-auth/react";
import {
  BarChart3, CalendarDays, CheckSquare, ClipboardList, FileArchive, FileBadge,
  FileText, FolderOpen, LayoutDashboard, LogOut, MessageSquareText, ReceiptText,
  RefreshCcw, ShieldCheck, UserCog, UsersRound, Loader2, Plus, Download
} from "lucide-react";
import { Button } from "@/components/Button";
import { cn } from "@/lib/utils";

type Stats = { clients: number; leads: number; contacts: number; quoteReqs: number; services: number };
type Client = { id: string; name: string; email?: string; phone?: string; company?: string; businessType?: string; status: string; source?: string };
type Lead = { id: string; name: string; email?: string; phone?: string; serviceInterest?: string; message?: string; status: string; source: string };
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

const links = ["Tamm","MOHRE","ICP","Amer","GDRFA","Tas'heel","DED","ADDED","FTA","MOFA"];
const urls = ["https://www.tamm.abudhabi","https://www.mohre.gov.ae","https://icp.gov.ae","https://amer.ae","https://www.gdrfad.gov.ae","https://www.tasheel.ae","https://dubaided.gov.ae","https://added.gov.ae","https://tax.gov.ae","https://www.mofa.gov.ae"];

const bizTypes = ["trade","tech","consulting","holding","media","services","other"];
const sources = ["direct","website","referral","walk-in","social","call"];
const placeholders = ["Visa Tracker","Company Formation","License Calendar","Attestation Pipeline","Compliance Calendar","Documents","Communication Log","Staff & Performance"];

export function AdminPanel({ role, stats: initialStats }: { role?: string; stats: Stats }) {
  const [active, setActive] = useState("Dashboard");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [showNewClient, setShowNewClient] = useState(false);
  const [showNewQuote, setShowNewQuote] = useState(false);

  const fetchData = () => {
    setLoading(true);
    fetch("/api/admin/data").then(r=>r.json()).then(d=>{setData(d);setLoading(false)}).catch(()=>setLoading(false));
  };

  useEffect(() => { fetchData(); }, [active]);

  const activeModule = useMemo(() => modules.find(m => m.name === active) ?? modules[0], [active]);

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
    <main className="min-h-screen bg-mist">
      <div className="grid lg:grid-cols-[280px_1fr]">
        <aside className="border-r border-navy/10 bg-white p-5">
          <h1 className="text-xl font-bold text-navy">PRO Admin</h1>
          <p className="mt-2 text-sm text-ink/55">Role: {role}</p>
          <nav className="mt-7 grid gap-1">
            {modules.map(m => { const I=m.icon; return (
              <button key={m.name} onClick={()=>setActive(m.name)} className={cn("flex items-center gap-3 rounded-md px-3 py-2 text-left text-sm font-semibold",active===m.name?"bg-gold text-navy":"text-ink/65 hover:bg-mist hover:text-navy")}><I size={17}/> {m.name}</button>
            );})}
          </nav>
        </aside>

        <section className="p-5 md:p-8">
          <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
            <div><h2 className="text-2xl font-semibold text-navy">{activeModule.name}</h2><p className="text-ink/60 text-sm">{activeModule.detail}</p></div>
            <div className="flex gap-2 flex-wrap">
              <button onClick={()=>{setShowNewClient(true);}} className="inline-flex items-center gap-2 rounded-md bg-gold px-3 py-2 text-sm font-semibold text-navy"><Plus size={16}/> New Client</button>
              <button onClick={()=>{setShowNewQuote(true);setActive("Quotes & Invoices");}} className="inline-flex items-center gap-2 rounded-md border border-navy/15 bg-white px-3 py-2 text-sm font-semibold text-navy"><FileText size={16}/> New Quote</button>
              <button onClick={exportCSV} className="inline-flex items-center gap-2 rounded-md border border-navy/15 bg-white px-3 py-2 text-sm font-semibold text-navy"><Download size={16}/> Export</button>
              <button onClick={()=>signOut({callbackUrl:"/admin"})} className="inline-flex items-center gap-2 rounded-md border border-navy/15 bg-white px-3 py-2 text-sm font-semibold text-navy"><LogOut size={16}/></button>
            </div>
          </div>

          {loading ? <div className="flex items-center gap-3 text-ink/50"><Loader2 className="animate-spin" size={20}/> Loading...</div> : null}

          {/* MODALS */}
          {showNewClient && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={()=>setShowNewClient(false)}>
              <div className="bg-white rounded-lg p-6 w-full max-w-lg mx-4 shadow-2xl" onClick={e=>e.stopPropagation()}>
                <h3 className="text-xl font-bold text-navy mb-4">New Client Intake</h3>
                <form className="grid gap-3" onSubmit={handleNewClient}>
                  <input name="name" placeholder="Full Name *" className="rounded-md border px-3 py-2 text-sm" required/>
                  <div className="grid grid-cols-2 gap-3"><input name="email" type="email" placeholder="Email" className="rounded-md border px-3 py-2 text-sm"/><input name="phone" placeholder="Phone" className="rounded-md border px-3 py-2 text-sm"/></div>
                  <div className="grid grid-cols-2 gap-3"><input name="company" placeholder="Company" className="rounded-md border px-3 py-2 text-sm"/><select name="businessType" className="rounded-md border px-3 py-2 text-sm"><option value="">Business Type</option>{bizTypes.map(t=><option key={t} value={t}>{t}</option>)}</select></div>
                  <select name="source" className="rounded-md border px-3 py-2 text-sm">{sources.map(s=><option key={s} value={s}>{s}</option>)}</select>
                  <textarea name="notes" placeholder="Notes" className="rounded-md border px-3 py-2 text-sm h-20"/>
                  <button type="submit" className="rounded-md bg-gold px-4 py-2 text-sm font-semibold text-navy">Add Client</button>
                </form>
              </div>
            </div>
          )}
          {showNewQuote && data && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={()=>setShowNewQuote(false)}>
              <div className="bg-white rounded-lg p-6 w-full max-w-lg mx-4 shadow-2xl" onClick={e=>e.stopPropagation()}>
                <h3 className="text-xl font-bold text-navy mb-4">Generate Quote & Invoice</h3>
                <form className="grid gap-3" onSubmit={handleNewQuote}>
                  <select name="clientId" className="rounded-md border px-3 py-2 text-sm" required><option value="">Select Client</option>{data.clients?.map((c:any)=><option key={c.id} value={c.id}>{c.name}{c.company?` (${c.company})`:""}</option>)}</select>
                  <input name="services" placeholder="Services: Trade License, Visa Stamping..." className="rounded-md border px-3 py-2 text-sm" required/>
                  <div className="grid grid-cols-2 gap-3"><input name="govFees" type="number" step="0.01" placeholder="Govt Fees (AED)" className="rounded-md border px-3 py-2 text-sm"/><input name="proFees" type="number" step="0.01" placeholder="PRO Fees (AED)" className="rounded-md border px-3 py-2 text-sm"/></div>
                  <button type="submit" className="rounded-md bg-gold px-4 py-2 text-sm font-semibold text-navy">Generate</button>
                </form>
              </div>
            </div>
          )}

          {/* DASHBOARD */}
          {active==="Dashboard" && <>
            <div className="grid gap-4 md:grid-cols-5 mb-8">{[["Clients",initialStats.clients],["Services",initialStats.services],["Leads",initialStats.leads],["Contacts",initialStats.contacts],["Quote Reqs",initialStats.quoteReqs]].map(([l,v])=>(<div key={l} className="rounded-lg border bg-white p-4"><p className="text-sm text-ink/50">{l}</p><p className="text-3xl font-bold text-navy mt-1">{v as number}</p></div>))}</div>
            <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
              <div className="rounded-lg border bg-white p-6"><h3 className="font-semibold text-navy text-lg">Pipeline Overview</h3><div className="mt-4 grid gap-3 md:grid-cols-3">{["New","In Progress","Completed"].map(s=><div key={s} className="rounded-md border bg-mist p-3"><p className="text-sm font-semibold text-navy">{s}</p><p className="text-xs text-ink/50 mt-1">{data?.services?.filter((x:ServiceRow)=>x.status===s.toLowerCase().replace(" ","_")).length||0} items</p></div>)}</div></div>
              <aside className="space-y-4">
                <div className="rounded-lg border bg-white p-5"><h3 className="font-semibold text-navy">Quick Links</h3><div className="mt-3 grid grid-cols-2 gap-1.5">{links.map((l,i)=><a key={l} href={urls[i]} target="_blank" className="rounded border px-2 py-1.5 text-xs font-medium text-navy hover:border-gold">{l}</a>)}</div></div>
                <div className="rounded-lg border bg-white p-5"><h3 className="font-semibold text-navy">Quick Actions</h3><div className="mt-3 grid gap-2"><Button onClick={()=>{setShowNewClient(true)}}>New Client</Button><Button variant="outline" onClick={()=>{setShowNewQuote(true);setActive("Quotes & Invoices")}}>Generate Quote</Button><Button variant="outline" onClick={exportCSV}>Export CSV</Button></div></div>
              </aside>
            </div>
          </>}

          {/* TABLES */}
          {active==="Clients" && data && <div className="bg-white rounded-lg border overflow-hidden"><table className="w-full text-sm"><thead className="bg-mist text-navy"><tr><th className="px-4 py-3">Name</th><th className="px-4 py-3 hidden sm:table-cell">Email</th><th className="px-4 py-3 hidden sm:table-cell">Phone</th><th className="px-4 py-3 hidden md:table-cell">Company</th><th className="px-4 py-3">Type</th><th className="px-4 py-3">Source</th></tr></thead><tbody>{data.clients?.map((c:Client)=><tr key={c.id}><td className="px-4 py-3 font-medium text-navy">{c.name}</td><td className="px-4 py-3 hidden sm:table-cell text-ink/60">{c.email||"-"}</td><td className="px-4 py-3 hidden sm:table-cell text-ink/60">{c.phone||"-"}</td><td className="px-4 py-3 hidden md:table-cell text-ink/60">{c.company||"-"}</td><td className="px-4 py-3 text-xs">{c.businessType||"-"}</td><td className="px-4 py-3"><span className="bg-gold/10 text-navy text-xs px-2 py-0.5 rounded-full">{c.source||"-"}</span></td></tr>)}</tbody></table></div>}

          {active==="Service Pipeline" && data && <div className="bg-white rounded-lg border overflow-hidden"><table className="w-full text-sm"><thead className="bg-mist text-navy"><tr><th className="px-4 py-3">Client</th><th className="px-4 py-3">Service</th><th className="px-4 py-3 hidden sm:table-cell">Assigned</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 hidden md:table-cell">Deadline</th></tr></thead><tbody>{data.services?.map((s:ServiceRow)=><tr key={s.id}><td className="px-4 py-3 font-medium text-navy">{s.client.name}</td><td className="px-4 py-3">{s.serviceType}</td><td className="px-4 py-3 hidden sm:table-cell text-ink/60">{s.assignedTo||"-"}</td><td className="px-4 py-3"><span className={cn("text-xs px-2 py-0.5 rounded-full",s.status==="in_progress"?"bg-blue-50 text-blue-700":"bg-green-50 text-green-700")}>{s.status}</span></td><td className="px-4 py-3 hidden md:table-cell text-ink/60">{s.deadline?new Date(s.deadline).toLocaleDateString():"-"}</td></tr>)}</tbody></table></div>}

          {active==="Leads" && data && <div className="bg-white rounded-lg border overflow-hidden"><table className="w-full text-sm"><thead className="bg-mist text-navy"><tr><th className="px-4 py-3">Name</th><th className="px-4 py-3 hidden sm:table-cell">Email</th><th className="px-4 py-3 hidden sm:table-cell">Phone</th><th className="px-4 py-3 hidden md:table-cell">Interest</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Source</th></tr></thead><tbody>{data.leads?.map((l:Lead)=><tr key={l.id}><td className="px-4 py-3 font-medium text-navy">{l.name}</td><td className="px-4 py-3 hidden sm:table-cell text-ink/60">{l.email||"-"}</td><td className="px-4 py-3 hidden sm:table-cell text-ink/60">{l.phone||"-"}</td><td className="px-4 py-3 hidden md:table-cell text-ink/60">{l.serviceInterest||"-"}</td><td className="px-4 py-3">{l.status}</td><td className="px-4 py-3"><span className="bg-gold/10 text-navy text-xs px-2 py-0.5 rounded-full">{l.source}</span></td></tr>)}</tbody></table></div>}

          {active==="Quotes & Invoices" && data && <div className="space-y-6">
            <div className="bg-white rounded-lg border overflow-hidden"><h3 className="px-4 py-3 font-semibold text-navy border-b">Quote Requests (Website)</h3><table className="w-full text-sm"><thead className="bg-mist"><tr><th className="px-4 py-3">Name</th><th className="px-4 py-3 hidden sm:table-cell">Email</th><th className="px-4 py-3 hidden sm:table-cell">Company</th><th className="px-4 py-3 hidden md:table-cell">Service</th><th className="px-4 py-3">Date</th></tr></thead><tbody>{data.quoteReqs?.map((q:any)=><tr key={q.id}><td className="px-4 py-3 font-medium">{q.name}</td><td className="px-4 py-3 hidden sm:table-cell text-ink/60">{q.email}</td><td className="px-4 py-3 hidden sm:table-cell text-ink/60">{q.company||"-"}</td><td className="px-4 py-3 hidden md:table-cell text-ink/60">{q.serviceInterest||"-"}</td><td className="px-4 py-3 text-ink/60">{new Date(q.createdAt).toLocaleDateString()}</td></tr>)}</tbody></table></div>
            <div className="bg-white rounded-lg border overflow-hidden"><h3 className="px-4 py-3 font-semibold text-navy border-b">Generated Quotes</h3><table className="w-full text-sm"><thead className="bg-mist"><tr><th className="px-4 py-3">Client</th><th className="px-4 py-3 hidden sm:table-cell">Services</th><th className="px-4 py-3">Govt</th><th className="px-4 py-3">PRO</th><th className="px-4 py-3">Total</th><th className="px-4 py-3">PDF</th></tr></thead><tbody>{data.quotesList?.map((q:any)=><tr key={q.id}><td className="px-4 py-3 font-medium">{q.client.name}</td><td className="px-4 py-3 hidden sm:table-cell text-ink/60 text-xs">{q.services}</td><td className="px-4 py-3">AED {q.govFees}</td><td className="px-4 py-3">AED {q.proFees}</td><td className="px-4 py-3 font-bold">AED {q.total}</td><td className="px-4 py-3"><a href={`/api/admin/quote/pdf?id=${q.id}`} target="_blank" className="text-gold font-semibold text-xs hover:underline">Download PDF</a></td></tr>)}</tbody></table></div>
            <div className="bg-white rounded-lg border overflow-hidden"><h3 className="px-4 py-3 font-semibold text-navy border-b">Invoices</h3><table className="w-full text-sm"><thead className="bg-mist"><tr><th className="px-4 py-3">Invoice #</th><th className="px-4 py-3">Client</th><th className="px-4 py-3">Amount</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">PDF</th></tr></thead><tbody>{data.invoices?.map((inv:any)=><tr key={inv.id}><td className="px-4 py-3 font-medium">INV-{inv.id.slice(0,8)}</td><td className="px-4 py-3">{inv.quote.client.name}</td><td className="px-4 py-3 font-bold">AED {inv.amount}</td><td className="px-4 py-3"><span className={inv.status==="paid"?"bg-green-50 text-green-700 text-xs px-2 py-0.5 rounded-full":"bg-amber-50 text-amber-700 text-xs px-2 py-0.5 rounded-full"}>{inv.status}</span></td><td className="px-4 py-3"><a href={`/api/admin/invoice/pdf?id=${inv.id}`} target="_blank" className="text-gold font-semibold text-xs hover:underline">Download PDF</a></td></tr>)}</tbody></table></div>
          </div>}

          {active==="Follow-ups" && data && <div className="bg-white rounded-lg border overflow-hidden"><table className="w-full text-sm"><thead className="bg-mist"><tr><th className="px-4 py-3">Client</th><th className="px-4 py-3">Step</th><th className="px-4 py-3">Due</th></tr></thead><tbody>{data.followUps?.map((f:FollowUp)=><tr key={f.id}><td className="px-4 py-3 font-medium">{f.client.name}</td><td className="px-4 py-3">{f.step}</td><td className="px-4 py-3 text-ink/60">{new Date(f.dueDate).toLocaleDateString()}</td></tr>)}</tbody></table></div>}

          {placeholders.includes(active) && <div className="rounded-lg border bg-white p-8 text-center"><p className="text-ink/50 text-lg">Coming Soon</p><p className="text-ink/40 text-sm mt-2">Database schema ready. Next phase build.</p></div>}

          {active==="Reports" && <div className="grid gap-5 md:grid-cols-3">{[["Total Clients",initialStats.clients],["Total Leads",initialStats.leads],["Contacts",initialStats.contacts],["Quote Requests",initialStats.quoteReqs],["Active Services",initialStats.services]].map(([l,v])=><div key={l} className="rounded-lg border bg-white p-5"><p className="text-sm text-ink/50">{l}</p><p className="text-3xl font-bold text-navy">{v as number}</p></div>)}</div>}
        </section>
      </div>
    </main>
  );
}
