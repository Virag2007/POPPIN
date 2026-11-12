/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { Community } from "@/types";
import { INITIAL_COMMUNITIES } from "@/lib/mock-communities";
import {
  Users,
  Plus,
  Search,
  X,
  Flame,
  Sparkles,
  TrendingUp,
  ShieldCheck,
  Check,
} from "lucide-react";

const CATEGORIES = ["All", "Design", "Engineering", "AI & Research", "Founders"];

export default function CommunitiesPage() {
  const { user } = useAuth();
  const [communities, setCommunities] = useState<Community[]>(INITIAL_COMMUNITIES);
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  // Create Community Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [tagline, setTagline] = useState("");
  const [desc, setDesc] = useState("");
  const [category, setCategory] = useState<Community["category"]>("General");
  const [avatar, setAvatar] = useState("");
  const [coverImage, setCoverImage] = useState("");

  const filteredCommunities = communities.filter((c) => {
    const matchesCategory =
      activeCategory === "All" || c.category.toLowerCase() === activeCategory.toLowerCase();
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.tagline.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.slug.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleToggleJoin = (commId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCommunities((prev) =>
      prev.map((c) => {
        if (c.id === commId) {
          const wasMember = !!c.isMember;
          return {
            ...c,
            isMember: !wasMember,
            membersCount: wasMember ? c.membersCount - 1 : c.membersCount + 1,
          };
        }
        return c;
      })
    );
  };

  const handleCreateCommunity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !slug.trim()) return;

    const newComm: Community = {
      id: "comm_" + Date.now(),
      slug: slug.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
      name: name.trim(),
      tagline: tagline.trim() || "A community on Poppin.",
      description: desc.trim() || "Welcome to our hub.",
      category,
      avatar:
        avatar.trim() ||
        "https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=400&auto=format&fit=crop&q=80",
      coverImage:
        coverImage.trim() ||
        "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80",
      membersCount: 1,
      isMember: true,
      rules: [
        "Be respectful and constructive.",
        "Keep discussions relevant to the community topic.",
      ],
      moderators: [
        {
          id: user?.id || "admin",
          username: "you",
          displayName: "You",
        },
      ],
    };

    setCommunities((prev) => [newComm, ...prev]);
    setShowCreateModal(false);
    setName("");
    setSlug("");
    setTagline("");
    setDesc("");
  };

  return (
    <div className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 bg-[#F4F6F8]">
      {/* Reddit-Style Subreddit Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 mb-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-poppin-lilac-light text-poppin-lilac font-bold text-xs mb-2">
            <Flame className="w-3.5 h-3.5" />
            <span>Reddit-Style Subreddits</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Explore Communities
          </h1>
          <p className="mt-1 text-sm text-slate-500 max-w-2xl">
            Find and join spaces dedicated to your interests. Post discussions, upvote great ideas, and connect with peers.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-poppin-lilac hover:bg-poppin-lilac-hover text-white font-bold text-xs sm:text-sm shadow-xs transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Create a Community</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 ${
                activeCategory === cat
                  ? "bg-slate-900 text-white shadow-2xs"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              {cat === "All" ? "r/All" : `r/${cat}`}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter communities..."
            className="w-full pl-9 pr-3 py-1.5 rounded-full border border-slate-200 bg-white text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-poppin-lilac"
          />
        </div>
      </div>

      {/* Reddit Community Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredCommunities.map((comm) => (
          <div
            key={comm.id}
            className="bg-white rounded-2xl border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all overflow-hidden flex flex-col justify-between"
          >
            {/* Community Banner */}
            <div className="relative h-24 w-full bg-slate-100">
              <img
                src={comm.coverImage}
                alt={comm.name}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Content Body */}
            <div className="p-5 pt-0 flex-1 flex flex-col justify-between">
              <div>
                {/* Overlapping Avatar */}
                <div className="relative -mt-8 mb-3 flex items-end justify-between">
                  <div className="w-16 h-16 rounded-full border-4 border-white bg-white overflow-hidden shadow-xs">
                    <img
                      src={comm.avatar}
                      alt={comm.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <button
                    onClick={(e) => handleToggleJoin(comm.id, e)}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all shadow-2xs ${
                      comm.isMember
                        ? "bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-600 border border-slate-300"
                        : "bg-poppin-lilac hover:bg-poppin-lilac-hover text-white"
                    }`}
                  >
                    {comm.isMember ? (
                      <span className="flex items-center gap-1">
                        <Check className="w-3 h-3 text-emerald-600" /> Joined
                      </span>
                    ) : (
                      "Join"
                    )}
                  </button>
                </div>

                {/* Subreddit Name */}
                <Link
                  href={`/communities/${comm.slug}`}
                  className="block group"
                >
                  <h3 className="text-base font-extrabold text-slate-900 group-hover:text-poppin-lilac transition">
                    r/{comm.slug}
                  </h3>
                  <p className="text-xs font-semibold text-slate-700 mt-0.5 line-clamp-1">
                    {comm.name}
                  </p>
                </Link>

                <p className="mt-2 text-xs text-slate-500 line-clamp-2 leading-relaxed">
                  {comm.tagline}
                </p>
              </div>

              {/* Stats Footer */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1 font-medium text-slate-500">
                  <Users className="w-3.5 h-3.5" />
                  <span>{comm.membersCount.toLocaleString()} members</span>
                </span>
                <Link
                  href={`/communities/${comm.slug}`}
                  className="font-bold text-poppin-lilac hover:underline"
                >
                  Open &rarr;
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create Community Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-lg font-extrabold text-slate-900">Create a Community</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCommunity} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                  Community Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (!slug) {
                      setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, "-"));
                    }
                  }}
                  placeholder="e.g. Next.js Developers"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-poppin-lilac"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                  Subreddit URL (slug)
                </label>
                <div className="flex items-center">
                  <span className="px-3 py-2 bg-slate-100 border border-r-0 border-slate-300 rounded-l-xl text-xs font-mono text-slate-500">
                    r/
                  </span>
                  <input
                    type="text"
                    required
                    value={slug}
                    onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
                    placeholder="nextjs-devs"
                    className="w-full px-3.5 py-2 rounded-r-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-poppin-lilac"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                  Tagline / Short Pitch
                </label>
                <input
                  type="text"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  placeholder="The front page for Next.js builders"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-poppin-lilac"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  placeholder="Tell people what this community is about..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-poppin-lilac"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-poppin-lilac hover:bg-poppin-lilac-hover text-white text-xs font-bold shadow-xs"
                >
                  Create Community
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
