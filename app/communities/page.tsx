/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { Community } from "@/types";
import { INITIAL_COMMUNITIES } from "@/lib/mock-communities";
import {
  Layers,
  Users,
  Plus,
  Search,
  X,
  ArrowRight,
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

  const handleToggleJoin = (commId: string) => {
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
      rules: ["Be respectful and contribute thoughtful ideas."],
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
    <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-poppin-lilac-light border border-poppin-lilac-border text-xs font-black text-poppin-navy uppercase tracking-wider mb-3">
            <Layers className="w-3.5 h-3.5 text-poppin-lilac" />
            <span>Community Hubs</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-poppin-navy tracking-tight">
            Discover & Join Interest Hubs
          </h1>
          <p className="mt-2 text-sm sm:text-base text-slate-600 max-w-xl">
            Gather with developers, designers, and founders to exchange insights, review work, and collaborate.
          </p>
        </div>

        {user && (
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="min-h-[46px] inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-poppin-navy text-white font-extrabold text-sm hover:bg-poppin-navy-light shadow-xs hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 transition-all self-start md:self-auto"
          >
            <Plus className="w-4 h-4 text-poppin-lilac" />
            <span>Create a Hub</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8 bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs">
        {/* Category Pills */}
        <div className="flex flex-wrap gap-1.5 w-full sm:w-auto">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={`min-h-[36px] px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeCategory === cat
                  ? "bg-poppin-navy text-white shadow-xs"
                  : "bg-slate-50 text-slate-700 hover:bg-slate-100"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search communities..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-poppin-navy placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-poppin-lilac outline-none transition-all"
          />
        </div>
      </div>

      {/* Communities Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
        {filteredCommunities.map((comm) => (
          <div
            key={comm.id}
            className="bg-white rounded-3xl border border-slate-200/90 shadow-xs hover:shadow-md hover:border-slate-300 transition-all overflow-hidden flex flex-col justify-between group"
          >
            {/* Card Cover & Avatar Header */}
            <div>
              <div className="h-32 w-full bg-slate-100 relative overflow-hidden">
                <img
                  src={comm.coverImage}
                  alt={comm.name}
                  className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                />
                <span className="absolute top-3 right-3 px-3 py-1 rounded-full text-2xs font-extrabold uppercase bg-white/95 backdrop-blur-xs text-poppin-navy shadow-xs">
                  {comm.category}
                </span>
              </div>

              <div className="px-6 pt-0 pb-4 relative">
                {/* Avatar */}
                <div className="w-16 h-16 rounded-2xl bg-white p-1 shadow-md -mt-8 relative z-10 overflow-hidden mb-3 border border-slate-200">
                  <img
                    src={comm.avatar}
                    alt={comm.name}
                    className="w-full h-full object-cover rounded-xl"
                  />
                </div>

                <div className="flex items-start justify-between gap-4">
                  <div>
                    <Link
                      href={`/communities/${comm.slug}`}
                      className="text-lg font-extrabold text-poppin-navy hover:text-poppin-lilac transition-colors tracking-tight flex items-center gap-1.5"
                    >
                      <span>{comm.name}</span>
                    </Link>
                    <span className="text-xs font-mono font-bold text-slate-400">c/{comm.slug}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggleJoin(comm.id)}
                    className={`min-h-[36px] px-4 py-1.5 rounded-xl text-xs font-extrabold transition-all shrink-0 ${
                      comm.isMember
                        ? "bg-slate-100 text-slate-700 hover:bg-rose-50 hover:text-rose-600"
                        : "bg-poppin-navy text-white hover:bg-poppin-navy-light shadow-xs"
                    }`}
                  >
                    {comm.isMember ? "Joined" : "Join Hub"}
                  </button>
                </div>

                <p className="mt-2.5 text-xs text-slate-600 font-medium line-clamp-2 leading-relaxed">
                  {comm.tagline}
                </p>
              </div>
            </div>

            {/* Card Footer */}
            <div className="px-6 py-3.5 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-500">
              <span className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-poppin-lilac" />
                <span>{comm.membersCount} Members</span>
              </span>

              <Link
                href={`/communities/${comm.slug}`}
                className="text-poppin-navy font-bold hover:text-poppin-lilac flex items-center gap-1 transition-colors"
              >
                <span>Enter Hub</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Create Community Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-poppin-navy/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 sm:p-7 shadow-xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-extrabold text-poppin-navy">Create a New Hub</h3>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCommunity} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
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
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold outline-none focus:ring-2 focus:ring-poppin-lilac"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Custom Slug (c/slug)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold select-none text-sm">c/</span>
                  <input
                    type="text"
                    required
                    value={slug}
                    onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
                    placeholder="gen-ui-guild"
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm font-mono outline-none focus:ring-2 focus:ring-poppin-lilac"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as Community["category"])}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold outline-none focus:ring-2 focus:ring-poppin-lilac"
                >
                  <option value="Design">Design & Creative</option>
                  <option value="Engineering">Engineering & Systems</option>
                  <option value="AI & Research">AI & Research</option>
                  <option value="Founders">Founders & Startups</option>
                  <option value="General">General</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Tagline / Catchphrase
                </label>
                <input
                  type="text"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  placeholder="A one-sentence summary of the hub's mission"
                  maxLength={100}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm outline-none focus:ring-2 focus:ring-poppin-lilac"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Detailed Description
                </label>
                <textarea
                  rows={3}
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  placeholder="What can members expect? What topics are discussed?"
                  className="w-full p-3 rounded-xl border border-slate-300 text-sm outline-none focus:ring-2 focus:ring-poppin-lilac resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Avatar Image URL (Optional)
                </label>
                <input
                  type="url"
                  value={avatar}
                  onChange={(e) => setAvatar(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-4 py-2 rounded-xl border border-slate-300 text-xs outline-none focus:ring-2 focus:ring-poppin-lilac"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Cover Image URL (Optional)
                </label>
                <input
                  type="url"
                  value={coverImage}
                  onChange={(e) => setCoverImage(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-4 py-2 rounded-xl border border-slate-300 text-xs outline-none focus:ring-2 focus:ring-poppin-lilac"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-poppin-navy text-white text-sm font-extrabold hover:bg-poppin-navy-light shadow-xs"
                >
                  Launch Hub
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
