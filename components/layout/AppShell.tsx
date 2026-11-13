"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { AppSidebar } from "./AppSidebar";
import { AppTopbar } from "./AppTopbar";
import { CreatePostModal } from "./CreatePostModal";
import { Home, Layers, MessageSquare, User, X } from "lucide-react";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);

  // Check if current page belongs to the public unauthenticated shell
  const isPublicRoute =
    pathname === "/" ||
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/forgot-password" ||
    pathname === "/reset-password";

  // If on a public route, render the public shell
  if (isPublicRoute) {
    if (pathname === "/") {
      return <main className="min-h-screen flex flex-col">{children}</main>;
    }
    return (
      <div className="min-h-screen flex flex-col bg-[#080914] text-[#F2F3F5]">
        <main className="flex-1 flex flex-col">{children}</main>
      </div>
    );
  }

  // Authenticated Shell (Discord-inspired interior palette)
  return (
    <div className="min-h-screen flex bg-[#313338] text-[#F2F3F5] antialiased">
      {/* 1. Persistent Desktop Sidebar (md: 768px+) */}
      <div className="hidden md:block shrink-0 sticky top-0 h-screen z-40">
        <AppSidebar onOpenCreatePost={() => setIsCreatePostOpen(true)} />
      </div>

      {/* 2. Mobile Drawer Sidebar (viewports < 768px) */}
      {isMobileSidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
          {/* Drawer */}
          <div className="relative w-72 max-w-[80vw] bg-[#1E1F22] border-r border-white/10 h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-200">
            <button
              type="button"
              onClick={() => setIsMobileSidebarOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10"
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5" />
            </button>
            <AppSidebar
              className="w-full border-r-0"
              onNavigate={() => setIsMobileSidebarOpen(false)}
              onOpenCreatePost={() => {
                setIsMobileSidebarOpen(false);
                setIsCreatePostOpen(true);
              }}
            />
          </div>
        </div>
      )}

      {/* 3. Main Content Column */}
      <div className="flex-1 flex flex-col min-w-0 pb-16 md:pb-0">
        {/* Top Application Bar */}
        <AppTopbar
          onOpenCreatePost={() => setIsCreatePostOpen(true)}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen((prev) => !prev)}
        />

        {/* Page Content Body */}
        <main className="flex-1 overflow-x-hidden">{children}</main>
      </div>

      {/* 4. Mobile Bottom Navigation Bar (viewports < 768px) */}
      <nav
        aria-label="Mobile Navigation"
        className="md:hidden fixed bottom-0 inset-x-0 h-16 bg-[#1E1F22]/95 backdrop-blur-md border-t border-white/10 z-30 flex items-center justify-around px-2 select-none"
      >
        <Link
          href="/feed"
          className={`flex flex-col items-center gap-1 p-2 rounded-lg text-[10px] font-semibold transition-colors ${
            pathname === "/feed" ? "text-[#5865F2]" : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <Home className="w-4 h-4" />
          <span>Home</span>
        </Link>

        <Link
          href="/communities"
          className={`flex flex-col items-center gap-1 p-2 rounded-lg text-[10px] font-semibold transition-colors ${
            pathname.startsWith("/communities") ? "text-[#5865F2]" : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Communities</span>
        </Link>

        <Link
          href="/messages"
          className={`flex flex-col items-center gap-1 p-2 rounded-lg text-[10px] font-semibold transition-colors ${
            pathname.startsWith("/messages") ? "text-[#5865F2]" : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Messages</span>
        </Link>

        <Link
          href="/profile"
          className={`flex flex-col items-center gap-1 p-2 rounded-lg text-[10px] font-semibold transition-colors ${
            pathname === "/profile" ? "text-[#5865F2]" : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <User className="w-4 h-4" />
          <span>Profile</span>
        </Link>
      </nav>

      {/* Global Post Creation Modal */}
      <CreatePostModal
        isOpen={isCreatePostOpen}
        onClose={() => setIsCreatePostOpen(false)}
        onPostCreated={() => {
          if (typeof window !== "undefined") {
            window.location.reload();
          }
        }}
      />
    </div>
  );
}
