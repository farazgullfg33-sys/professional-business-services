"use client";

import { useMemo, useState } from "react";
import { signOut } from "next-auth/react";
import {
  BarChart3,
  CalendarDays,
  CheckSquare,
  ClipboardList,
  FileArchive,
  FileBadge,
  FileText,
  FolderOpen,
  LayoutDashboard,
  LogOut,
  MessageSquareText,
  ReceiptText,
  RefreshCcw,
  ShieldCheck,
  UserCog,
  UsersRound
} from "lucide-react";
import { Button } from "@/components/Button";
import { cn } from "@/lib/utils";

type Props = {
  stats: {
    clients: number;
    leads: number;
    contacts: number;
    quotes: number;
    services: number;
  };
  role?: string;
};

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

export function AdminPanel({ stats, role = "staff" }: Props) {
  const [active, setActive] = useState("Dashboard");
  const activeModule = useMemo(() => modules.find((module) => module.name === active) ?? modules[0], [active]);
  return (
    <main className="min-h-screen bg-mist">
      <div className="grid lg:grid-cols-[280px_1fr]">
        <aside className="border-r border-navy/10 bg-white p-5">
          <h1 className="text-xl font-bold leading-tight text-navy">Professional Business Services Admin</h1>
          <p className="mt-2 text-sm text-ink/55">Role: {role}</p>
          <nav className="mt-7 grid gap-1">
            {modules.map((module) => {
              const Icon = module.icon;
              return (
                <button
                  key={module.name}
                  className={cn("flex items-center gap-3 rounded-md px-3 py-2 text-left text-sm font-semibold transition", active === module.name ? "bg-gold text-navy" : "text-ink/65 hover:bg-mist hover:text-navy")}
                  onClick={() => setActive(module.name)}
                >
                  <Icon size={17} /> {module.name}
                </button>
              );
            })}
          </nav>
        </aside>
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

          <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-5">
            {[
              ["Clients", stats.clients],
              ["Services", stats.services],
              ["Leads", stats.leads],
              ["Contacts", stats.contacts],
              ["Quotes", stats.quotes]
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg border border-navy/10 bg-white p-5 shadow-sm">
                <p className="text-sm font-semibold text-ink/55">{label}</p>
                <p className="mt-2 text-3xl font-bold text-navy">{value}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 grid gap-6 xl:grid-cols-[1fr_340px]">
            <div className="rounded-lg border border-navy/10 bg-white p-6 shadow-sm">
              <h3 className="text-xl font-semibold text-navy">{activeModule.name} Workspace</h3>
              <div className="mt-5 grid gap-4 md:grid-cols-3">
                {["New", "Assigned", "In Progress", "Under Review", "Completed", "Delivered"].map((status, index) => (
                  <div key={status} className="min-h-28 rounded-md border border-navy/10 bg-mist p-4">
                    <p className="text-sm font-semibold text-navy">{status}</p>
                    <p className="mt-3 text-xs leading-5 text-ink/60">{index + 1} demo items ready for database-backed workflow extension.</p>
                  </div>
                ))}
              </div>
              <div className="mt-6 overflow-hidden rounded-md border border-navy/10">
                <table className="w-full text-left text-sm">
                  <thead className="bg-mist text-navy">
                    <tr><th className="px-4 py-3">Client</th><th className="px-4 py-3">Service</th><th className="px-4 py-3">PRO</th><th className="px-4 py-3">Deadline</th></tr>
                  </thead>
                  <tbody className="divide-y divide-navy/10">
                    {["AK Trading LLC", "Gulf Tech Partners", "Nuaimi Consulting"].map((client, index) => (
                      <tr key={client}><td className="px-4 py-3">{client}</td><td className="px-4 py-3">Trade License Renewal</td><td className="px-4 py-3">PRO Specialist</td><td className="px-4 py-3">{7 + index * 5} days</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <aside className="space-y-6">
              <div className="rounded-lg border border-navy/10 bg-white p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-navy">Quick Links Sidebar</h3>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  {links.map((link, index) => <a key={link} href={urls[index]} target="_blank" rel="noreferrer" className="rounded-md border border-navy/10 px-3 py-2 text-sm font-semibold text-navy hover:border-gold">{link}</a>)}
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
        </section>
      </div>
    </main>
  );
}
