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
        canvas: "#080914",
        blurple: {
          DEFAULT: "#5865F2",
          deep: "#4752C4",
          light: "#7983F5",
          hover: "#4752C4",
        },
        dark: {
          bg: "#080914",
          surface: "#1E1F22",
          elevated: "#313338",
          hover: "#2B2D31",
          border: "#2B2D31",
          "border-subtle": "rgba(255, 255, 255, 0.08)",
          "border-strong": "rgba(255, 255, 255, 0.16)",
        },
        content: {
          primary: "#F2F3F5",
          secondary: "#B5BAC1",
          muted: "#949BA4",
        },
        surface: {
          DEFAULT: "#1E1F22",
          subtle: "#313338",
          hover: "#2B2D31",
        },
        poppin: {
          navy: "#080914",
          "navy-light": "#1E1F22",
          lilac: "#5865F2",
          "lilac-hover": "#4752C4",
          "lilac-light": "#7983F5",
          "lilac-border": "rgba(255, 255, 255, 0.12)",
          brand: "#5865F2",
          "brand-hover": "#4752C4",
          "brand-light": "#7983F5",
          "brand-border": "rgba(255, 255, 255, 0.12)",
          ember: "#5865F2",
          "ember-light": "#7983F5",
        },
        reddit: {
          orange: "#5865F2",
          upvote: "#5865F2",
          downvote: "#949BA4",
          bg: "#080914",
          card: "#1E1F22",
          border: "rgba(255, 255, 255, 0.08)",
          hover: "#313338",
          text: "#F2F3F5",
          muted: "#B5BAC1",
        },
      },
      fontFamily: {
        sans: [
          "'Plus Jakarta Sans'",
          "var(--font-jakarta)",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "'Segoe UI'",
          "Roboto",
          "sans-serif",
        ],
        display: [
          "'Unbounded'",
          "var(--font-unbounded)",
          "system-ui",
          "sans-serif",
        ],
        heading: [
          "'Unbounded'",
          "var(--font-unbounded)",
          "system-ui",
          "sans-serif",
        ],
      },
      borderRadius: {
        "xl": "12px",
        "2xl": "16px",
        "3xl": "24px",
      },
    },
  },
  plugins: [],
} satisfies Config;
