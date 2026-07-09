"use client";

import { motion } from "framer-motion";
import { CheckCircle2, ClipboardCheck, FileText, LayoutDashboard, Users2, UploadCloud } from "lucide-react";
import { dashboardModules, howItWorks, leadershipTeam, whyChooseUsReasons } from "@/lib/company";

const stepIcons = [UploadCloud, ClipboardCheck, CheckCircle2];
const whyIcons = [FileText, Users2, CheckCircle2];

export function HowItWorksFlow() {
  return (
    <div className="relative grid gap-6 md:grid-cols-3">
      <div className="pointer-events-none absolute left-0 right-0 top-10 hidden h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent md:block" />
      {howItWorks.map((item, index) => {
        const Icon = stepIcons[index];
        return (
          <motion.div
            key={item.step}
            className="glass-panel relative rounded-lg p-7 text-center shadow-soft"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.12 }}
          >
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gold/15 text-gold">
              <Icon size={28} />
            </span>
            <p className="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-gold">Step {item.step}</p>
            <h3 className="mt-2 font-heading text-xl font-semibold text-heading">{item.title}</h3>
            <p className="mt-3 text-sm leading-6 text-body">{item.description}</p>
          </motion.div>
        );
      })}
    </div>
  );
}

export function DashboardPreview() {
  return (
    <motion.div
      className="glass-panel overflow-hidden rounded-xl shadow-soft"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
    >
      <div className="flex items-center gap-2 border-b border-edge bg-panel px-5 py-3">
        <span className="h-3 w-3 rounded-full bg-red-400/70" />
        <span className="h-3 w-3 rounded-full bg-yellow-400/70" />
        <span className="h-3 w-3 rounded-full bg-green-400/70" />
        <span className="ml-3 flex items-center gap-2 text-xs font-semibold text-muted"><LayoutDashboard size={14} /> client-portal</span>
      </div>
      <div className="grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-4">
        {dashboardModules.map((module) => (
          <div key={module.label} className="rounded-lg border border-edge bg-base/40 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted">{module.label}</p>
            <p className="mt-2 font-heading text-2xl font-bold text-heading">{module.value}</p>
            <p className="mt-1 text-xs font-semibold text-gold">{module.trend} this month</p>
          </div>
        ))}
      </div>
      <div className="space-y-2 px-6 pb-6">
        {["New client intake — trade license renewal", "Visa file moved to Government Submission", "Invoice generated for AK Trading LLC"].map((row) => (
          <div key={row} className="flex items-center justify-between rounded-md border border-edge bg-base/30 px-4 py-3 text-sm text-body">
            <span>{row}</span>
            <CheckCircle2 size={16} className="text-gold" />
          </div>
        ))}
      </div>
    </motion.div>
  );
}

export function WhyChooseUs() {
  return (
    <div className="grid gap-5 sm:grid-cols-3">
      {whyChooseUsReasons.map((item, index) => {
        const Icon = whyIcons[index % whyIcons.length];
        return (
          <motion.div
            key={item.title}
            className="glass-panel rounded-lg p-7 text-center shadow-soft"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.08 }}
          >
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gold/15 text-gold"><Icon size={22} /></span>
            <h3 className="mt-4 font-heading text-lg font-semibold text-heading">{item.title}</h3>
            <p className="mt-2 text-sm leading-6 text-body">{item.description}</p>
          </motion.div>
        );
      })}
    </div>
  );
}

export function LeadershipTeam() {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {leadershipTeam.map((person) => (
        <div key={person.name} className="glass-panel rounded-lg p-7 text-center shadow-soft">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gold/15 font-heading text-2xl font-bold text-gold">
            {person.name.split(" ").map((part) => part[0]).slice(0, 2).join("")}
          </div>
          <h3 className="mt-4 font-heading text-lg font-semibold text-heading">{person.name}</h3>
          <p className="text-sm font-semibold text-gold">{person.role}</p>
        </div>
      ))}
      <div className="glass-panel rounded-lg p-7 text-center shadow-soft">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gold/15 text-gold">
          <Users2 size={32} />
        </div>
        <h3 className="mt-4 font-heading text-lg font-semibold text-heading">12 Professional Staff</h3>
        <p className="text-sm text-body">Experienced PRO officers handling 50+ active files every month.</p>
      </div>
    </div>
  );
}
