"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  return (
    <button
      onClick={toggleTheme}
      aria-label="Toggle dark and light theme"
      className="focus-ring flex h-10 w-10 items-center justify-center rounded-full border border-edge bg-glass text-heading transition hover:border-gold/60 hover:text-gold"
    >
      {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
