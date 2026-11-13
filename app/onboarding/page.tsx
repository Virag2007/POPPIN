/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { FileUpload } from "@/components/ui/file-upload";
import {
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Loader2,
  AlertCircle,
  Compass,
} from "lucide-react";

const POPULAR_INTERESTS = [
  "Open Source",
  "Startups",
  "Generative AI",
  "Design Systems",
  "Web3",
  "Cloud Architecture",
  "Developer Tools",
  "Product Design",
  "TypeScript",
  "Next.js",
  "Rust",
  "Distributed Systems",
];

export default function OnboardingPage() {
  const router = useRouter();
  const { user, token, refreshUser } = useAuth();

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Step 1: Essentials
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [headline, setHeadline] = useState("");
  const [bio, setBio] = useState("");

  // Step 2: Media
  const [avatar, setAvatar] = useState("");
  const [coverImage, setCoverImage] = useState("");

  // Step 3: Interests
  const [interests, setInterests] = useState<string[]>([]);
  const [customInterest, setCustomInterest] = useState("");

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
          if (data.data.displayName) setDisplayName(data.data.displayName);
          if (data.data.username) setUsername(data.data.username);
          if (data.data.headline) setHeadline(data.data.headline);
          if (data.data.bio) setBio(data.data.bio);
          if (data.data.avatar) setAvatar(data.data.avatar);
          if (data.data.coverImage) setCoverImage(data.data.coverImage);
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

  const handleSaveStep1 = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!headline.trim()) {
      setErrorMsg("Please provide your professional headline.");
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
        body: JSON.stringify({
          displayName: displayName.trim() || undefined,
          headline: headline.trim(),
          bio: bio.trim() || undefined,
        }),
      });
      const data = await res.json();

      if (data.success) {
        setCurrentStep(2);
      } else {
        setErrorMsg(data.error?.message || "Failed to save profile details.");
      }
    } catch {
      setErrorMsg("Server connection error.");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveStep2 = async (skip = false) => {
    setErrorMsg(null);
    setSaving(true);

    try {
      if (!skip && (avatar || coverImage)) {
        await fetch("/api/v1/onboarding/images", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            avatar: avatar.trim() || undefined,
            coverImage: coverImage.trim() || undefined,
          }),
        });
      }
      setCurrentStep(3);
    } catch {
      setErrorMsg("Failed to save images. You can skip for now.");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveStep3 = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (interests.length === 0) {
      setErrorMsg("Please select at least one interest to personalize your feed.");
      return;
    }

    setSaving(true);
    try {
      // 1. Save interests
      const step2Res = await fetch("/api/v1/onboarding/step-2", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ skills: [], interests }),
      });
      const step2Data = await step2Res.json();

      if (!step2Data.success) {
        setErrorMsg(step2Data.error?.message || "Failed to save interests.");
        setSaving(false);
        return;
      }

      // 2. Mark onboarding complete
      const compRes = await fetch("/api/v1/onboarding/complete", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const compData = await compRes.json();

      if (compData.success) {
        await refreshUser();
        router.push("/feed");
      } else {
        setErrorMsg(compData.error?.message || "Could not finalize onboarding.");
      }
    } catch {
      setErrorMsg("Failed to complete onboarding.");
    } finally {
      setSaving(false);
    }
  };

  const toggleInterest = (item: string) => {
    setInterests((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
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
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-[#080914] min-h-[calc(100vh-4rem)] text-white">
        <AlertCircle className="w-10 h-10 text-zinc-500 mb-4" />
        <h2 className="text-xl font-bold font-heading">Authentication Required</h2>
        <p className="mt-2 text-zinc-400 text-sm max-w-sm">
          Please sign in or create an account to start your onboarding journey.
        </p>
        <Link
          href="/login"
          className="mt-5 px-6 py-2.5 bg-[#5865F2] hover:bg-[#4752C4] text-white font-bold rounded-xl text-xs transition"
        >
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#080914] text-[#F2F3F5] py-12 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto">
        {/* Header with Steps */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#5865F2]/10 border border-[#5865F2]/30 text-[#8A9BFF] text-xs font-semibold mb-3">
            <Compass className="w-3.5 h-3.5" />
            <span>Builder Profile Onboarding</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight font-heading">
            {currentStep === 1 && "Identity & Story"}
            {currentStep === 2 && "Profile Media"}
            {currentStep === 3 && "Craft & Interests"}
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-zinc-400 font-sans">
            {currentStep === 1 && "Set up how peers discover your work across the platform"}
            {currentStep === 2 && "Upload your avatar and cover banner (or skip for now)"}
            {currentStep === 3 && "Select topics to tailor your community discussions and feed"}
          </p>

          {/* Progress Indicators */}
          <div className="flex items-center justify-center gap-2 mt-6">
            {[1, 2, 3].map((step) => (
              <div
                key={step}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  currentStep === step
                    ? "w-8 bg-[#5865F2]"
                    : currentStep > step
                    ? "w-6 bg-emerald-500"
                    : "w-4 bg-white/10"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Card Container */}
        <div className="bg-[#1E1F22] rounded-3xl border border-white/10 p-6 sm:p-10 shadow-2xl">
          {errorMsg && (
            <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* STEP 1: IDENTITY & STORY */}
          {currentStep === 1 && (
            <form onSubmit={handleSaveStep1} className="space-y-5">
              {username && (
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1.5">
                    Your Handle
                  </label>
                  <p className="px-4 py-2.5 rounded-xl border border-white/5 bg-[#141517]/50 text-xs font-mono text-[#8A9BFF]">
                    @{username}
                  </p>
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Display Name
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Alex Rivera"
                  maxLength={60}
                  className="w-full px-4 py-3 rounded-xl border border-white/10 bg-[#141517] text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#5865F2]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Professional Headline <span className="text-[#5865F2]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  placeholder="e.g. Systems Engineer & Open Source Builder"
                  maxLength={160}
                  className="w-full px-4 py-3 rounded-xl border border-white/10 bg-[#141517] text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#5865F2]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  About / Bio
                </label>
                <textarea
                  rows={4}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell the community about what you craft, architectures you work on, or projects you are launching..."
                  maxLength={1000}
                  className="w-full px-4 py-3 rounded-xl border border-white/10 bg-[#141517] text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#5865F2] resize-none"
                />
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={saving || !headline.trim()}
                  className="px-6 py-3 bg-[#5865F2] hover:bg-[#4752C4] disabled:opacity-40 text-white text-xs font-bold rounded-xl transition flex items-center gap-2 cursor-pointer shadow-lg shadow-[#5865F2]/25"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <span>Next: Visual Identity</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* STEP 2: PROFILE MEDIA */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="space-y-4">
                <FileUpload
                  label="Profile Picture"
                  currentValue={avatar}
                  onUploadSuccess={(file) => setAvatar(file.url)}
                  onRemove={() => setAvatar("")}
                  token={token}
                />

                <FileUpload
                  label="Cover Banner Image"
                  currentValue={coverImage}
                  onUploadSuccess={(file) => setCoverImage(file.url)}
                  onRemove={() => setCoverImage("")}
                  token={token}
                />
              </div>

              <div className="pt-4 flex items-center justify-between border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="text-xs text-zinc-400 hover:text-white flex items-center gap-1.5 transition"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleSaveStep2(true)}
                    className="px-4 py-2.5 text-xs text-zinc-400 hover:text-white transition"
                  >
                    Skip for now
                  </button>
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => handleSaveStep2(false)}
                    className="px-6 py-2.5 bg-[#5865F2] hover:bg-[#4752C4] text-white text-xs font-bold rounded-xl transition flex items-center gap-2 cursor-pointer shadow-lg shadow-[#5865F2]/25"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <span>Continue to Interests</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: CRAFT & INTERESTS */}
          {currentStep === 3 && (
            <form onSubmit={handleSaveStep3} className="space-y-6">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-2">
                  Select Topics & Interests <span className="text-[#5865F2]">*</span>
                </label>
                <div className="flex flex-wrap gap-2 mb-4">
                  {POPULAR_INTERESTS.map((item) => {
                    const isSelected = interests.includes(item);
                    return (
                      <button
                        key={item}
                        type="button"
                        onClick={() => toggleInterest(item)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer ${
                          isSelected
                            ? "bg-[#5865F2] text-white font-bold shadow-xs"
                            : "bg-[#141517] text-zinc-400 hover:bg-[#383A40] hover:text-white border border-white/5"
                        }`}
                      >
                        {item}
                      </button>
                    );
                  })}
                </div>

                {/* Custom Interest Input */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customInterest}
                    onChange={(e) => setCustomInterest(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addCustomInterest();
                      }
                    }}
                    placeholder="Add a custom interest tag..."
                    className="flex-1 px-4 py-2 rounded-xl border border-white/10 bg-[#141517] text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#5865F2]"
                  />
                  <button
                    type="button"
                    onClick={addCustomInterest}
                    className="px-4 py-2 bg-[#383A40] hover:bg-[#5865F2] hover:text-white text-xs font-bold rounded-xl transition cursor-pointer"
                  >
                    Add
                  </button>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-between border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="text-xs text-zinc-400 hover:text-white flex items-center gap-1.5 transition"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>

                <button
                  type="submit"
                  disabled={saving || interests.length === 0}
                  className="px-6 py-3 bg-[#5865F2] hover:bg-[#4752C4] disabled:opacity-40 text-white text-xs font-bold rounded-xl transition flex items-center gap-2 cursor-pointer shadow-lg shadow-[#5865F2]/25"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Finalizing Profile...</span>
                    </>
                  ) : (
                    <>
                      <span>Complete & Enter POPPIN</span>
                      <CheckCircle2 className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
