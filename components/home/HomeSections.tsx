"use client";

import { motion } from "framer-motion";
import { Bot, CheckCircle2, Cpu, LayoutDashboard, Lock, ShieldCheck, Sparkles, UploadCloud, Users2 } from "lucide-react";
import { aiTeam, dashboardModules, howItWorks, leadershipTeam, whyAiInvention } from "@/lib/company";

export function AITeamShowcase() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {aiTeam.map((agent, index) => (
        <motion.div
          key={agent.name}
          className="glass-panel rounded-lg p-5 shadow-soft"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ delay: (index % 4) * 0.06 }}
          whileHover={{ y: -4 }}
        >
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-gold/15 text-gold">
              <Bot size={22} />
            </span>
            <div>
              <h3 className="font-heading text-base font-semibold text-heading">{agent.name}</h3>
              <p className="text-xs font-semibold uppercase tracking-wide text-gold">{agent.badge}</p>
            </div>
          </div>
          <p className="mt-4 text-sm leading-6 text-body">{agent.expertise}</p>
        </motion.div>
      ))}
    </div>
  );
}

const stepIcons = [UploadCloud, Cpu, CheckCircle2];

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
        <span className="ml-3 flex items-center gap-2 text-xs font-semibold text-muted"><LayoutDashboard size={14} /> client-portal — preview</span>
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

const whyIcons = [Sparkles, Cpu, ShieldCheck, Lock];

export function WhyAiInvention() {
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      {whyAiInvention.map((item, index) => {
        const Icon = whyIcons[index];
        return (
          <motion.div
            key={item.title}
            className="glass-panel rounded-lg p-7 shadow-soft"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.08 }}
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-md bg-gold/15 text-gold"><Icon size={22} /></span>
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
        <h3 className="mt-4 font-heading text-lg font-semibold text-heading">+18 AI Agents</h3>
        <p className="text-sm text-body">Working around the clock alongside the leadership team.</p>
      </div>
    </div>
  );
}
