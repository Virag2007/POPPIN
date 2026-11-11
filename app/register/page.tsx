"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  Lock,
  Mail,
  AlertCircle,
  Loader2,
  CheckCircle2,
  XCircle,
  Sparkles,
} from "lucide-react";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();

  const [username, setUsername] = useState(searchParams.get("username") || "");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Live username availability check state
  const [usernameStatus, setUsernameStatus] = useState<{
    loading: boolean;
    available?: boolean;
    message?: string;
  }>({ loading: false });

  // Debounced username availability validation
  useEffect(() => {
    const cleanUsername = username.trim().toLowerCase();
    if (!cleanUsername) {
      setUsernameStatus({ loading: false });
      return;
    }

    if (cleanUsername.length < 3 || cleanUsername.length > 30) {
      setUsernameStatus({
        loading: false,
        available: false,
        message: "Handle must be 3-30 characters",
      });
      return;
    }

    if (!/^[a-z0-9_]+$/.test(cleanUsername)) {
      setUsernameStatus({
        loading: false,
        available: false,
        message: "Only letters, numbers, and underscores allowed",
      });
      return;
    }

    setUsernameStatus({ loading: true });
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/v1/usernames/availability?username=${encodeURIComponent(cleanUsername)}`
        );
        const data = await res.json();
        if (data.success && data.data) {
          setUsernameStatus({
            loading: false,
            available: data.data.isAvailable,
            message: data.data.reason,
          });
        } else {
          setUsernameStatus({
            loading: false,
            available: false,
            message: data.error?.message || "Invalid handle",
          });
        }
      } catch {
        setUsernameStatus({
          loading: false,
          available: false,
          message: "Could not verify handle availability",
        });
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [username]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Password validation
    if (password.length < 8) {
      setErrorMsg("Password must be at least 8 characters long.");
      return;
    }

    if (password.length > 72) {
      setErrorMsg("Password cannot exceed 72 characters (bcrypt limit).");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match. Please re-enter.");
      return;
    }

    if (usernameStatus.available === false) {
      setErrorMsg("Please choose an available username.");
      return;
    }

    setIsLoading(true);

    try {
      // 1. Register User Account
      const regRes = await fetch("/api/v1/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const regData = await regRes.json();

      if (!regData.success || !regData.data?.token) {
        setErrorMsg(regData.error?.message || "Registration failed. Email may already be in use.");
        setIsLoading(false);
        return;
      }

      const token = regData.data.token;
      const user = regData.data.user;

      // Log in in AuthContext
      login(token, user);

      // 2. Initialize Profile with chosen username
      const profileRes = await fetch("/api/v1/users/me/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          username: username.toLowerCase().trim(),
          displayName: username.trim(),
        }),
      });

      const profileData = await profileRes.json();

      if (profileData.success) {
        // Direct to 3-step onboarding flow
        router.push("/onboarding");
      } else {
        // If profile creation hit an unexpected error, proceed to onboarding anyway
        router.push("/onboarding");
      }
    } catch {
      setErrorMsg("Failed to connect to registration service. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white via-slate-50 to-[#F8FAFC]">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block relative h-14 w-36 mb-4">
            <Image
              src="/brand/poppin-logo.png"
              alt="Poppin."
              fill
              className="object-contain"
              priority
            />
          </Link>
          <h1 className="text-2xl font-extrabold text-poppin-navy tracking-tight">
            Join the Poppin. Community
          </h1>
          <p className="mt-1.5 text-sm text-slate-600">
            Create your account and claim your unique identity
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-white p-7 sm:p-8 rounded-3xl border border-slate-200/90 shadow-sm">
          {errorMsg && (
            <div
              role="alert"
              className="mb-6 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-2.5"
            >
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            {/* Handle / Username */}
            <div>
              <label
                htmlFor="username"
                className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
              >
                Choose Username
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold select-none text-base">@</span>
                <input
                  id="username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                  placeholder="your_handle"
                  maxLength={30}
                  className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-slate-300 bg-slate-50/50 text-sm font-semibold text-poppin-navy focus:bg-white focus:outline-none focus:ring-2 focus:ring-poppin-lilac focus:border-poppin-lilac transition-all"
                />
                <div className="absolute right-3 top-3 flex items-center pointer-events-none">
                  {usernameStatus.loading ? (
                    <Loader2 className="w-4 h-4 text-poppin-lilac animate-spin" />
                  ) : usernameStatus.available ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : username.length > 0 ? (
                    <XCircle className="w-4 h-4 text-rose-500" />
                  ) : null}
                </div>
              </div>
              {usernameStatus.message && (
                <p
                  className={`mt-1.5 text-xs font-semibold ${
                    usernameStatus.available ? "text-emerald-700" : "text-rose-600"
                  }`}
                >
                  {usernameStatus.message}
                </p>
              )}
            </div>

            {/* Email Address */}
            <div>
              <label
                htmlFor="reg-email"
                className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
              >
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  id="reg-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alex@poppin.social"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 bg-slate-50/50 text-sm font-medium text-poppin-navy focus:bg-white focus:outline-none focus:ring-2 focus:ring-poppin-lilac focus:border-poppin-lilac transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="reg-password"
                className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
              >
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  id="reg-password"
                  type="password"
                  required
                  minLength={8}
                  maxLength={72}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 8 characters, max 72"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 bg-slate-50/50 text-sm font-medium text-poppin-navy focus:bg-white focus:outline-none focus:ring-2 focus:ring-poppin-lilac focus:border-poppin-lilac transition-all"
                />
              </div>
              <div className="mt-1 flex items-center justify-between text-2xs text-slate-500 font-medium">
                <span>8–72 characters (bcrypt safe)</span>
                <span>{password.length}/72</span>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label
                htmlFor="reg-confirm-password"
                className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
              >
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  id="reg-confirm-password"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat your password"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 bg-slate-50/50 text-sm font-medium text-poppin-navy focus:bg-white focus:outline-none focus:ring-2 focus:ring-poppin-lilac focus:border-poppin-lilac transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || (username.length > 0 && usernameStatus.available === false)}
              className="w-full min-h-[48px] mt-2 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-poppin-navy text-white font-extrabold text-sm hover:bg-poppin-navy-light shadow-xs hover:shadow-md transition-all disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-poppin-lilac"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-poppin-lilac" />
                  <span>Creating your account...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-poppin-lilac" />
                  <span>Create Account & Continue</span>
                </>
              )}
            </button>
          </form>

          {/* Social Auth Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-3 text-slate-400 font-bold">Or register with</span>
            </div>
          </div>

          {/* Google OAuth Button */}
          <a
            href="/api/v1/auth/google"
            className="w-full min-h-[46px] inline-flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-sm font-semibold text-slate-700 shadow-2xs hover:border-slate-400 transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-poppin-lilac"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Google Account</span>
          </a>
        </div>

        {/* Footer Link */}
        <p className="mt-6 text-center text-sm text-slate-600">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-bold text-poppin-lilac hover:text-poppin-lilac-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-poppin-lilac rounded"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-poppin-lilac" />
        </div>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}


