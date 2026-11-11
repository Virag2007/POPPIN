/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  X,
  Layers,
  ArrowRight,
  TrendingUp,
} from "lucide-react";

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SearchResultItem {
  id: string;
  type: "user" | "community" | "topic";
  title: string;
  subtitle: string;
  href: string;
  avatar?: string;
  badge?: string;
}

const SEARCH_DATABASE: SearchResultItem[] = [
  // Users
  {
    id: "u_alex",
    type: "user",
    title: "Alex Rivera",
    subtitle: "@alex_design &bull; Principal Product Designer",
    href: "/profiles/alex_design",
    avatar:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80",
    badge: "Design Lead",
  },
  {
    id: "u_sarah",
    type: "user",
    title: "Sarah Chen",
    subtitle: "@sarah_code &bull; Distributed Systems Architect",
    href: "/profiles/sarah_code",
    avatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80",
    badge: "Architect",
  },
  {
    id: "u_marcus",
    type: "user",
    title: "Marcus Vance",
    subtitle: "@marcus_ai &bull; ML Researcher & Agent Architect",
    href: "/profiles/marcus_ai",
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80",
    badge: "AI Research",
  },
  // Communities
  {
    id: "c_design",
    type: "community",
    title: "Design Craft & Systems",
    subtitle: "c/design-craft &bull; 428 members",
    href: "/communities/design-craft",
    avatar:
      "https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=200&auto=format&fit=crop&q=80",
    badge: "Hub",
  },
  {
    id: "c_eng",
    type: "community",
    title: "Distributed Systems & Next.js",
    subtitle: "c/distributed-systems &bull; 615 members",
    href: "/communities/distributed-systems",
    avatar:
      "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=200&auto=format&fit=crop&q=80",
    badge: "Hub",
  },
  {
    id: "c_ai",
    type: "community",
    title: "Autonomous Agents & GenAI",
    subtitle: "c/autonomous-agents &bull; 389 members",
    href: "/communities/autonomous-agents",
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80",
    badge: "Hub",
  },
  {
    id: "c_founders",
    type: "community",
    title: "Indie Founders & Builders",
    subtitle: "c/indie-founders &bull; 294 members",
    href: "/communities/indie-founders",
    avatar:
      "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=200&auto=format&fit=crop&q=80",
    badge: "Hub",
  },
  // Topics
  {
    id: "t_design_tokens",
    type: "topic",
    title: "#DesignTokens",
    subtitle: "142 discussions in Design Craft",
    href: "/explore?q=DesignTokens",
  },
  {
    id: "t_agentic",
    type: "topic",
    title: "#AgenticWorkflows",
    subtitle: "98 discussions in AI & Research",
    href: "/explore?q=AgenticWorkflows",
  },
  {
    id: "t_distributed",
    type: "topic",
    title: "#DistributedCache",
    subtitle: "76 discussions in Engineering",
    href: "/explore?q=DistributedCache",
  },
];

export default function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Handle global Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const results = query.trim()
    ? SEARCH_DATABASE.filter(
        (item) =>
          item.title.toLowerCase().includes(query.toLowerCase()) ||
          item.subtitle.toLowerCase().includes(query.toLowerCase())
      )
    : SEARCH_DATABASE.slice(0, 5);

  const handleSelect = (item: SearchResultItem) => {
    router.push(item.href);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, results.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev === 0 ? results.length - 1 : prev - 1
      );
    } else if (e.key === "Enter" && results[selectedIndex]) {
      e.preventDefault();
      handleSelect(results[selectedIndex]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-150">
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
          <Search className="w-5 h-5 text-poppin-lilac shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search creators (@alex), hubs (c/design), or topics (#)..."
            className="flex-1 text-sm text-slate-800 placeholder-slate-400 bg-transparent border-0 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 transition"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-[10px] font-mono font-medium text-slate-500">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-2 divide-y divide-slate-50">
          {results.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              No results found for &ldquo;{query}&rdquo;.
            </div>
          ) : (
            <div>
              <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {query ? "Search Results" : "Suggested & Trending"}
              </div>

              {results.map((item, index) => {
                const isSelected = index === selectedIndex;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelect(item)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`w-full text-left px-3 py-2.5 rounded-2xl flex items-center justify-between gap-3 transition ${
                      isSelected
                        ? "bg-slate-100 text-slate-900"
                        : "hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {item.avatar ? (
                        <img
                          src={item.avatar}
                          alt={item.title}
                          className="w-9 h-9 rounded-xl object-cover ring-1 ring-slate-200 shrink-0"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-xl bg-poppin-lilac/10 text-poppin-lilac flex items-center justify-center shrink-0">
                          {item.type === "community" ? (
                            <Layers className="w-4 h-4" />
                          ) : (
                            <TrendingUp className="w-4 h-4" />
                          )}
                        </div>
                      )}

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-heading font-semibold text-xs sm:text-sm text-slate-900 truncate">
                            {item.title}
                          </span>
                          {item.badge && (
                            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-poppin-lilac/10 text-poppin-lilac">
                              {item.badge}
                            </span>
                          )}
                        </div>
                        <p
                          className="text-[11px] text-slate-400 truncate"
                          dangerouslySetInnerHTML={{ __html: item.subtitle }}
                        />
                      </div>
                    </div>

                    <ArrowRight
                      className={`w-4 h-4 shrink-0 transition ${
                        isSelected
                          ? "text-poppin-lilac translate-x-0.5"
                          : "text-slate-300"
                      }`}
                    />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-2">
            <span>Navigation:</span>
            <kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-200 font-mono text-[10px]">
              &uarr; &darr;
            </kbd>
            <span>to select</span>
            <kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-200 font-mono text-[10px]">
              &crarr;
            </kbd>
            <span>to open</span>
          </div>

          <span className="font-mono text-poppin-lilac font-medium">
            POPPIN Search
          </span>
        </div>
      </div>
    </div>
  );
}
