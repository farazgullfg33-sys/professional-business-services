import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: "#0a1628",
          light: "#152238",
          dark: "#060f1c"
        },
        gold: {
          DEFAULT: "#c9a84c",
          light: "#d4b96a",
          dark: "#a88935"
        },
        ink: "#334155",
        mist: "#f8fafc",
        base: "var(--bg-base)",
        surface: "var(--bg-surface)",
        panel: "var(--bg-panel)",
        heading: "var(--text-heading)",
        body: "var(--text-body)",
        muted: "var(--text-muted)",
        edge: "var(--border-edge)",
        glass: "var(--glass-bg)"
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
        heading: ["var(--font-playfair)", "Playfair Display", "Georgia", "serif"]
      },
      boxShadow: {
        soft: "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
        card: "0 4px 6px rgba(0,0,0,0.04), 0 2px 4px rgba(0,0,0,0.04)",
        gold: "0 18px 40px rgba(201, 168, 76, 0.25)"
      }
    }
  },
  plugins: []
};

export default config;
