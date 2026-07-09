"use client";

import { AnimatePresence, animate, motion, useInView, useMotionValue, useScroll, useSpring, useTransform } from "framer-motion";
import { ChevronDown, Quote } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn, formatNumber } from "@/lib/utils";

export function Reveal({
  children,
  className,
  delay = 0,
  y = 22,
  x = 0,
  as = "div"
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  x?: number;
  as?: "div" | "li";
}) {
  const MotionTag = as === "li" ? motion.li : motion.div;
  return (
    <MotionTag
      className={className}
      initial={{ opacity: 0, y, x }}
      whileInView={{ opacity: 1, y: 0, x: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </MotionTag>
  );
}

export function StatsCounter({ value, suffix = "", label }: { value: number; suffix?: string; label: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const controls = animate(0, value, {
      duration: 1.6,
      ease: "easeOut",
      onUpdate: (latest) => setDisplay(Math.round(latest))
    });
    return () => controls.stop();
  }, [inView, value]);

  return (
    <motion.div className="text-center" initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
      <span ref={ref} className="block font-heading text-3xl font-bold text-heading md:text-4xl">
        {formatNumber(display)}
        {suffix}
      </span>
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
      <motion.div className="absolute left-1/3 top-1/2 h-3 w-3 rounded-full bg-gold/70" animate={{ y: [0, -30, 0], opacity: [0.7, 0.15, 0.7] }} transition={{ duration: 6, repeat: Infinity, delay: 0.4 }} />
      <motion.div className="absolute right-1/4 top-1/4 h-2 w-2 rounded-full bg-gold/60" animate={{ y: [0, 22, 0], opacity: [0.6, 0.1, 0.6] }} transition={{ duration: 5, repeat: Infinity, delay: 1.1 }} />
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
      className="glass-panel group h-full rounded-lg p-7 shadow-soft transition-shadow duration-300 hover:shadow-gold"
      style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      whileHover={{ scale: 1.02 }}
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

export function TypingText({ text, className, startDelay = 0 }: { text: string; className?: string; startDelay?: number }) {
  const [display, setDisplay] = useState("");

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
      setDisplay(text);
      return;
    }
    let index = 0;
    let intervalId: ReturnType<typeof setInterval>;
    const timeoutId = setTimeout(() => {
      intervalId = setInterval(() => {
        index += 1;
        setDisplay(text.slice(0, index));
        if (index >= text.length) clearInterval(intervalId);
      }, 70);
    }, startDelay);
    return () => {
      clearTimeout(timeoutId);
      clearInterval(intervalId);
    };
  }, [text, startDelay]);

  return (
    <span className={className}>
      {display}
      <motion.span
        className="ml-0.5 inline-block h-[0.85em] w-[2px] translate-y-[0.1em] bg-gold align-middle"
        animate={{ opacity: [1, 1, 0, 0] }}
        transition={{ duration: 0.9, repeat: Infinity, times: [0, 0.5, 0.5, 1] }}
        aria-hidden="true"
      />
    </span>
  );
}

export function ScrollCue() {
  return (
    <motion.div
      className="pointer-events-none absolute bottom-6 left-1/2 z-10 -translate-x-1/2 text-gold/70"
      animate={{ y: [0, 10, 0] }}
      transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
      aria-hidden="true"
    >
      <ChevronDown size={26} />
    </motion.div>
  );
}

export function ParallaxWrap({ children, offset = 36, className }: { children: ReactNode; offset?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [-offset, offset]);
  return (
    <div ref={ref} className={className}>
      <motion.div style={{ y }}>{children}</motion.div>
    </div>
  );
}

type Testimonial = { name: string; company: string; text: string };

export function TestimonialCarousel({ items }: { items: Testimonial[] }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setIndex((value) => (value + 1) % items.length), 5500);
    return () => clearInterval(id);
  }, [items.length]);

  const active = items[index];

  return (
    <div className="glass-panel relative overflow-hidden rounded-xl p-8 shadow-soft sm:p-10">
      <Quote className="h-9 w-9 text-gold/50" />
      <div className="mt-4 min-h-[168px] sm:min-h-[128px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={active.name}
            initial={{ opacity: 0, x: 28 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -28 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="text-lg leading-8 text-body sm:text-xl">&ldquo;{active.text}&rdquo;</p>
            <p className="mt-6 font-heading text-base font-semibold text-heading">{active.name}</p>
            <p className="text-sm text-gold">{active.company}</p>
          </motion.div>
        </AnimatePresence>
      </div>
      <div className="mt-8 flex gap-2">
        {items.map((item, itemIndex) => (
          <button
            key={item.name}
            type="button"
            aria-label={`Show testimonial from ${item.name}`}
            className={cn("h-2 rounded-full transition-all duration-300", itemIndex === index ? "w-8 bg-gold" : "w-2 bg-edge hover:bg-gold/50")}
            onClick={() => setIndex(itemIndex)}
          />
        ))}
      </div>
    </div>
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
