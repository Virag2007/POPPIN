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
  Sparkles,
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
  "Founder & CEO",
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
          if (data.data.isCompleted) {
            // Already completed, can still view or go to profile
          }
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
        setErrorMsg(data.error?.message || "Failed to save Step 2 details.");
      }
    } catch {
      setErrorMsg("Server connection error.");
    } finally {
      setSaving(false);
    }
  };

  const toggleFollowUser = async (targetUserId: string, currentlyFollowing: boolean) => {
    try {
      const method = currentlyFollowing ? "DELETE" : "POST";
      const res = await fetch(`/api/v1/users/${targetUserId}/follow`, {
        method,
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (data.success) {
        setSuggestions((prev) =>
          prev.map((s) => (s.id === targetUserId ? { ...s, isFollowing: !currentlyFollowing } : s))
        );
      }
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
        router.push("/profile");
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
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <AlertCircle className="w-12 h-12 text-slate-400 mb-4" />
        <h2 className="text-xl font-bold text-poppin-navy">Authentication Required</h2>
        <p className="mt-2 text-slate-600 text-sm max-w-sm">
          Please sign in or create an account to start your onboarding journey.
        </p>
        <Link
          href="/login"
          className="mt-5 px-6 py-2.5 bg-poppin-navy text-white font-bold rounded-xl text-sm"
        >
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Step Header & Timeline Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
          <span>Step {currentStep} of 3</span>
          <span className="text-poppin-lilac font-extrabold">
            {currentStep === 1
              ? "Your Role & Headline"
              : currentStep === 2
              ? "Skills & Interests"
              : "Discover & Connect"}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
          <div
            className="bg-poppin-lilac h-full transition-all duration-300 ease-out rounded-full"
            style={{ width: `${(currentStep / 3) * 100}%` }}
          />
        </div>
      </div>

      {errorMsg && (
        <div
          role="alert"
          className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-2.5"
        >
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* STEP 1: Role & Headline */}
      {currentStep === 1 && (
        <div className="bg-white p-7 sm:p-9 rounded-3xl border border-slate-200/90 shadow-sm">
          <div className="mb-6">
            <h2 className="text-2xl font-extrabold text-poppin-navy tracking-tight">
              Tell the community what you do
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Select or type your primary role and craft a quick headline that introduces your perspective.
            </p>
          </div>

          <form onSubmit={handleSaveStep1} className="space-y-6">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Primary Role
              </label>
              {/* Role Chips */}
              <div className="flex flex-wrap gap-2 mb-3">
                {SUGGESTED_ROLES.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={`min-h-[36px] px-3.5 py-1.5 rounded-full text-xs font-bold transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-poppin-lilac ${
                      role === r
                        ? "bg-poppin-navy text-white shadow-xs"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
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
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-poppin-navy focus:ring-2 focus:ring-poppin-lilac focus:border-poppin-lilac outline-none"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Headline / One-Liner
                </label>
                <span className="text-2xs text-slate-400 font-semibold">{headline.length}/160</span>
              </div>
              <textarea
                required
                rows={3}
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder="e.g. Building distributed systems & crafting high-craft frontend experiences."
                maxLength={160}
                className="w-full p-3.5 rounded-xl border border-slate-300 text-sm font-medium text-poppin-navy focus:ring-2 focus:ring-poppin-lilac focus:border-poppin-lilac outline-none resize-none"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={saving || !role.trim() || !headline.trim()}
                className="min-h-[46px] inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-poppin-navy text-white font-extrabold text-sm hover:bg-poppin-navy-light shadow-xs hover:shadow-md transition-all disabled:opacity-50"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin text-poppin-lilac" />}
                <span>Save & Continue</span>
                <ArrowRight className="w-4 h-4 text-poppin-lilac" />
              </button>
            </div>
          </form>
        </div>
      )}

      {/* STEP 2: Skills & Interests */}
      {currentStep === 2 && (
        <div className="bg-white p-7 sm:p-9 rounded-3xl border border-slate-200/90 shadow-sm">
          <div className="mb-6">
            <h2 className="text-2xl font-extrabold text-poppin-navy tracking-tight">
              Pick your skills & passions
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              We use these tags to recommend people, discussions, and feeds aligned with your craft.
            </p>
          </div>

          <form onSubmit={handleSaveStep2} className="space-y-6">
            {/* Skills Selection */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
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
                      className={`min-h-[36px] inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                        isSelected
                          ? "bg-poppin-lilac text-white shadow-xs"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      }`}
                    >
                      <span>{item}</span>
                      {isSelected ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
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
                  className="flex-1 px-4 py-2 rounded-xl border border-slate-300 text-sm font-medium outline-none focus:ring-2 focus:ring-poppin-lilac"
                />
                <button
                  type="button"
                  onClick={addCustomSkill}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Interests Selection */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
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
                      className={`min-h-[36px] inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                        isSelected
                          ? "bg-poppin-navy text-white shadow-xs"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      }`}
                    >
                      <span>{item}</span>
                      {isSelected ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
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
                  className="flex-1 px-4 py-2 rounded-xl border border-slate-300 text-sm font-medium outline-none focus:ring-2 focus:ring-poppin-lilac"
                />
                <button
                  type="button"
                  onClick={addCustomInterest}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200"
                >
                  Add
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="min-h-[44px] inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-slate-600 hover:text-poppin-navy font-bold text-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <button
                type="submit"
                disabled={saving || skills.length === 0 || interests.length === 0}
                className="min-h-[46px] inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-poppin-navy text-white font-extrabold text-sm hover:bg-poppin-navy-light shadow-xs disabled:opacity-50"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin text-poppin-lilac" />}
                <span>Save & Continue</span>
                <ArrowRight className="w-4 h-4 text-poppin-lilac" />
              </button>
            </div>
          </form>
        </div>
      )}

      {/* STEP 3: Suggested Connections & Complete */}
      {currentStep === 3 && (
        <div className="bg-white p-7 sm:p-9 rounded-3xl border border-slate-200/90 shadow-sm">
          <div className="mb-6">
            <h2 className="text-2xl font-extrabold text-poppin-navy tracking-tight">
              Connect with fellow creators
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Follow a few people to populate your network and unlock your personal dashboard.
            </p>
          </div>

          {suggestions.length === 0 ? (
            <div className="text-center py-8 bg-slate-50 rounded-2xl border border-slate-200/70 mb-6">
              <Sparkles className="w-8 h-8 text-poppin-lilac mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">You are one of our earliest members!</p>
              <p className="text-xs text-slate-500 mt-1">
                More creators matching your interests will be recommended as the community grows.
              </p>
            </div>
          ) : (
            <div className="space-y-3 mb-8">
              {suggestions.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-4 rounded-2xl border border-slate-200/80 hover:border-slate-300 transition-all bg-white"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-poppin-lilac-light text-poppin-lilac font-black flex items-center justify-center text-sm border border-poppin-lilac-border">
                      {item.avatar ? (
                        <img
                          src={item.avatar}
                          alt={item.displayName || item.username}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        item.username.slice(0, 2).toUpperCase()
                      )}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-poppin-navy">
                        {item.displayName || `@${item.username}`}
                      </h4>
                      <p className="text-xs text-slate-500 truncate max-w-xs">
                        {item.headline || `@${item.username}`}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleFollowUser(item.id, !!item.isFollowing)}
                    className={`min-h-[38px] px-4 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                      item.isFollowing
                        ? "bg-slate-100 text-slate-700 hover:bg-rose-50 hover:text-rose-600"
                        : "bg-poppin-navy text-white hover:bg-poppin-navy-light"
                    }`}
                  >
                    {item.isFollowing ? (
                      <>
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Following</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-3.5 h-3.5 text-poppin-lilac" />
                        <span>Follow</span>
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className="min-h-[44px] inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-slate-600 hover:text-poppin-navy font-bold text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <button
              type="button"
              onClick={handleCompleteOnboarding}
              disabled={saving}
              className="min-h-[48px] inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-poppin-lilac hover:bg-poppin-lilac-hover text-white font-extrabold text-sm shadow-md transition-all disabled:opacity-50"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin text-white" />}
              <CheckCircle2 className="w-5 h-5 text-white" />
              <span>Finish & Enter Poppin.</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

