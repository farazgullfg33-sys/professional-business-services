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
        navy: "#0a1628",
        gold: "#c9a84c",
        ink: "#1a1a2e",
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
        sans: ["var(--font-plus-jakarta)", "Plus Jakarta Sans", "sans-serif"],
        heading: ["var(--font-inter)", "Inter", "sans-serif"]
      },
      boxShadow: {
        soft: "var(--shadow-soft)",
        gold: "0 18px 40px rgba(201, 168, 76, 0.25)"
      }
    }
  },
  plugins: []
};

export default config;
