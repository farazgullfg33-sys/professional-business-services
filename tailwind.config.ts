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
        navy: "#1a3a5c",
        gold: "#ecb401",
        ink: "#1a1a2e",
        mist: "#f8fafc"
      },
      fontFamily: {
        sans: ["var(--font-poppins)", "Poppins", "sans-serif"]
      },
      boxShadow: {
        soft: "0 18px 50px rgba(26, 58, 92, 0.10)",
        gold: "0 18px 40px rgba(236, 180, 1, 0.20)"
      }
    }
  },
  plugins: []
};

export default config;
