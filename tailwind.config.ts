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
          ember: "#ea580c",           // Upvote Orange 600
          "ember-light": "#fff7ed",   // Orange 50
        },
      },
      fontFamily: {
        sans: ["var(--font-jakarta)", "system-ui", "-apple-system", "sans-serif"],
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
