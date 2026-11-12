import type { Metadata } from "next";
// Font imports removed to avoid external network calls during production build
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { Navbar } from "@/components/Navbar";

// Font imports removed for production build – using default system fonts

export const metadata: Metadata = {
  title: "Poppin. — The Social Identity & Community Platform",
  description: "Identity, profiles, connections, and social onboarding built with precision and playfulness.",
  icons: {
    icon: "/brand/poppin-logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-type="software">
      <head>
        <meta name="site-kind" content="software" />
        <meta name="page-type" content="software" />
      </head>
      <body className="font-sans antialiased bg-[var(--surface-ground)] text-slate-900 min-h-screen flex flex-col selection:bg-poppin-lilac selection:text-white">
        {/* WCAG 2.4.1: Bypass Blocks */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-poppin-navy focus:text-white focus:rounded-xl focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-poppin-lilac focus:ring-offset-2"
        >
          Skip to main content
        </a>
        <AuthProvider>
          <Navbar />
          <div className="flex-1 flex flex-col">{children}</div>
        </AuthProvider>
      </body>
    </html>
  );
}
