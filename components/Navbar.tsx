/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import SearchModal from "@/components/SearchModal";
import {
  User,
  Settings,
  LogOut,
  Sparkles,
  Compass,
  Layers,
  MessageSquare,
  Bell,
  Search,
  Menu,
  X,
} from "lucide-react";

export function Navbar() {
  const { user, profile, logout } = useAuth();
  const pathname = usePathname();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Global Ctrl+K / Cmd+K shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const navLinks = [
    { href: "/feed", label: "Feed", icon: Compass },
    { href: "/explore", label: "Explore", icon: Sparkles },
    { href: "/communities", label: "Communities", icon: Layers },
    { href: "/messages", label: "Messages", icon: MessageSquare, badge: 1 },
    { href: "/notifications", label: "Notifications", icon: Bell, badge: 2 },
  ];

  return (
    <>
      <header
        role="banner"
        className="border-b border-slate-200/80 bg-white/90 backdrop-blur-md sticky top-0 z-40 transition-shadow"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Brand Logo & Status */}
          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/"
              className="flex items-center gap-2 group focus-visible:outline focus-visible:outline-2 focus-visible:outline-poppin-lilac rounded-xl p-1"
              aria-label="Poppin Home"
            >
              <div className="relative h-10 w-28 transition-transform group-hover:scale-105 duration-200">
                <Image
                  src="/brand/poppin-logo.png"
                  alt="Poppin."
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            </Link>

            <span
              role="status"
              className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-xs"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live
            </span>
          </div>

          {/* Search Bar Trigger - only for authenticated members */}
          {user && (
            <button
              onClick={() => setIsSearchOpen(true)}
              className="flex-1 max-w-xs md:max-w-md hidden sm:flex items-center justify-between px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200/80 border border-transparent hover:border-slate-300 text-xs text-slate-500 transition shadow-2xs"
            >
              <span className="flex items-center gap-2 truncate">
                <Search className="w-3.5 h-3.5 text-slate-400" />
                <span>Search creators, hubs, topics...</span>
              </span>
              <kbd className="hidden md:inline-flex items-center px-1.5 py-0.5 rounded bg-white border border-slate-200 font-mono text-[10px] text-slate-400 shadow-2xs">
                ⌘K
              </kbd>
            </button>
          )}

          {/* Desktop Navigation Links */}
          <nav
            aria-label="Main Navigation"
            className="hidden md:flex items-center gap-1 lg:gap-2"
          >
            {user ? (
              <>
                {navLinks.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`min-h-[40px] px-3 py-2 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 relative ${
                        isActive
                          ? "bg-poppin-lilac-light text-poppin-lilac border border-poppin-lilac-border font-bold"
                          : "text-slate-600 hover:text-poppin-navy hover:bg-slate-100"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                      {item.badge && item.badge > 0 && (
                        <span className="w-4 h-4 rounded-full bg-poppin-lilac text-white text-[9px] font-bold flex items-center justify-center -ml-0.5">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}

                {/* Profile Pill */}
                <Link
                  href="/profile"
                  className={`min-h-[40px] inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-xl transition-all ml-1 ${
                    pathname === "/profile"
                      ? "bg-poppin-navy text-white shadow-xs"
                      : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  {profile?.avatar ? (
                    <img
                      src={profile.avatar}
                      alt={profile.displayName || profile.username}
                      className="w-6 h-6 rounded-lg object-cover ring-1 ring-white"
                    />
                  ) : (
                    <User className="w-4 h-4 text-poppin-lilac" />
                  )}
                  <span className="max-w-[100px] truncate font-bold">
                    {profile?.displayName || profile?.username || "You"}
                  </span>
                </Link>

                {/* Settings */}
                <Link
                  href="/settings"
                  className={`min-h-[40px] min-w-[40px] inline-flex items-center justify-center p-2 rounded-xl transition-all ${
                    pathname === "/settings"
                      ? "bg-poppin-lilac-light text-poppin-lilac"
                      : "text-slate-500 hover:text-poppin-navy hover:bg-slate-100"
                  }`}
                  aria-label="Settings"
                  title="Settings"
                >
                  <Settings className="w-4 h-4" />
                </Link>

                {/* Log out */}
                <button
                  type="button"
                  onClick={() => logout()}
                  className="min-h-[40px] min-w-[40px] inline-flex items-center justify-center p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                  aria-label="Log Out"
                  title="Log Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="min-h-[40px] inline-flex items-center justify-center px-4 py-2 text-xs font-semibold text-slate-700 hover:text-poppin-navy hover:bg-slate-100 rounded-xl transition-all"
                >
                  Sign in
                </Link>
                <Link
                  href="/register"
                  className="min-h-[40px] inline-flex items-center gap-1.5 justify-center px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-xs transition-all active:scale-95"
                >
                  <Sparkles className="w-3.5 h-3.5 text-poppin-lilac" />
                  <span>Join POPPIN</span>
                </Link>
              </div>
            )}
          </nav>

          {/* Mobile Actions: Search & Hamburger */}
          <div className="flex md:hidden items-center gap-1.5">
            <button
              onClick={() => setIsSearchOpen(true)}
              className="p-2 text-slate-600 hover:bg-slate-100 rounded-xl"
              aria-label="Search"
            >
              <Search className="w-5 h-5" />
            </button>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-slate-600 hover:bg-slate-100 rounded-xl"
              aria-label="Toggle Menu"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-slate-100 bg-white px-4 py-3 space-y-1">
            {user ? (
              <>
                {navLinks.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition ${
                        isActive
                          ? "bg-poppin-lilac-light text-poppin-lilac font-bold"
                          : "text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <span className="flex items-center gap-2.5">
                        <Icon className="w-4 h-4 text-poppin-lilac" />
                        <span>{item.label}</span>
                      </span>
                      {item.badge && item.badge > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-poppin-lilac text-white text-xs font-bold">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}

                <div className="pt-2 border-t border-slate-100 space-y-1">
                  <Link
                    href="/profile"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    <User className="w-4 h-4 text-poppin-lilac" />
                    <span>My Profile</span>
                  </Link>
                  <Link
                    href="/settings"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    <Settings className="w-4 h-4 text-slate-500" />
                    <span>Settings & Privacy</span>
                  </Link>
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      logout();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-rose-600 hover:bg-rose-50"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Log Out</span>
                  </button>
                </div>
              </>
            ) : (
              <div className="pt-2 pb-1 space-y-2">
                <Link
                  href="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block w-full text-center py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 rounded-xl border border-slate-200"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block w-full text-center py-2.5 text-sm font-bold text-white bg-poppin-navy rounded-xl shadow-xs"
                >
                  Join POPPIN.
                </Link>
              </div>
            )}
          </div>
        )}
      </header>

      {/* Global Command Palette / Search Dialog */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
    </>
  );
}
