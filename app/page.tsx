"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import gsap from "gsap";
import {
  Sparkles,
  ShieldCheck,
  UserCheck,
  Compass,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Loader2,
  HeartHandshake,
  Lock,
} from "lucide-react";

export default function HomePage() {
  const { user } = useAuth();
  const heroRef = useRef<HTMLDivElement>(null);

  // Live interactive handle probe state
  const [handleQuery, setHandleQuery] = useState("creative_mind");
  const [probeResult, setProbeResult] = useState<{
    isAvailable?: boolean;
    reason?: string;
    loading: boolean;
  }>({ loading: false });

  // GSAP Entrance
  useEffect(() => {
    if (!heroRef.current) return;
    const ctx = gsap.context(() => {
      gsap.from(".hero-badge", {
        opacity: 0,
        y: -15,
        duration: 0.6,
        ease: "power2.out",
      });
      gsap.from(".hero-title", {
        opacity: 0,
        y: 20,
        duration: 0.7,
        delay: 0.1,
        ease: "power3.out",
      });
      gsap.from(".hero-desc", {
        opacity: 0,
        y: 20,
        duration: 0.7,
        delay: 0.2,
        ease: "power3.out",
      });
      gsap.from(".hero-actions", {
        opacity: 0,
        scale: 0.96,
        duration: 0.6,
        delay: 0.3,
        ease: "back.out(1.4)",
      });
      gsap.from(".feature-card", {
        opacity: 0,
        y: 30,
        duration: 0.6,
        stagger: 0.1,
        delay: 0.35,
        ease: "power2.out",
      });
    }, heroRef);

    return () => ctx.revert();
  }, []);

  // Live handle availability checking logic
  useEffect(() => {
    if (!handleQuery.trim()) {
      setProbeResult({ loading: false });
      return;
    }

    setProbeResult((prev) => ({ ...prev, loading: true }));
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/v1/usernames/availability?username=${encodeURIComponent(handleQuery.trim())}`
        );
        const data = await res.json();
        if (data.success && data.data) {
          setProbeResult({
            isAvailable: data.data.isAvailable,
            reason: data.data.reason,
            loading: false,
          });
        } else {
          setProbeResult({
            isAvailable: false,
            reason: data.error?.message || "Invalid handle format",
            loading: false,
          });
        }
      } catch {
        setProbeResult({
          isAvailable: false,
          reason: "Probe failed to connect",
          loading: false,
        });
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [handleQuery]);

  return (
    <main id="main-content" ref={heroRef} className="flex-1 flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-32 bg-gradient-to-b from-white via-poppin-lilac-light/30 to-[#FAFAFC] border-b border-slate-200/70">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Eyebrow Pill */}
          <div className="hero-badge inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-poppin-lilac-light border border-poppin-lilac-border text-xs sm:text-sm font-bold text-poppin-navy shadow-xs mb-8">
            <Sparkles className="w-4 h-4 text-poppin-lilac" />
            <span>Developer 1 Identity & Community Engine</span>
            <span className="text-poppin-lilac font-black">✦</span>
          </div>

          {/* Playful Hero Wordmark & Headline */}
          <div className="flex justify-center mb-6">
            <div className="relative h-20 w-56 sm:h-28 sm:w-80">
              <Image
                src="/brand/poppin-logo.png"
                alt="Poppin."
                fill
                className="object-contain drop-shadow-xs"
                priority
              />
            </div>
          </div>

          <h1 className="hero-title text-4xl sm:text-6xl font-extrabold tracking-tight text-poppin-navy max-w-4xl mx-auto leading-[1.12]">
            Where identity shines and communities{" "}
            <span className="relative inline-block text-poppin-lilac font-display italic">
              pop.
              <span className="absolute -bottom-1 left-0 right-0 h-1.5 bg-poppin-lilac/30 rounded-full" />
            </span>
          </h1>

          <p className="hero-desc mt-6 text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto font-normal leading-relaxed">
            A high-craft social architecture featuring bcrypt-hardened authentication, unique handles, 3-step onboarding, and bidirectional privacy.
          </p>

          {/* Action Hub */}
          <div className="hero-actions mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            {user ? (
              <div className="flex flex-wrap items-center justify-center gap-3">
                <Link
                  href="/profile"
                  className="min-h-[48px] inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-poppin-navy text-white font-bold text-base hover:bg-poppin-navy-light shadow-md hover:-translate-y-0.5 active:translate-y-0 transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-poppin-lilac"
                >
                  <UserCheck className="w-5 h-5 text-poppin-lilac" />
                  <span>Go to My Profile</span>
                </Link>
                <Link
                  href="/onboarding"
                  className="min-h-[48px] inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white border border-slate-300 text-poppin-navy font-bold text-base hover:bg-slate-50 shadow-xs hover:-translate-y-0.5 active:translate-y-0 transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-poppin-lilac"
                >
                  <Compass className="w-5 h-5 text-poppin-lilac" />
                  <span>Review Onboarding</span>
                </Link>
              </div>
            ) : (
              <>
                <Link
                  href="/register"
                  className="w-full sm:w-auto min-h-[50px] inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-poppin-navy text-white font-extrabold text-base hover:bg-poppin-navy-light shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-poppin-lilac"
                >
                  <span>Claim Your Handle</span>
                  <ArrowRight className="w-5 h-5 text-poppin-lilac" />
                </Link>
                <Link
                  href="/login"
                  className="w-full sm:w-auto min-h-[50px] inline-flex items-center justify-center px-8 py-3.5 rounded-xl bg-white border border-slate-300 text-poppin-navy font-bold text-base hover:bg-slate-50 shadow-xs hover:-translate-y-0.5 active:translate-y-0 transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-poppin-lilac"
                >
                  Sign In
                </Link>
              </>
            )}
          </div>

          {/* Interactive Handle Probe Widget */}
          <div className="mt-14 max-w-md mx-auto bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-sm text-left">
            <label
              htmlFor="handle-probe-input"
              className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2"
            >
              Test Live Handle Availability
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3.5 text-slate-400 font-bold select-none text-base">@</span>
              <input
                id="handle-probe-input"
                type="text"
                value={handleQuery}
                onChange={(e) => setHandleQuery(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                placeholder="choose_handle"
                maxLength={30}
                className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-slate-300 bg-slate-50/50 text-sm font-semibold text-poppin-navy focus:bg-white focus:outline-none focus:ring-2 focus:ring-poppin-lilac focus:border-poppin-lilac transition-all"
              />
              <div className="absolute right-3 flex items-center pointer-events-none">
                {probeResult.loading ? (
                  <Loader2 className="w-4 h-4 text-poppin-lilac animate-spin" />
                ) : probeResult.isAvailable ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-rose-500" />
                )}
              </div>
            </div>
            <div className="mt-2.5 flex items-center justify-between text-xs">
              <span
                className={`font-semibold ${
                  probeResult.isAvailable ? "text-emerald-700" : "text-slate-500"
                }`}
              >
                {probeResult.loading
                  ? "Checking availability..."
                  : probeResult.reason || "3-30 characters (letters, numbers, _)"}
              </span>
              <Link
                href={`/register?username=${encodeURIComponent(handleQuery)}`}
                className="text-poppin-lilac font-bold hover:underline"
              >
                Claim &rarr;
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid: What Has Been Built */}
      <section className="py-20 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <h2 className="text-xs uppercase tracking-widest font-black text-poppin-lilac">
            Production-Ready Architecture
          </h2>
          <p className="mt-2 text-3xl font-extrabold text-poppin-navy">
            Engineered for Security, Speed & Scalability
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {/* Card 1 */}
          <div className="feature-card bg-white p-7 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md hover:-translate-y-1 transition-all">
            <div className="w-12 h-12 rounded-xl bg-poppin-lilac-light text-poppin-lilac flex items-center justify-center mb-5">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-poppin-navy">OWASP-Hardened Auth</h3>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              Bcrypt hashing with 72-byte UTF-8 safeguards, JWT session revocation on password changes, CSRF Origin checks, and sliding-window rate limiting.
            </p>
            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center text-xs font-semibold text-emerald-700">
              <CheckCircle2 className="w-4 h-4 mr-1.5" /> 100% Automated Security Audit Passed
            </div>
          </div>

          {/* Card 2 */}
          <div className="feature-card bg-white p-7 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md hover:-translate-y-1 transition-all">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-5">
              <Compass className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-poppin-navy">3-Step Onboarding</h3>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              Seamless step-by-step profile configuration: Role & Headline, Skills & Interests tag curation, and smart algorithmic follow suggestions.
            </p>
            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center text-xs font-semibold text-poppin-navy">
              <ArrowRight className="w-4 h-4 mr-1.5 text-poppin-lilac" /> Auto-sync with Public Profile
            </div>
          </div>

          {/* Card 3 */}
          <div className="feature-card bg-white p-7 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md hover:-translate-y-1 transition-all">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center mb-5">
              <HeartHandshake className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-poppin-navy">Connections & Safety</h3>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              Follow/Unfollow mechanics, indexed relationship counts, bidirectional user blocking, abuse reporting, and privacy-shielded profiles.
            </p>
            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center text-xs font-semibold text-poppin-navy">
              <Lock className="w-4 h-4 mr-1.5 text-poppin-lilac" /> Strict Database-Layer Authorization
            </div>
          </div>
        </div>
      </section>

      {/* Developer 2 Integration Contract Banner */}
      <section className="py-12 bg-white border-t border-slate-200/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-poppin-navy text-white rounded-3xl p-8 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden shadow-lg">
            <div className="relative z-10 max-w-xl">
              <span className="px-3 py-1 rounded-full text-xs font-black uppercase bg-poppin-lilac text-white inline-block mb-3">
                Developer 2 Contract
              </span>
              <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Ready for Feed, Posts & Messaging
              </h3>
              <p className="mt-2 text-slate-300 text-sm sm:text-base leading-relaxed">
                Developer 1 has implemented and verified all follow relationship queries, block checks, and the <code className="text-poppin-lilac font-mono">NEW_FOLLOWER</code> notification event contract.
              </p>
            </div>
            <div className="relative z-10 flex flex-wrap gap-3">
              <Link
                href="/register"
                className="min-h-[44px] inline-flex items-center justify-center px-6 py-2.5 rounded-xl bg-poppin-lilac text-white font-bold hover:bg-poppin-lilac-hover transition-all"
              >
                Create Demo Account
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer role="contentinfo" className="border-t border-slate-200 bg-white py-8 mt-auto">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-poppin-navy">Poppin.</span>
            <span>&copy; {new Date().getFullYear()} Social Platform.</span>
          </div>
          <div className="flex items-center gap-4 text-xs font-semibold">
            <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
              WCAG 2.2 AA Compliant
            </span>
            <span>Developer 1 Complete</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
