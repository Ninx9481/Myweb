import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Neon green accent for dark mode
        neon: {
          50:  "#f0fdf4",
          100: "#dcfce7",
          200: "#bbf7d0",
          300: "#86efac",
          400: "#4ade80",
          500: "#22c55e",
          600: "#16a34a",
          700: "#15803d",
          800: "#166534",
          900: "#14532d",
        },
        // Dark mode charcoal palette
        dark: {
          bg:      "#0a0a0a",
          surface: "#111111",
          card:    "#1a1a1a",
          border:  "#2a2a2a",
          hover:   "#222222",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        body:    ["var(--font-body)", "sans-serif"],
        mono:    ["var(--font-mono)", "monospace"],
      },
      animation: {
        "slide-in":    "slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        "fade-up":     "fadeUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
        "pulse-green": "pulseGreen 2s ease-in-out infinite",
        "shimmer":     "shimmer 1.5s infinite",
      },
      keyframes: {
        slideIn: {
          from: { transform: "translateX(-100%)", opacity: "0" },
          to:   { transform: "translateX(0)",     opacity: "1" },
        },
        fadeUp: {
          from: { transform: "translateY(16px)", opacity: "0" },
          to:   { transform: "translateY(0)",    opacity: "1" },
        },
        pulseGreen: {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(34, 197, 94, 0)" },
          "50%":      { boxShadow: "0 0 20px 4px rgba(34, 197, 94, 0.3)" },
        },
        shimmer: {
          "0%":   { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      backgroundImage: {
        "shimmer-gradient": "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.05) 50%, transparent 100%)",
      },
    },
  },
  plugins: [],
};
export default config;
