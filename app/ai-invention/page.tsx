import {
  BadgeCheck,
  Bell,
  CalendarClock,
  FileSearch,
  Sparkles,
  Users
} from "lucide-react";
import { SectionHeading } from "@/components/SectionHeading";
import { CardTilt, GlowOrb } from "@/components/motion/MotionScenes";

export const metadata = {
  title: "AI Invention Partnership",
  robots: {
    index: false,
    follow: false,
    nocache: true
  }
};

const capabilities = [
  {
    icon: Users,
    title: "Client Tracking",
    copy: "Every case — company formation, visa, licensing, or attestation — lives in one live pipeline. No file falls through the cracks, no client waits on a status update the team can't answer immediately."
  },
  {
    icon: Bell,
    title: "Automated Follow-Ups",
    copy: "Renewal dates, missing documents, and pending government approvals trigger their own reminders — to the client and to the PRO officer — before a deadline becomes a problem."
  },
  {
    icon: FileSearch,
    title: "Document Processing",
    copy: "Incoming paperwork is checked, sorted, and matched to the right case automatically, cutting the manual review time PRO officers spend on intake and attestation prep."
  },
  {
    icon: CalendarClock,
    title: "Visa Workflow Automation",
    copy: "MOHRE and TAMM submissions follow a structured, repeatable workflow with built-in status checks, so applications move forward without daily manual chasing."
  }
];

const outcomes = [
  { value: "24/7", label: "Case visibility for every client file" },
  { value: "0", label: "Renewals missed due to manual tracking" },
  { value: "1", label: "System of record across the entire office" }
];

export default function AiInventionPage() {
  return (
    <main className="relative overflow-hidden bg-base">
      <GlowOrb />
      <section className="relative py-24">
        <div className="section-shell max-w-3xl">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-gold">AI Invention × Professional Business Services</p>
          <h1 className="font-heading text-4xl font-bold leading-tight text-heading md:text-5xl">
            Your PRO office, <span className="gold-gradient">powered by advanced operations technology.</span>
          </h1>
          <p className="mt-6 text-lg leading-8 text-body">
            A private briefing for Muhammad Waqas on the technology layer AI Invention has built to run behind Professional
            Business Services — the same client intake, tracking, and follow-up work the PRO team does today, carried out
            with less manual effort and fewer dropped details.
          </p>
        </div>
      </section>

      <section className="bg-panel py-20">
        <div className="section-shell">
          <SectionHeading eyebrow="The Technology" title="What Runs Behind the Scenes" copy="AI Invention's operations technology sits underneath the PRO office workflow, handling the repetitive coordination work so the team can focus on client relationships and government liaison." />
          <div className="mt-10 grid gap-5 md:grid-cols-2">
            {capabilities.map((item) => (
              <CardTilt key={item.title}>
                <item.icon className="h-8 w-8 text-gold" />
                <h3 className="mt-4 text-lg font-semibold leading-7 text-heading">{item.title}</h3>
                <p className="mt-2 text-sm leading-7 text-body">{item.copy}</p>
              </CardTilt>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="section-shell">
          <SectionHeading eyebrow="Why It Matters" title="Built for a Growing PRO Office" copy="As the caseload grows, the coordination work grows with it. This technology is designed to absorb that growth without adding headcount to the back office." />
          <div className="mt-10 grid gap-5 sm:grid-cols-3">
            {outcomes.map((stat) => (
              <div key={stat.label} className="glass-panel rounded-lg p-7 text-center shadow-soft">
                <p className="font-heading text-3xl font-bold text-gold">{stat.value}</p>
                <p className="mt-2 text-sm leading-6 text-body">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-panel py-20">
        <div className="section-shell">
          <div className="glass-panel flex flex-col items-start gap-6 rounded-lg p-10 shadow-soft md:flex-row md:items-center md:justify-between">
            <div className="max-w-xl">
              <div className="flex items-center gap-2 text-gold">
                <BadgeCheck className="h-5 w-5" />
                <p className="text-sm font-semibold uppercase tracking-[0.16em]">A Partnership Proposal</p>
              </div>
              <h2 className="mt-3 font-heading text-2xl font-semibold text-heading md:text-3xl">See It Running on a Real Case Load</h2>
              <p className="mt-3 leading-7 text-body">
                Faraz Gull would like to walk Muhammad Waqas through the system directly — how it tracks a live client file
                end to end, and how it plugs into the office's existing PRO workflow.
              </p>
            </div>
            <a
              href="mailto:farazgull.fg33@gmail.com?subject=AI%20Invention%20%E2%80%94%20Schedule%20a%20Demo"
              className="focus-ring inline-flex shrink-0 items-center gap-2 rounded-md bg-gold px-7 py-3.5 text-sm font-semibold text-navy shadow-gold transition hover:bg-gold-light"
            >
              <Sparkles className="h-4 w-4" />
              Schedule a Demo
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
