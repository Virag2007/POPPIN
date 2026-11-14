/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { NotificationDropdown } from "./NotificationDropdown";
import SearchModal from "@/components/SearchModal";
import {
  Search,
  Plus,
  Menu,
  User,
  Settings,
  LogOut,
} from "lucide-react";

interface AppTopbarProps {
  onOpenCreatePost: () => void;
  onToggleMobileSidebar: () => void;
}

export function AppTopbar({ onOpenCreatePost, onToggleMobileSidebar }: AppTopbarProps) {
  const { user, profile, logout, isLoading } = useAuth();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  // Global shortcut: Cmd+K (Mac) or Ctrl+K (Windows/Linux) to open Search Palette
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const displayHandle = profile?.username || (user?.email ? user.email.split("@")[0] : null);
  const displayName = profile?.displayName || profile?.username || (user?.email ? user.email.split("@")[0] : null);

  return (
    <>
      <header
        className="h-16 border-b border-white/10 bg-[#1E1F22]/95 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 gap-4 select-none text-[#F2F3F5]"
        role="banner"
      >
        {/* Left: Mobile Sidebar Trigger & Brand (on small viewports) */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onToggleMobileSidebar}
            className="md:hidden p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
            aria-label="Toggle navigation drawer"
          >
            <Menu className="w-5 h-5" />
          </button>

          <Link href="/feed" className="md:hidden flex items-center gap-1.5 font-heading text-base font-black text-white">
            POPPIN<span className="text-[#5865F2]">.</span>
          </Link>
        </div>

        {/* Center: Search Trigger (Cmd+K) */}
        <div className="flex-1 max-w-md hidden sm:block">
          <button
            type="button"
            onClick={() => setIsSearchOpen(true)}
            className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl bg-[#313338] hover:bg-[#383A40] border border-white/5 text-xs text-[#B5BAC1] hover:text-white transition shadow-sm"
          >
            <span className="flex items-center gap-2 truncate">
              <Search className="w-3.5 h-3.5 text-zinc-400" />
              <span>Search creators, communities, posts...</span>
            </span>
            <kbd className="hidden md:inline-flex items-center px-1.5 py-0.5 rounded bg-[#1E1F22] border border-white/10 font-mono text-[10px] text-zinc-400">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Right Actions: Create Post + Notification Popover + User Menu */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Mobile search icon trigger */}
          <button
            type="button"
            onClick={() => setIsSearchOpen(true)}
            className="sm:hidden p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5"
            aria-label="Search"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Create Post Button */}
          <button
            type="button"
            onClick={onOpenCreatePost}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#5865F2] hover:bg-[#4752C4] text-white active:scale-[0.98] transition-all shadow-md shadow-[#5865F2]/20"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2]" />
            <span className="hidden xs:inline">Create Post</span>
          </button>

          {/* Notification Bell Dropdown */}
          <NotificationDropdown />

          {/* User Avatar Menu Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsUserMenuOpen((prev) => !prev)}
              className="p-0.5 rounded-full border border-white/10 hover:border-[#5865F2] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5865F2]"
              aria-label="User Account Menu"
            >
              {profile?.avatar ? (
                <img
                  src={profile.avatar}
                  alt={profile.displayName || profile.username}
                  className="w-7 h-7 rounded-full object-cover"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-[#313338] text-[#8A9BFF] flex items-center justify-center font-bold text-xs">
                  {profile?.username?.charAt(0).toUpperCase() || <User className="w-3.5 h-3.5" />}
                </div>
              )}
            </button>

            {isUserMenuOpen && (
              <div
                className="absolute right-0 mt-2 w-48 rounded-xl bg-[#1E1F22] border border-white/10 shadow-2xl py-1 z-50 animate-in fade-in zoom-in-95 duration-100"
                onClick={() => setIsUserMenuOpen(false)}
              >
                <div className="px-3 py-2 border-b border-white/10">
                  <p className="text-xs font-bold text-white truncate">
                    {displayName || (isLoading ? "Loading..." : "Account")}
                  </p>
                  {displayHandle && (
                    <p className="text-[10px] text-zinc-400 truncate font-mono">
                      @{displayHandle}
                    </p>
                  )}
                </div>

                <Link
                  href="/profile"
                  className="flex items-center gap-2 px-3 py-2 text-xs text-[#B5BAC1] hover:bg-white/5 hover:text-white transition-colors"
                >
                  <User className="w-3.5 h-3.5 text-zinc-400" />
                  <span>My Profile</span>
                </Link>

                <Link
                  href="/settings"
                  className="flex items-center gap-2 px-3 py-2 text-xs text-[#B5BAC1] hover:bg-white/5 hover:text-white transition-colors"
                >
                  <Settings className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Account Settings</span>
                </Link>

                <div className="pt-1 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => logout()}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-400 hover:bg-rose-500/10 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5 text-rose-400" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Global Cmd+K Search Modal */}
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
}
