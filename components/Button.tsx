import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  href?: string;
  variant?: "primary" | "outline" | "ghost";
  children: ReactNode;
};

const styles = {
  primary: "bg-gold text-navy shadow-gold hover:bg-[#dba700]",
  outline: "border border-navy/20 bg-white text-navy hover:border-gold hover:text-navy",
  ghost: "bg-transparent text-navy hover:bg-navy/5"
};

export function Button({ href, variant = "primary", className, children, ...props }: Props) {
  const classes = cn(
    "focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-5 py-3 text-sm font-semibold transition",
    styles[variant],
    className
  );

  if (href) {
    return (
      <Link className={classes} href={href}>
        {children}
      </Link>
    );
  }

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
}
