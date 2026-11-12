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
  User,
  FileText,
  Loader2,
} from "lucide-react";

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SearchResultItem {
  id: string;
  type: "user" | "community" | "post" | "topic";
  title: string;
  subtitle: string;
  href: string;
  avatar?: string;
  badge?: string;
}

const DEFAULT_POPULAR_ITEMS: SearchResultItem[] = [
  {
    id: "c_design",
    type: "community",
    title: "Design Craft & Systems",
    subtitle: "c/design-craft • Design Hub",
    href: "/communities/design-craft",
    avatar: "https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=200&auto=format&fit=crop&q=80",
    badge: "Design",
  },
  {
    id: "c_eng",
    type: "community",
    title: "Distributed Systems & Next.js",
    subtitle: "c/distributed-systems • Engineering Hub",
    href: "/communities/distributed-systems",
    avatar: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=200&auto=format&fit=crop&q=80",
    badge: "Engineering",
  },
  {
    id: "c_ai",
    type: "community",
    title: "Autonomous Agents & GenAI",
    subtitle: "c/autonomous-agents • AI & Research Hub",
    href: "/communities/autonomous-agents",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80",
    badge: "AI",
  },
];

export default function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResultItem[]>(DEFAULT_POPULAR_ITEMS);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
      setResults(DEFAULT_POPULAR_ITEMS);
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

  // Debounced search query to backend
  useEffect(() => {
    if (!query.trim()) {
      setResults(DEFAULT_POPULAR_ITEMS);
      setIsLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsLoading(true);
        const res = await fetch(`/api/v1/search?q=${encodeURIComponent(query.trim())}`);
        const data = await res.json();

        if (res.ok && data.success && data.data) {
          const combined: SearchResultItem[] = [
            ...(data.data.users || []),
            ...(data.data.communities || []),
            ...(data.data.posts || []),
          ];
          setResults(combined);
          setSelectedIndex(0);
        }
      } catch {
        // Keep current results on network error
      } finally {
        setIsLoading(false);
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  const handleSelect = (item: SearchResultItem) => {
    router.push(item.href);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
    } else if (e.key === "Enter" && results[selectedIndex]) {
      e.preventDefault();
      handleSelect(results[selectedIndex]);
    }
  };

  const getItemIcon = (type: SearchResultItem["type"]) => {
    switch (type) {
      case "user":
        return <User className="w-4 h-4 text-poppin-lilac" />;
      case "community":
        return <Layers className="w-4 h-4 text-emerald-500" />;
      case "post":
        return <FileText className="w-4 h-4 text-blue-500" />;
      default:
        return <TrendingUp className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Quick Search"
      className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-start justify-center pt-16 sm:pt-24 p-4 animate-in fade-in duration-150"
    >
      <div
        className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Header / Input */}
        <div className="relative flex items-center px-4 py-3.5 border-b border-slate-100 bg-slate-50/50">
          <Search className="w-5 h-5 text-slate-400 mr-3 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search people, hubs, discussions, or tags..."
            className="w-full bg-transparent text-sm sm:text-base font-medium text-slate-900 placeholder:text-slate-400 focus:outline-hidden"
          />
          {isLoading ? (
            <Loader2 className="w-4 h-4 text-poppin-lilac animate-spin mr-2 shrink-0" />
          ) : query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 mr-2"
            >
              <X className="w-4 h-4" />
            </button>
          ) : null}
          <button
            type="button"
            onClick={onClose}
            className="text-[11px] font-bold text-slate-500 px-2 py-0.5 rounded-md bg-slate-200/60 hover:bg-slate-200"
          >
            ESC
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-[360px] overflow-y-auto p-2 space-y-1">
          {results.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              No matching creators, hubs, or discussions found.
            </div>
          ) : (
            results.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={`${item.type}_${item.id}_${idx}`}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-colors ${
                    isSelected
                      ? "bg-poppin-lilac/10 text-poppin-navy font-semibold"
                      : "hover:bg-slate-50 text-slate-700"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {item.avatar ? (
                      <img
                        src={item.avatar}
                        alt=""
                        className="w-8 h-8 rounded-full object-cover shrink-0 border border-slate-200"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200">
                        {getItemIcon(item.type)}
                      </div>
                    )}
                    <div className="truncate">
                      <div className="text-xs sm:text-sm font-bold text-slate-900 truncate flex items-center gap-2">
                        {item.title}
                        {item.badge && (
                          <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">
                        {item.subtitle}
                      </p>
                    </div>
                  </div>

                  <ArrowRight
                    className={`w-4 h-4 ml-2 shrink-0 transition-transform ${
                      isSelected ? "text-poppin-navy translate-x-0.5" : "text-transparent"
                    }`}
                  />
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-medium">
          <div className="flex items-center gap-3">
            <span>
              <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded-sm text-[10px] shadow-2xs font-mono">
                ↑
              </kbd>{" "}
              <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded-sm text-[10px] shadow-2xs font-mono">
                ↓
              </kbd>{" "}
              to navigate
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded-sm text-[10px] shadow-2xs font-mono">
                ↵
              </kbd>{" "}
              to select
            </span>
          </div>
          <span>Ctrl + K</span>
        </div>
      </div>
    </div>
  );
}
