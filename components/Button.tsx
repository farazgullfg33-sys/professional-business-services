"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type Props = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onAnimationStart" | "onAnimationEnd" | "onAnimationIteration" | "onDrag" | "onDragStart" | "onDragEnd"> & {
  href?: string;
  variant?: "primary" | "outline" | "ghost";
  children: ReactNode;
};

const styles = {
  primary: "bg-gold text-navy shadow-gold hover:bg-[#b7963f]",
  outline: "border border-edge bg-glass text-heading hover:border-gold hover:text-gold",
  ghost: "bg-transparent text-heading hover:bg-edge"
};

const MotionLink = motion(Link);

const hoverGlow = {
  primary: "0 16px 34px rgba(201, 168, 76, 0.45)",
  outline: "0 12px 26px rgba(201, 168, 76, 0.2)",
  ghost: "0 8px 20px rgba(201, 168, 76, 0.12)"
};

export function Button({ href, variant = "primary", className, children, ...props }: Props) {
  const classes = cn(
    "focus-ring relative inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-5 py-3 text-sm font-semibold transition-colors",
    styles[variant],
    className
  );

  const motionProps = {
    whileHover: { y: -2, boxShadow: hoverGlow[variant] },
    whileTap: { scale: 0.94 },
    transition: { type: "spring" as const, stiffness: 420, damping: 24 }
  };

  if (href) {
    return (
      <MotionLink className={classes} href={href} {...motionProps}>
        {children}
      </MotionLink>
    );
  }

  return (
    <motion.button className={classes} {...motionProps} {...props}>
      {children}
    </motion.button>
  );
}
