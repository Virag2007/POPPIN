import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { AppShell } from "@/components/layout/AppShell";

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
      <body className="font-sans antialiased bg-[#080914] text-[#F2F3F5] min-h-screen flex flex-col selection:bg-[#5865F2] selection:text-white">
        {/* WCAG 2.4.1: Bypass Blocks */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-[#5865F2] focus:text-white focus:rounded-xl focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#5865F2] focus:ring-offset-2"
        >
          Skip to main content
        </a>
        <AuthProvider>
          <AppShell>{children}</AppShell>
        </AuthProvider>
      </body>
    </html>
  );
}
