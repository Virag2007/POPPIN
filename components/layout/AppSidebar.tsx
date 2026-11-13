/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  Home,
  Layers,
  MessageSquare,
  ChevronDown,
  ChevronRight,
  Plus,
  Settings,
  LogOut,
  User,
} from "lucide-react";

interface JoinedCommunityItem {
  id: string;
  name: string;
  slug: string;
  avatar: string | null;
}

interface AppSidebarProps {
  onOpenCreatePost?: () => void;
  className?: string;
  onNavigate?: () => void;
}

export function AppSidebar({ className = "", onNavigate }: AppSidebarProps) {
  const pathname = usePathname();
  const { user, profile, logout, token } = useAuth();
  const [isCommunitiesOpen, setIsCommunitiesOpen] = useState(true);
  const [joinedCommunities, setJoinedCommunities] = useState<JoinedCommunityItem[]>([]);

  // Primary navigation items
  const primaryNav = [
    { href: "/feed", label: "Home", icon: Home },
    { href: "/communities", label: "Communities", icon: Layers },
    { href: "/messages", label: "Messages", icon: MessageSquare },
  ];

  // Fetch user's joined communities
  useEffect(() => {
    async function loadJoinedCommunities() {
      try {
        const activeToken = token || (typeof window !== "undefined" ? localStorage.getItem("poppin_jwt") : null);
        const headers: Record<string, string> = {};
        if (activeToken) headers["Authorization"] = `Bearer ${activeToken}`;

        const res = await fetch("/api/v1/communities?limit=15", { headers });
        const data = await res.json();
        if (res.ok && data.success && data.data?.items) {
          interface CommunityApiRecord {
            id: string;
            name: string;
            slug: string;
            avatar?: string | null;
            isMember?: boolean;
          }
          const filtered = (data.data.items as CommunityApiRecord[])
            .filter((c) => c.isMember)
            .map((c) => ({
              id: c.id,
              name: c.name,
              slug: c.slug,
              avatar: c.avatar || null,
            }));
          setJoinedCommunities(filtered);
        }
      } catch {
        // Continue
      }
    }

    if (user) {
      loadJoinedCommunities();
    }
  }, [user, token]);

  return (
    <aside
      className={`w-64 border-r border-white/10 bg-[#1E1F22] flex flex-col h-full select-none text-[#F2F3F5] ${className}`}
      aria-label="Application Sidebar"
    >
      {/* Brand Header */}
      <div className="h-16 px-6 border-b border-white/10 flex items-center justify-between shrink-0">
        <Link
          href="/feed"
          onClick={onNavigate}
          className="flex items-center gap-2 group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5865F2] rounded-lg py-1"
          aria-label="POPPIN Home"
        >
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#5865F2] to-[#8A9BFF] flex items-center justify-center font-heading font-black text-white text-sm shadow-md shadow-[#5865F2]/30">
            P
          </div>
          <span className="font-heading text-lg font-black tracking-tight text-white group-hover:opacity-90 transition-opacity">
            POPPIN<span className="text-[#5865F2]">.</span>
          </span>
        </Link>
      </div>

      {/* Navigation Scrollable Body */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {/* Primary Links */}
        <nav aria-label="Primary Navigation" className="space-y-1">
          {primaryNav.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === "/feed"
                ? pathname === "/feed" || pathname === "/"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? "bg-[#5865F2] text-white shadow-md shadow-[#5865F2]/25"
                    : "text-[#B5BAC1] hover:text-white hover:bg-white/5"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-[#B5BAC1]"}`} />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Collapsible Communities Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-3">
            <button
              type="button"
              onClick={() => setIsCommunitiesOpen((prev) => !prev)}
              className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              {isCommunitiesOpen ? (
                <ChevronDown className="w-3.5 h-3.5" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5" />
              )}
              <span>My Communities</span>
            </button>
            <Link
              href="/communities"
              onClick={onNavigate}
              className="p-1 rounded-md text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
              title="Browse & Create Communities"
            >
              <Plus className="w-3.5 h-3.5" />
            </Link>
          </div>

          {isCommunitiesOpen && (
            <div className="space-y-0.5 pl-1">
              {joinedCommunities.length === 0 ? (
                <div className="px-3 py-2.5 text-[11px] text-zinc-400">
                  <p>No joined communities yet.</p>
                  <Link
                    href="/communities"
                    onClick={onNavigate}
                    className="text-[#8A9BFF] font-medium hover:underline inline-block mt-1"
                  >
                    Discover communities →
                  </Link>
                </div>
              ) : (
                joinedCommunities.map((c) => {
                  const isActive = pathname === `/communities/${c.slug}`;
                  return (
                    <Link
                      key={c.id}
                      href={`/communities/${c.slug}`}
                      onClick={onNavigate}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                        isActive
                          ? "bg-white/10 text-white font-semibold"
                          : "text-[#B5BAC1] hover:text-white hover:bg-white/5"
                      }`}
                    >
                      {c.avatar ? (
                        <img
                          src={c.avatar}
                          alt=""
                          className="w-5 h-5 rounded-md object-cover border border-white/10 shrink-0"
                        />
                      ) : (
                        <div className="w-5 h-5 rounded-md bg-white/10 text-[#8A9BFF] font-bold flex items-center justify-center text-[10px] shrink-0">
                          #
                        </div>
                      )}
                      <span className="truncate">c/{c.slug}</span>
                    </Link>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>

      {/* User Footer Section */}
      <div className="p-3 border-t border-white/10 bg-[#16171A] space-y-1 shrink-0">
        {/* Profile Card */}
        <Link
          href="/profile"
          onClick={onNavigate}
          className={`w-full flex items-center gap-3 p-2 rounded-xl transition-colors ${
            pathname === "/profile"
              ? "bg-white/10 border border-white/15"
              : "hover:bg-white/5"
          }`}
        >
          {profile?.avatar ? (
            <img
              src={profile.avatar}
              alt={profile.displayName || profile.username}
              className="w-8 h-8 rounded-full object-cover border border-white/10 shrink-0"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-[#313338] text-[#8A9BFF] flex items-center justify-center font-bold text-xs shrink-0">
              {profile?.username?.charAt(0).toUpperCase() || <User className="w-4 h-4 text-[#8A9BFF]" />}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-white truncate">
              {profile?.displayName || profile?.username || "Builder"}
            </p>
            <p className="text-[10px] text-zinc-400 truncate">
              @{profile?.username || "creator"}
            </p>
          </div>
        </Link>

        {/* Quick Utility Actions */}
        <div className="flex items-center justify-between pt-1 px-1">
          <Link
            href="/settings"
            onClick={onNavigate}
            className={`flex items-center gap-1.5 px-2 py-1.5 rounded-md text-[11px] font-medium transition-colors ${
              pathname === "/settings"
                ? "text-white font-bold"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Settings</span>
          </Link>

          <button
            type="button"
            onClick={() => logout()}
            className="flex items-center gap-1.5 px-2 py-1.5 rounded-md text-[11px] font-medium text-zinc-400 hover:text-rose-400 transition-colors"
            title="Log Out"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
