/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Users,
  UserPlus,
  UserCheck,
  Loader2,
  AlertCircle,
  Plus,
  X,
} from "lucide-react";

const SUGGESTED_ROLES = [
  "Software Engineer",
  "Product Designer",
  "Full-Stack Developer",
  "AI Researcher",
  "Founder & Builder",
  "Creator / Writer",
  "DevOps Engineer",
  "Data Scientist",
];

const POPULAR_SKILLS = [
  "TypeScript",
  "React",
  "Next.js",
  "Node.js",
  "Python",
  "Tailwind CSS",
  "UI/UX Design",
  "Prisma",
  "GraphQL",
  "Machine Learning",
  "Rust",
  "Figma",
];

const POPULAR_INTERESTS = [
  "Open Source",
  "Startups",
  "Generative AI",
  "Design Systems",
  "Web3",
  "Cloud Architecture",
  "Developer Tools",
  "Product Management",
];

export default function OnboardingPage() {
  const router = useRouter();
  const { user, token, refreshUser } = useAuth();

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Step 1 State
  const [role, setRole] = useState("");
  const [headline, setHeadline] = useState("");

  // Step 2 State
  const [skills, setSkills] = useState<string[]>([]);
  const [interests, setInterests] = useState<string[]>([]);
  const [customSkill, setCustomSkill] = useState("");
  const [customInterest, setCustomInterest] = useState("");

  // Step 3 State
  const [suggestions, setSuggestions] = useState<
    Array<{
      id: string;
      username: string;
      displayName: string | null;
      avatar: string | null;
      headline: string | null;
      isFollowing?: boolean;
    }>
  >([]);

  // Fetch current onboarding progress on mount
  useEffect(() => {
    if (!token) return;

    async function loadStatus() {
      try {
        const res = await fetch("/api/v1/onboarding", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();

        if (data.success && data.data) {
          if (data.data.role) setRole(data.data.role);
          if (data.data.headline) setHeadline(data.data.headline);
          if (Array.isArray(data.data.skills)) setSkills(data.data.skills);
          if (Array.isArray(data.data.interests)) setInterests(data.data.interests);
          if (data.data.step && !data.data.isCompleted) {
            setCurrentStep(data.data.step);
          }
        }
      } catch {
        setErrorMsg("Failed to load onboarding status.");
      } finally {
        setLoading(false);
      }
    }

    loadStatus();
  }, [token]);

  // Load suggestions when reaching Step 3
  useEffect(() => {
    if (currentStep === 3 && token) {
      async function loadSuggestions() {
        try {
          const res = await fetch("/api/v1/onboarding/follow-suggestions", {
            headers: { Authorization: `Bearer ${token}` },
          });
          const data = await res.json();
          if (data.success && Array.isArray(data.data)) {
            setSuggestions(
              data.data.map(
                (item: {
                  id: string;
                  username: string;
                  displayName: string | null;
                  avatar: string | null;
                  headline: string | null;
                }) => ({ ...item, isFollowing: false })
              )
            );
          }
        } catch {
          // Ignore
        }
      }
      loadSuggestions();
    }
  }, [currentStep, token]);

  const handleSaveStep1 = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!role.trim() || !headline.trim()) {
      setErrorMsg("Please provide both your primary role and a professional headline.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/v1/onboarding/step-1", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role: role.trim(), headline: headline.trim() }),
      });
      const data = await res.json();

      if (data.success) {
        setCurrentStep(2);
      } else {
        setErrorMsg(data.error?.message || "Failed to save Step 1 details.");
      }
    } catch {
      setErrorMsg("Server connection error.");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveStep2 = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (skills.length === 0 || interests.length === 0) {
      setErrorMsg("Please select or add at least one skill and one interest.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/v1/onboarding/step-2", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ skills, interests }),
      });
      const data = await res.json();

      if (data.success) {
        setCurrentStep(3);
      } else {
        setErrorMsg(data.error?.message || "Failed to save skills and interests.");
      }
    } catch {
      setErrorMsg("Server connection error.");
    } finally {
      setSaving(false);
    }
  };

  const toggleFollowUser = async (targetUserId: string, currentlyFollowing: boolean) => {
    try {
      const endpoint = currentlyFollowing ? "unfollow" : "follow";
      await fetch(`/api/v1/users/${targetUserId}/${endpoint}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      setSuggestions((prev) =>
        prev.map((s) =>
          s.id === targetUserId ? { ...s, isFollowing: !currentlyFollowing } : s
        )
      );
    } catch {
      // Ignore
    }
  };

  const handleCompleteOnboarding = async () => {
    setSaving(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/v1/onboarding/complete", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (data.success) {
        await refreshUser();
        router.push("/feed");
      } else {
        setErrorMsg(data.error?.message || "Could not complete onboarding.");
      }
    } catch {
      setErrorMsg("Failed to finalize onboarding.");
    } finally {
      setSaving(false);
    }
  };

  const toggleSkill = (item: string) => {
    setSkills((prev) =>
      prev.includes(item) ? prev.filter((s) => s !== item) : [...prev, item]
    );
  };

  const toggleInterest = (item: string) => {
    setInterests((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  const addCustomSkill = () => {
    const val = customSkill.trim();
    if (val && !skills.includes(val)) {
      setSkills((prev) => [...prev, val]);
      setCustomSkill("");
    }
  };

  const addCustomInterest = () => {
    const val = customInterest.trim();
    if (val && !interests.includes(val)) {
      setInterests((prev) => [...prev, val]);
      setCustomInterest("");
    }
  };

  if (!user && !loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-[#FCFBF9]">
        <AlertCircle className="w-10 h-10 text-zinc-400 mb-4" />
        <h2 className="text-xl font-bold text-zinc-900 font-display">Authentication Required</h2>
        <p className="mt-2 text-zinc-600 text-sm max-w-sm">
          Please sign in or create an account to start your onboarding journey.
        </p>
        <Link
          href="/login"
          className="mt-5 px-6 py-2.5 bg-zinc-900 text-white font-medium rounded-xl text-sm hover:bg-zinc-800 transition"
        >
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12 bg-[#FCFBF9]">
      {/* Step Header & Timeline Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-3">
          <span>Step {currentStep} of 3</span>
          <span className="text-zinc-900 font-bold">
            {currentStep === 1
              ? "Your Role & Headline"
              : currentStep === 2
              ? "Skills & Interests"
              : "Discover & Connect"}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-zinc-200 h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-zinc-900 h-full transition-all duration-300 ease-out rounded-full"
            style={{ width: `${(currentStep / 3) * 100}%` }}
          />
        </div>
      </div>

      {errorMsg && (
        <div
          role="alert"
          className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm flex items-start gap-2.5"
        >
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* STEP 1: Role & Headline */}
      {currentStep === 1 && (
        <div className="bg-white p-7 sm:p-9 rounded-2xl border border-zinc-200 shadow-xs">
          <div className="mb-6">
            <h2 className="text-2xl font-black text-zinc-900 tracking-tight font-display">
              Tell the community what you do
            </h2>
            <p className="mt-1.5 text-sm text-zinc-600 font-sans">
              Select or type your primary role and craft a quick headline that introduces your perspective.
            </p>
          </div>

          <form onSubmit={handleSaveStep1} className="space-y-6">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-2">
                Primary Role
              </label>
              {/* Role Chips */}
              <div className="flex flex-wrap gap-2 mb-3">
                {SUGGESTED_ROLES.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={`min-h-[36px] px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                      role === r
                        ? "bg-zinc-900 text-white shadow-xs"
                        : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
              <input
                type="text"
                required
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="Or type custom role..."
                maxLength={60}
                className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 text-sm font-medium text-zinc-900 focus:ring-2 focus:ring-zinc-900 focus:border-zinc-900 outline-none"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-semibold text-zinc-700">
                  Headline / One-Liner
                </label>
                <span className="text-xs text-zinc-400">{headline.length}/160</span>
              </div>
              <textarea
                required
                rows={3}
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder="e.g. Building distributed systems & crafting high-craft frontend experiences."
                maxLength={160}
                className="w-full p-3.5 rounded-xl border border-zinc-200 text-sm font-medium text-zinc-900 focus:ring-2 focus:ring-zinc-900 focus:border-zinc-900 outline-none resize-none"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={saving || !role.trim() || !headline.trim()}
                className="min-h-[44px] inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-zinc-900 text-white font-medium text-sm hover:bg-zinc-800 shadow-xs transition-all disabled:opacity-50 active:scale-[0.98]"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin text-zinc-400" />}
                <span>Save & Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      )}

      {/* STEP 2: Skills & Interests */}
      {currentStep === 2 && (
        <div className="bg-white p-7 sm:p-9 rounded-2xl border border-zinc-200 shadow-xs">
          <div className="mb-6">
            <h2 className="text-2xl font-black text-zinc-900 tracking-tight font-display">
              Pick your skills & passions
            </h2>
            <p className="mt-1.5 text-sm text-zinc-600 font-sans">
              We use these tags to recommend people, discussions, and feeds aligned with your craft.
            </p>
          </div>

          <form onSubmit={handleSaveStep2} className="space-y-6">
            {/* Skills Selection */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-semibold text-zinc-700">
                  Skills ({skills.length} selected)
                </label>
              </div>
              <div className="flex flex-wrap gap-2 mb-3">
                {POPULAR_SKILLS.map((item) => {
                  const isSelected = skills.includes(item);
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => toggleSkill(item)}
                      className={`min-h-[36px] inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                        isSelected
                          ? "bg-zinc-900 text-white shadow-xs"
                          : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                      }`}
                    >
                      <span>{item}</span>
                      {isSelected ? <X className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                    </button>
                  );
                })}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customSkill}
                  onChange={(e) => setCustomSkill(e.target.value)}
                  placeholder="Add custom skill..."
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addCustomSkill();
                    }
                  }}
                  className="flex-1 px-4 py-2 rounded-xl border border-zinc-200 text-sm font-medium outline-none focus:ring-2 focus:ring-zinc-900"
                />
                <button
                  type="button"
                  onClick={addCustomSkill}
                  className="px-4 py-2 rounded-xl bg-zinc-100 text-zinc-700 font-medium text-xs hover:bg-zinc-200"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Interests Selection */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-semibold text-zinc-700">
                  Interests ({interests.length} selected)
                </label>
              </div>
              <div className="flex flex-wrap gap-2 mb-3">
                {POPULAR_INTERESTS.map((item) => {
                  const isSelected = interests.includes(item);
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => toggleInterest(item)}
                      className={`min-h-[36px] inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                        isSelected
                          ? "bg-zinc-900 text-white shadow-xs"
                          : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                      }`}
                    >
                      <span>{item}</span>
                      {isSelected ? <X className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                    </button>
                  );
                })}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customInterest}
                  onChange={(e) => setCustomInterest(e.target.value)}
                  placeholder="Add custom interest..."
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addCustomInterest();
                    }
                  }}
                  className="flex-1 px-4 py-2 rounded-xl border border-zinc-200 text-sm font-medium outline-none focus:ring-2 focus:ring-zinc-900"
                />
                <button
                  type="button"
                  onClick={addCustomInterest}
                  className="px-4 py-2 rounded-xl bg-zinc-100 text-zinc-700 font-medium text-xs hover:bg-zinc-200"
                >
                  Add
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-zinc-100">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="min-h-[44px] inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-zinc-600 hover:text-zinc-900 font-medium text-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <button
                type="submit"
                disabled={saving || skills.length === 0 || interests.length === 0}
                className="min-h-[44px] inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-zinc-900 text-white font-medium text-sm hover:bg-zinc-800 shadow-xs disabled:opacity-50 active:scale-[0.98]"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin text-zinc-400" />}
                <span>Save & Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      )}

      {/* STEP 3: Suggested Connections & Complete */}
      {currentStep === 3 && (
        <div className="bg-white p-7 sm:p-9 rounded-2xl border border-zinc-200 shadow-xs">
          <div className="mb-6">
            <h2 className="text-2xl font-black text-zinc-900 tracking-tight font-display">
              Connect with fellow creators
            </h2>
            <p className="mt-1.5 text-sm text-zinc-600 font-sans">
              Follow a few people to populate your feed and unlock your discussions.
            </p>
          </div>

          {suggestions.length === 0 ? (
            <div className="text-center py-8 bg-zinc-50 rounded-2xl border border-zinc-200 mb-6">
              <Users className="w-8 h-8 text-zinc-400 mx-auto mb-2" />
              <p className="text-sm font-semibold text-zinc-800">You are one of our earliest members!</p>
              <p className="text-xs text-zinc-500 mt-1">
                More creators matching your interests will appear in your feed.
              </p>
            </div>
          ) : (
            <div className="space-y-3 mb-8">
              {suggestions.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-4 rounded-xl border border-zinc-200 hover:border-zinc-300 transition-all bg-white"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-zinc-100 text-zinc-800 font-bold flex items-center justify-center text-sm border border-zinc-200 overflow-hidden">
                      {item.avatar ? (
                        <img
                          src={item.avatar}
                          alt={item.displayName || item.username}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        item.username.slice(0, 2).toUpperCase()
                      )}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-zinc-900">
                        {item.displayName || `@${item.username}`}
                      </h4>
                      <p className="text-xs text-zinc-500 truncate max-w-xs">
                        {item.headline || `@${item.username}`}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleFollowUser(item.id, !!item.isFollowing)}
                    className={`min-h-[36px] px-4 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 ${
                      item.isFollowing
                        ? "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                        : "bg-zinc-900 text-white hover:bg-zinc-800"
                    }`}
                  >
                    {item.isFollowing ? (
                      <>
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Following</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>Follow</span>
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between pt-4 border-t border-zinc-100">
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className="min-h-[44px] inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-zinc-600 hover:text-zinc-900 font-medium text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <button
              type="button"
              onClick={handleCompleteOnboarding}
              disabled={saving}
              className="min-h-[44px] inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-medium text-sm shadow-xs transition-all disabled:opacity-50 active:scale-[0.98]"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin text-zinc-400" />}
              <CheckCircle2 className="w-4 h-4 text-white" />
              <span>Finish & Enter POPPIN</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
