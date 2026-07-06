"use client";

import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import type { ReactNode } from "react";
import { formatNumber } from "@/lib/utils";

export function HeroMotion() {
  const particles = Array.from({ length: 28 });
  return (
    <div className="relative min-h-[380px] overflow-hidden rounded-none bg-gradient-to-br from-white via-[#f9fbff] to-[#fff7d8]">
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 900 430" role="img" aria-label="Animated UAE skyline">
        <defs>
          <linearGradient id="heroGold" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ecb401" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#1a3a5c" stopOpacity="0.18" />
          </linearGradient>
        </defs>
        <path d="M0 315 C150 260 270 350 430 290 C590 230 690 310 900 250 L900 430 L0 430 Z" fill="url(#heroGold)" opacity="0.24" />
        <motion.g initial={{ y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 1 }}>
          <rect x="60" y="230" width="74" height="170" fill="#1a3a5c" rx="3" />
          <rect x="160" y="180" width="52" height="220" fill="#254d74" rx="4" />
          <path d="M260 400 L290 120 L320 400 Z" fill="#1a3a5c" />
          <rect x="360" y="150" width="86" height="250" fill="#315e86" rx="5" />
          <rect x="478" y="95" width="54" height="305" fill="#1a3a5c" rx="8" />
          <path d="M585 400 C560 285 602 210 620 120 C638 210 680 285 655 400 Z" fill="#254d74" />
          <rect x="710" y="205" width="92" height="195" fill="#1a3a5c" rx="5" />
        </motion.g>
        <path d="M42 400 H850" stroke="#ecb401" strokeWidth="3" opacity="0.8" />
      </svg>
      {particles.map((_, index) => (
        <motion.span
          key={index}
          className="absolute h-1.5 w-1.5 rounded-full bg-gold"
          style={{ left: `${8 + ((index * 17) % 84)}%`, bottom: `${12 + (index % 5) * 8}%` }}
          animate={{ y: [-8, -90], opacity: [0, 0.75, 0] }}
          transition={{ duration: 3 + (index % 4), repeat: Infinity, delay: index * 0.18 }}
        />
      ))}
    </div>
  );
}

export function StatsCounter({ value, suffix = "", label }: { value: number; suffix?: string; label: string }) {
  return (
    <motion.div className="text-center" initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
      <motion.span className="block text-3xl font-bold text-navy md:text-4xl">
        {formatNumber(value)}
        {suffix}
      </motion.span>
      <span className="mt-1 block text-sm font-medium text-ink/60">{label}</span>
    </motion.div>
  );
}

export function ServiceIconPulse({ children }: { children: ReactNode }) {
  return (
    <motion.div
      className="group rounded-lg border border-navy/10 bg-white p-7 shadow-soft"
      whileHover={{ y: -6 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
    >
      {children}
    </motion.div>
  );
}

export function TimelineMotion() {
  const milestones = ["Established service desk", "Expanded visa operations", "100K+ visa transactions", "Full admin pipeline"];
  return (
    <div className="relative pl-8">
      <div className="absolute left-3 top-0 h-full w-px bg-gold/50" />
      {milestones.map((item, index) => (
        <motion.div
          key={item}
          className="relative mb-8 rounded-lg border border-navy/10 bg-white p-5 shadow-soft"
          initial={{ opacity: 0, x: 24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: index * 0.08 }}
        >
          <span className="absolute -left-[34px] top-6 h-4 w-4 rounded-full border-4 border-white bg-gold shadow" />
          <p className="text-sm font-semibold text-gold">Milestone {index + 1}</p>
          <h3 className="mt-1 text-lg font-semibold text-navy">{item}</h3>
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
    <div className="relative min-h-[340px] overflow-hidden rounded-lg bg-white shadow-soft">
      <svg viewBox="0 0 760 420" className="h-full min-h-[340px] w-full">
        <path d="M388 72 C475 86 605 132 640 224 C672 308 590 366 480 354 C370 344 282 286 230 206 C190 145 267 62 388 72 Z" fill="#f8fafc" stroke="#1a3a5c" strokeWidth="3" />
        <path d="M270 270 C335 205 418 162 548 120" stroke="#ecb401" strokeWidth="5" strokeLinecap="round" fill="none" opacity="0.55" />
        {points.map(([cx, cy], index) => (
          <g key={`${cx}-${cy}`}>
            <motion.circle cx={cx} cy={cy} r="8" fill="#ecb401" animate={{ r: [8, 18, 8], opacity: [1, 0.2, 1] }} transition={{ repeat: Infinity, duration: 2.2, delay: index * 0.25 }} />
            <circle cx={cx} cy={cy} r="5" fill="#1a3a5c" />
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
        fill="#f8fafc"
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
      <motion.div className="absolute bottom-8 left-10 h-36 w-36 rounded-full bg-navy/10 blur-3xl" animate={{ y: [0, -18, 0], x: [0, 12, 0] }} transition={{ duration: 7, repeat: Infinity }} />
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
      className="h-full rounded-lg border border-navy/10 bg-white p-7 shadow-soft"
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
    <svg viewBox="0 0 800 400" className="h-full w-full rounded-t-lg bg-white" role="img" aria-label={title}>
      <rect width="800" height="400" fill="#f8fafc" />
      <circle cx="650" cy="80" r="130" fill="#ecb401" opacity="0.2" />
      <path d={`M${80 + hueShift} 300 L260 90 L420 260 L590 120 L720 310`} fill="none" stroke="#1a3a5c" strokeWidth="18" strokeLinecap="round" strokeLinejoin="round" opacity="0.85" />
      <rect x="90" y="90" width="230" height="150" rx="12" fill="#ffffff" stroke="#ecb401" strokeWidth="6" />
      <rect x="120" y="128" width="170" height="16" rx="8" fill="#1a3a5c" opacity="0.75" />
      <rect x="120" y="166" width="120" height="16" rx="8" fill="#ecb401" />
      <text x="90" y="340" fill="#1a3a5c" fontSize="30" fontWeight="700">Professional Business Services</text>
    </svg>
  );
}
