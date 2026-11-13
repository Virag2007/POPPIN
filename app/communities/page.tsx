/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { Community } from "@/types";
import {
  Layers,
  Users,
  Plus,
  Search,
  X,
  ArrowRight,
  Loader2,
} from "lucide-react";

const CATEGORIES = ["All", "Design", "Engineering", "Research", "Startups", "General"];

export default function CommunitiesPage() {
  const { user } = useAuth();
  const [communities, setCommunities] = useState<Community[]>([]);
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Create Community Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [tagline, setTagline] = useState("");
  const [desc, setDesc] = useState("");
  const [category, setCategory] = useState<Community["category"]>("General");
  const [avatar, setAvatar] = useState("");
  const [coverImage, setCoverImage] = useState("");

  const loadCommunities = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (activeCategory !== "All") params.set("category", activeCategory);
      if (searchQuery.trim()) params.set("search", searchQuery.trim());

      const res = await fetch(`/api/v1/communities?${params.toString()}`);
      const data = await res.json();

      if (res.ok && data.success && data.data?.items) {
        setCommunities(data.data.items);
      }
    } catch {
      // Keep existing list on failure
    } finally {
      setIsLoading(false);
    }
  }, [activeCategory, searchQuery]);

  useEffect(() => {
    loadCommunities();
  }, [loadCommunities]);

  const handleToggleJoin = async (comm: Community) => {
    const wasMember = !!comm.isMember;

    // Optimistic UI update
    setCommunities((prev) =>
      prev.map((c) => {
        if (c.id === comm.id) {
          return {
            ...c,
            isMember: !wasMember,
            membersCount: wasMember ? Math.max(0, c.membersCount - 1) : c.membersCount + 1,
          };
        }
        return c;
      })
    );

    try {
      const method = wasMember ? "DELETE" : "POST";
      const res = await fetch(`/api/v1/communities/${comm.slug}/join`, {
        method,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        loadCommunities();
      }
    } catch {
      loadCommunities();
    }
  };

  const handleCreateCommunity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !slug.trim()) return;

    try {
      setIsSubmitting(true);
      setCreateError(null);

      const res = await fetch("/api/v1/communities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          slug: slug.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
          tagline: tagline.trim() || undefined,
          description: desc.trim() || undefined,
          category,
          avatar: avatar.trim() || undefined,
          coverImage: coverImage.trim() || undefined,
          rules: ["Critique the craft constructively, not the person."],
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data?.error?.message || "Failed to create community");
      }

      setShowCreateModal(false);
      setName("");
      setSlug("");
      setTagline("");
      setDesc("");
      setAvatar("");
      setCoverImage("");
      loadCommunities();
    } catch (err: unknown) {
      setCreateError(err instanceof Error ? err.message : "Failed to create hub");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 text-[#F2F3F5]">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#383A40] border border-white/10 text-xs font-semibold text-[#8A9BFF] uppercase tracking-wider mb-3">
            <Layers className="w-3.5 h-3.5 text-[#5865F2]" />
            <span>Community Spaces</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight font-heading">
            Discover & Join Hubs
          </h1>
          <p className="mt-2 text-sm sm:text-base text-[#B5BAC1] max-w-xl font-sans">
            Gather with developers, designers, and founders to exchange insights, review work, and collaborate.
          </p>
        </div>

        {user && (
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="min-h-[44px] inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#5865F2] hover:bg-[#4752C4] text-white font-bold text-xs shadow-lg active:scale-[0.98] transition-all self-start md:self-auto cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Community</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8 bg-[#2B2D31] p-3.5 rounded-2xl border border-white/10 shadow-lg">
        {/* Category Pills */}
        <div className="flex flex-wrap gap-1.5 w-full sm:w-auto">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={`min-h-[36px] px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all ${
                activeCategory === cat
                  ? "bg-[#5865F2] text-white shadow-xs font-bold"
                  : "bg-[#383A40] text-[#B5BAC1] hover:text-white hover:bg-[#313338]"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search communities..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#383A40] border border-white/10 text-xs font-medium text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#5865F2] transition-all"
          />
        </div>
      </div>

      {/* Communities Grid */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center text-zinc-500">
          <Loader2 className="w-8 h-8 animate-spin text-[#5865F2] mb-3" />
          <p className="text-xs font-medium">Loading spaces...</p>
        </div>
      ) : communities.length === 0 ? (
        <div className="py-16 text-center bg-[#2B2D31] rounded-2xl border border-white/10 p-8 shadow-lg">
          <Layers className="w-8 h-8 text-zinc-500 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-white font-heading">No communities found</h3>
          <p className="text-xs text-[#B5BAC1] mt-1 font-sans">
            Try adjusting your search query or create the first hub in this category!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
          {communities.map((comm) => (
            <div
              key={comm.id}
              className="bg-[#2B2D31] rounded-2xl border border-white/10 shadow-lg hover:border-white/20 transition-all overflow-hidden flex flex-col justify-between group"
            >
              {/* Card Cover & Avatar Header */}
              <div>
                <div className="h-32 w-full bg-[#1E1F22] relative overflow-hidden">
                  {comm.coverImage ? (
                    <img
                      src={comm.coverImage}
                      alt={comm.name}
                      className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-r from-[#1E1F22] via-[#2B2D31] to-[#383A40]" />
                  )}
                  <span className="absolute top-3 right-3 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-[#1E1F22]/90 backdrop-blur-md text-[#8A9BFF] border border-white/10">
                    {comm.category}
                  </span>
                </div>

                <div className="px-6 pt-0 pb-4 relative">
                  {/* Avatar */}
                  <div className="w-14 h-14 rounded-xl bg-[#2B2D31] p-1 shadow-md -mt-7 relative z-10 overflow-hidden mb-3 border border-white/10 font-heading">
                    {comm.avatar ? (
                      <img src={comm.avatar} alt={comm.name} className="w-full h-full object-cover rounded-lg" />
                    ) : (
                      <div className="w-full h-full rounded-lg bg-[#383A40] flex items-center justify-center font-bold text-white text-base">
                        {comm.name.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                  </div>

                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <Link
                        href={`/communities/${comm.slug}`}
                        className="text-lg font-bold text-white hover:underline transition-colors tracking-tight flex items-center gap-1.5 font-heading"
                      >
                        <span>{comm.name}</span>
                      </Link>
                      <span className="text-xs font-mono font-medium text-[#B5BAC1]">c/{comm.slug}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleJoin(comm)}
                      className={`min-h-[36px] px-4 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                        comm.isMember
                          ? "bg-[#383A40] text-[#B5BAC1] hover:bg-red-500/10 hover:text-red-400"
                          : "bg-[#5865F2] text-white hover:bg-[#4752C4]"
                      }`}
                    >
                      {comm.isMember ? "Joined" : "Join Hub"}
                    </button>
                  </div>

                  <p className="mt-2.5 text-xs text-[#B5BAC1] font-medium line-clamp-2 leading-relaxed font-sans">
                    {comm.tagline || comm.description}
                  </p>
                </div>
              </div>

              {/* Card Footer */}
              <div className="px-6 py-3.5 bg-[#1E1F22] border-t border-white/5 flex items-center justify-between text-xs font-medium text-[#B5BAC1]">
                <span className="flex items-center gap-1.5 text-[#B5BAC1]">
                  <Users className="w-3.5 h-3.5 text-[#5865F2]" />
                  <span>{comm.membersCount} Members</span>
                </span>

                <Link
                  href={`/communities/${comm.slug}`}
                  className="text-white font-semibold hover:text-[#5865F2] flex items-center gap-1 transition-colors"
                >
                  <span>Enter Hub</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Community Modal */}
      {showCreateModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
        >
          <div className="bg-[#2B2D31] w-full max-w-lg rounded-2xl p-6 sm:p-7 shadow-2xl border border-white/10 max-h-[90vh] overflow-y-auto text-white animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
              <h3 className="text-sm font-bold font-heading text-white">Create a Community Space</h3>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-[#B5BAC1] hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {createError && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs font-medium text-red-400">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateCommunity} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#B5BAC1] mb-1">
                  Community Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (!slug) {
                      setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"));
                    }
                  }}
                  placeholder="e.g. Generative UI Guild"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#383A40] border border-white/10 text-xs text-white focus:outline-none focus:ring-2 focus:ring-[#5865F2]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#B5BAC1] mb-1">
                  Slug URL
                </label>
                <div className="flex items-center">
                  <span className="px-3 py-2.5 bg-[#1E1F22] border border-r-0 border-white/10 rounded-l-xl text-xs text-zinc-400 font-mono">
                    c/
                  </span>
                  <input
                    type="text"
                    required
                    value={slug}
                    onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
                    placeholder="generative-ui"
                    className="w-full px-3.5 py-2.5 rounded-r-xl bg-[#383A40] border border-white/10 text-xs text-white font-mono focus:outline-none focus:ring-2 focus:ring-[#5865F2]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#B5BAC1] mb-1">
                  Tagline
                </label>
                <input
                  type="text"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  placeholder="One sentence describing the space..."
                  maxLength={120}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#383A40] border border-white/10 text-xs text-white focus:outline-none focus:ring-2 focus:ring-[#5865F2]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#B5BAC1] mb-1">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as Community["category"])}
                  className="w-full px-3 py-2.5 rounded-xl bg-[#383A40] border border-white/10 text-xs text-white focus:outline-none focus:ring-2 focus:ring-[#5865F2]"
                >
                  <option value="General">General</option>
                  <option value="Design">Design</option>
                  <option value="Engineering">Engineering</option>
                  <option value="Research">Research</option>
                  <option value="Startups">Startups</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#B5BAC1] mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  placeholder="What can members expect in this hub?"
                  className="w-full p-3 rounded-xl bg-[#383A40] border border-white/10 text-xs text-white focus:outline-none focus:ring-2 focus:ring-[#5865F2] resize-none"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-medium text-[#B5BAC1] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-[#5865F2] hover:bg-[#4752C4] text-white text-xs font-bold rounded-xl transition disabled:opacity-50 flex items-center gap-2 cursor-pointer shadow-xs"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin text-white" />}
                  <span>Create Space</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
