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
          navy: "#0E1027",
          "navy-light": "#1B1E3D",
          lilac: "#9D54F2",
          "lilac-hover": "#8B3EEB",
          "lilac-light": "#F6F1FF",
          "lilac-border": "#E2D3FF",
        },
      },
      fontFamily: {
        sans: ["var(--font-jakarta)", "sans-serif"],
        display: ["var(--font-unbounded)", "sans-serif"],
      },
      borderRadius: {
        "2xl": "16px",
        "3xl": "24px",
      },
    },
  },
  plugins: [],
} satisfies Config;


