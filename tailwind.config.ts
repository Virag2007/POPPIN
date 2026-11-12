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
          navy: "#0F172A", // Deep slate
          "navy-light": "#1E293B",
          // Standard timeless high-contrast brand accent (Classic Electric Royal Blue)
          lilac: "#2563EB", 
          "lilac-hover": "#1D4ED8",
          "lilac-light": "#EFF6FF",
          "lilac-border": "#BFDBFE",
          brand: "#2563EB",
          "brand-hover": "#1D4ED8",
          "brand-light": "#EFF6FF",
          "brand-border": "#BFDBFE",
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


