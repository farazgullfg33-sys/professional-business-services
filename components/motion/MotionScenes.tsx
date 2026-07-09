"use client";

import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import type { ReactNode } from "react";
import { formatNumber } from "@/lib/utils";

export function StatsCounter({ value, suffix = "", label }: { value: number; suffix?: string; label: string }) {
  return (
    <motion.div className="text-center" initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
      <motion.span className="block font-heading text-3xl font-bold text-heading md:text-4xl">
        {formatNumber(value)}
        {suffix}
      </motion.span>
      <span className="mt-1 block text-sm font-medium text-muted">{label}</span>
    </motion.div>
  );
}

export function ServiceIconPulse({ children }: { children: ReactNode }) {
  return (
    <motion.div
      className="glass-panel group rounded-lg p-7 shadow-soft"
      whileHover={{ y: -6 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
    >
      {children}
    </motion.div>
  );
}

export function TimelineMotion() {
  const milestones = ["Established service desk", "Expanded visa operations", "100K+ visa transactions", "Full digital admin pipeline"];
  return (
    <div className="relative pl-8">
      <div className="absolute left-3 top-0 h-full w-px bg-gold/50" />
      {milestones.map((item, index) => (
        <motion.div
          key={item}
          className="glass-panel relative mb-8 rounded-lg p-5 shadow-soft"
          initial={{ opacity: 0, x: 24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: index * 0.08 }}
        >
          <span className="absolute -left-[34px] top-6 h-4 w-4 rounded-full border-4 border-base bg-gold shadow" />
          <p className="text-sm font-semibold text-gold">Milestone {index + 1}</p>
          <h3 className="mt-1 text-lg font-semibold text-heading">{item}</h3>
        </motion.div>
      ))}
    </div>
  );
}

export function MapPulse() {
  const points = [
    [520, 145],
    [455, 220],
    [590, 265],
    [405, 305]
  ];
  return (
    <div className="glass-panel relative min-h-[340px] overflow-hidden rounded-lg shadow-soft">
      <svg viewBox="0 0 760 420" className="h-full min-h-[340px] w-full">
        <path d="M388 72 C475 86 605 132 640 224 C672 308 590 366 480 354 C370 344 282 286 230 206 C190 145 267 62 388 72 Z" fill="var(--bg-panel)" stroke="var(--text-heading)" strokeWidth="3" />
        <path d="M270 270 C335 205 418 162 548 120" stroke="#c9a84c" strokeWidth="5" strokeLinecap="round" fill="none" opacity="0.55" />
        {points.map(([cx, cy], index) => (
          <g key={`${cx}-${cy}`}>
            <motion.circle cx={cx} cy={cy} r="8" fill="#c9a84c" animate={{ r: [8, 18, 8], opacity: [1, 0.2, 1] }} transition={{ repeat: Infinity, duration: 2.2, delay: index * 0.25 }} />
            <circle cx={cx} cy={cy} r="5" fill="var(--text-heading)" />
          </g>
        ))}
      </svg>
    </div>
  );
}

export function WaveBackground() {
  return (
    <svg className="block h-20 w-full" viewBox="0 0 1440 120" preserveAspectRatio="none" aria-hidden="true">
      <motion.path
        d="M0 70 C240 120 420 20 720 70 C960 110 1160 45 1440 76 L1440 120 L0 120 Z"
        fill="var(--bg-panel)"
        animate={{ d: ["M0 70 C240 120 420 20 720 70 C960 110 1160 45 1440 76 L1440 120 L0 120 Z", "M0 78 C260 30 440 112 720 65 C980 25 1180 112 1440 70 L1440 120 L0 120 Z"] }}
        transition={{ duration: 8, repeat: Infinity, repeatType: "reverse" }}
      />
    </svg>
  );
}

export function GlowOrb() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <motion.div className="absolute right-8 top-8 h-52 w-52 rounded-full bg-gold/20 blur-3xl" animate={{ y: [0, 24, 0], scale: [1, 1.08, 1] }} transition={{ duration: 8, repeat: Infinity }} />
      <motion.div className="absolute bottom-8 left-10 h-36 w-36 rounded-full bg-gold/10 blur-3xl" animate={{ y: [0, -18, 0], x: [0, 12, 0] }} transition={{ duration: 7, repeat: Infinity }} />
    </div>
  );
}

export function CardTilt({ children }: { children: ReactNode }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useSpring(useTransform(y, [-50, 50], [7, -7]), { stiffness: 180, damping: 18 });
  const rotateY = useSpring(useTransform(x, [-50, 50], [-7, 7]), { stiffness: 180, damping: 18 });
  return (
    <motion.div
      className="glass-panel h-full rounded-lg p-7 shadow-soft"
      style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
      onMouseMove={(event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        x.set(event.clientX - rect.left - rect.width / 2);
        y.set(event.clientY - rect.top - rect.height / 2);
      }}
      onMouseLeave={() => {
        x.set(0);
        y.set(0);
      }}
    >
      {children}
    </motion.div>
  );
}

export function BlogArt({ index, title }: { index: number; title: string }) {
  const hueShift = index * 18;
  return (
    <svg viewBox="0 0 800 400" className="h-full w-full rounded-t-lg" role="img" aria-label={title}>
      <rect width="800" height="400" fill="var(--bg-panel)" />
      <circle cx="650" cy="80" r="130" fill="#c9a84c" opacity="0.2" />
      <path d={`M${80 + hueShift} 300 L260 90 L420 260 L590 120 L720 310`} fill="none" stroke="var(--text-heading)" strokeWidth="18" strokeLinecap="round" strokeLinejoin="round" opacity="0.85" />
      <rect x="90" y="90" width="230" height="150" rx="12" fill="var(--bg-surface)" stroke="#c9a84c" strokeWidth="6" />
      <rect x="120" y="128" width="170" height="16" rx="8" fill="var(--text-heading)" opacity="0.75" />
      <rect x="120" y="166" width="120" height="16" rx="8" fill="#c9a84c" />
      <text x="90" y="340" fill="var(--text-heading)" fontSize="30" fontWeight="700">Professional Business Services</text>
    </svg>
  );
}
