import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  href?: string;
  variant?: "primary" | "outline" | "ghost";
  children: ReactNode;
};

const styles = {
  primary: "bg-gold text-navy shadow-gold hover:bg-[#b7963f]",
  outline: "border border-edge bg-glass text-heading hover:border-gold hover:text-gold",
  ghost: "bg-transparent text-heading hover:bg-edge"
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
