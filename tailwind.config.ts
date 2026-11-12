import type { Config } from "tailwindcss";

export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        poppin: {
          navy: "#0f172a",          // Slate 900
          "navy-light": "#1e293b",    // Slate 800
          lilac: "#2563eb",           // Crisp Blue 600
          "lilac-hover": "#1d4ed8",   // Blue 700
          "lilac-light": "#eff6ff",   // Blue 50
          "lilac-border": "#bfdbfe",  // Blue 200
          brand: "#2563eb",
          "brand-hover": "#1d4ed8",
          "brand-light": "#eff6ff",
          "brand-border": "#bfdbfe",
          ember: "#ea580c",           // Upvote Orange 600
          "ember-light": "#fff7ed",   // Orange 50
        },
        reddit: {
          orange: "#FF4500",
          upvote: "#FF4500",
          downvote: "#6366F1",
          bg: "#F1F5F9",
          card: "#FFFFFF",
          border: "#E2E8F0",
          hover: "#F8FAFC",
          text: "#0F172A",
          muted: "#64748B",
        },
      },
      fontFamily: {
        sans: ["var(--font-jakarta)", "system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        display: ["var(--font-unbounded)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        "2xl": "16px",
        "3xl": "24px",
      },
    },
  },
  plugins: [],
} satisfies Config;
