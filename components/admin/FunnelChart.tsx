"use client";

import { useState } from "react";
import { motion } from "framer-motion";

export type FunnelStage = { label: string; count: number };

// Navy #1F3864 → Gold #c9a84c
const NAVY: [number, number, number] = [31, 56, 100];
const GOLD: [number, number, number] = [201, 168, 76];
const lerp = (a: number, b: number, t: number) => Math.round(a + (b - a) * t);
const stageColor = (t: number) => `rgb(${lerp(NAVY[0], GOLD[0], t)}, ${lerp(NAVY[1], GOLD[1], t)}, ${lerp(NAVY[2], GOLD[2], t)})`;
const pct = (n: number, d: number) => (d > 0 ? (n / d) * 100 : 0);

export function FunnelChart({ stages }: { stages: FunnelStage[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const top = stages[0]?.count ?? 0;
  const maxCount = Math.max(...stages.map((s) => s.count), 1);
  const last = stages[stages.length - 1]?.count ?? 0;
  const overall = pct(last, top);

  return (
    <div className="mt-2">
      {/* flowing-gradient keyframes (scoped by unique class) */}
      <style>{`@keyframes funnelFlow{0%{background-position:0% 50%}100%{background-position:200% 50%}}`}</style>

      <div className="space-y-1.5">
        {stages.map((s, i) => {
          const width = Math.max(14, pct(s.count, maxCount)); // min width so labels stay readable
          const prev = i === 0 ? s.count : stages[i - 1].count;
          const conv = i === 0 ? 100 : pct(s.count, prev);
          const dropoff = i === 0 ? 0 : 100 - conv;
          const c1 = stageColor(i / Math.max(1, stages.length - 1));
          const c2 = stageColor((i + 0.6) / Math.max(1, stages.length - 1));

          return (
            <div key={s.label}>
              <div className="relative flex justify-center">
                <motion.div
                  initial={{ width: "14%", opacity: 0 }}
                  animate={{ width: `${width}%`, opacity: 1 }}
                  transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: i * 0.06 }}
                  onMouseEnter={() => setHover(i)}
                  onMouseLeave={() => setHover(null)}
                  className="relative cursor-default overflow-hidden rounded-md"
                  style={{
                    background: `linear-gradient(90deg, ${c1}, ${c2}, ${c1})`,
                    backgroundSize: "200% 100%",
                    animation: "funnelFlow 6s linear infinite",
                    boxShadow: hover === i ? "0 0 0 1px rgba(201,168,76,0.6), 0 6px 20px rgba(0,0,0,0.35)" : "0 2px 8px rgba(0,0,0,0.25)",
                  }}
                >
                  {/* shimmer sweep */}
                  <motion.div
                    aria-hidden
                    className="pointer-events-none absolute inset-y-0 w-1/3"
                    style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent)" }}
                    initial={{ x: "-120%" }}
                    animate={{ x: "320%" }}
                    transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut", delay: i * 0.2 }}
                  />
                  <div className="relative flex items-center justify-between gap-3 px-3 py-2.5">
                    <span className="truncate text-xs font-semibold text-white drop-shadow-sm sm:text-sm">{s.label}</span>
                    <motion.span
                      key={s.count}
                      initial={{ scale: 1.25, opacity: 0.5 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.35 }}
                      className="shrink-0 rounded bg-black/25 px-2 py-0.5 text-xs font-bold text-white tabular-nums"
                    >
                      {s.count.toLocaleString()}
                    </motion.span>
                  </div>

                  {/* hover tooltip: conversion from previous stage */}
                  {hover === i && (
                    <motion.div
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="absolute left-1/2 top-full z-10 mt-1 -translate-x-1/2 whitespace-nowrap rounded-md border border-gold/40 bg-navy px-3 py-1.5 text-[11px] text-white shadow-soft"
                    >
                      <span className="font-semibold text-gold">{conv.toFixed(1)}%</span> of{" "}
                      {i === 0 ? "entry" : stages[i - 1].label}
                      {i > 0 && <span className="text-white/70"> · {dropoff.toFixed(1)}% drop-off</span>}
                    </motion.div>
                  )}
                </motion.div>
              </div>

              {/* drop-off connector between stages */}
              {i < stages.length - 1 && (
                <div className="flex items-center justify-center py-0.5">
                  <span className="text-[10px] font-medium text-muted">
                    ↓ {(100 - pct(stages[i + 1].count, s.count || 1)).toFixed(0)}% drop-off
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* conversion summary */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-edge bg-panel/60 px-4 py-3">
        <div>
          <p className="text-xs text-muted">Overall Conversion</p>
          <p className="font-heading text-2xl font-bold text-gold">{overall.toFixed(1)}%</p>
        </div>
        <p className="text-right text-xs text-muted">
          <span className="font-semibold text-heading">{top.toLocaleString()}</span> {stages[0]?.label ?? "Leads"}
          {" → "}
          <span className="font-semibold text-heading">{last.toLocaleString()}</span> {stages[stages.length - 1]?.label ?? "Closed"}
        </p>
      </div>
    </div>
  );
}
