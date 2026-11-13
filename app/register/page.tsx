"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  Lock,
  Mail,
  AlertCircle,
  Loader2,
  CheckCircle2,
  XCircle,
  ArrowRight,
} from "lucide-react";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();

  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState(searchParams.get("username") || "");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Email verification screen state
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [devCodeHint, setDevCodeHint] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

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
        message: "Only lowercase letters, numbers, and underscores allowed",
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
        body: JSON.stringify({
          email: email.toLowerCase().trim(),
          password,
          confirmPassword,
          username: username.toLowerCase().trim(),
          displayName: displayName.trim() || undefined,
          name: displayName.trim() || username.trim(),
        }),
      });

      const regData = await regRes.json();

      if (!regData.success) {
        setErrorMsg(regData.error?.message || "Registration failed. Email or username may already be in use.");
        setIsLoading(false);
        return;
      }

      // If email verification is required, transition to verification UI
      if (regData.data?.requiresVerification) {
        setIsVerifying(true);
        if (regData.data.verificationCode) {
          setDevCodeHint(regData.data.verificationCode);
        }
        setIsLoading(false);
        return;
      }

      if (regData.data?.token) {
        login(regData.data.token, regData.data.user);
        router.push("/onboarding");
      }
    } catch {
      setErrorMsg("Network error during registration. Please try again.");
      setIsLoading(false);
    }
  };

  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationCode.trim()) {
      setErrorMsg("Please enter the 6-digit verification code.");
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/v1/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.toLowerCase().trim(),
          token: verificationCode.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success || !data.data?.token) {
        setErrorMsg(data.error?.message || "Invalid or expired verification code.");
        setIsLoading(false);
        return;
      }

      login(data.data.token, data.data.user);
      router.push("/onboarding");
    } catch {
      setErrorMsg("Network error during verification. Please try again.");
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    setIsResending(true);
    setErrorMsg(null);
    setResendSuccess(false);

    try {
      const res = await fetch("/api/v1/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.toLowerCase().trim() }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setResendSuccess(true);
        if (data.data?.verificationCode) {
          setDevCodeHint(data.data.verificationCode);
        }
      } else {
        setErrorMsg(data.error?.message || "Could not resend code.");
      }
    } catch {
      setErrorMsg("Network error. Could not resend verification code.");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-center items-center py-16 px-4 sm:px-6 lg:px-8 bg-[#080914] text-[#F2F3F5] min-h-[calc(100vh-4rem)]">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#5865F2] to-[#8A9BFF] flex items-center justify-center font-heading font-black text-white text-base shadow-lg shadow-[#5865F2]/30">
              P
            </div>
            <span className="font-heading text-2xl font-black tracking-tight text-white">
              POPPIN<span className="text-[#5865F2]">.</span>
            </span>
          </Link>
          <h1 className="text-2xl font-black text-white tracking-tight font-heading">
            Create your account.
          </h1>
          <p className="mt-2 text-sm text-zinc-400 font-sans">
            Claim your handle and join top builder communities
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-[#1E1F22] p-7 sm:p-8 rounded-2xl border border-white/10 shadow-2xl">
          {errorMsg && (
            <div
              role="alert"
              className="mb-6 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm flex items-start gap-2.5"
            >
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {isVerifying ? (
            /* Email Verification Step */
            <form onSubmit={handleVerifyEmail} className="space-y-4">
              <div className="text-center pb-2">
                <div className="w-12 h-12 rounded-2xl bg-[#5865F2]/20 border border-[#5865F2]/40 text-[#5865F2] flex items-center justify-center mx-auto mb-3">
                  <Mail className="w-6 h-6" />
                </div>
                <h2 className="text-lg font-bold text-white font-heading">Verify Your Email</h2>
                <p className="text-xs text-zinc-400 mt-1 max-w-xs mx-auto">
                  We sent a 6-digit confirmation code to <strong className="text-white">{email}</strong>.
                </p>
                {devCodeHint && (
                  <div className="mt-3 p-2 bg-[#5865F2]/10 border border-[#5865F2]/30 rounded-xl text-xs text-[#8A9BFF] font-mono">
                    Verification Code: <span className="font-bold tracking-widest text-white">{devCodeHint}</span>
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="code" className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Enter 6-Digit Code
                </label>
                <input
                  id="code"
                  type="text"
                  required
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.trim())}
                  placeholder="123456"
                  maxLength={6}
                  className="w-full text-center tracking-widest font-mono text-lg py-3 rounded-xl border border-white/10 bg-[#141517] text-white focus:outline-none focus:ring-2 focus:ring-[#5865F2] transition-all"
                />
              </div>

              {resendSuccess && (
                <p className="text-xs text-emerald-400 text-center font-medium">
                  A fresh verification code has been generated!
                </p>
              )}

              <button
                type="submit"
                disabled={isLoading || verificationCode.length < 4}
                className="w-full py-3 px-4 rounded-xl font-bold text-sm text-white bg-[#5865F2] hover:bg-[#4752C4] shadow-lg shadow-[#5865F2]/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <span>Verify & Continue</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  disabled={isResending}
                  onClick={handleResendCode}
                  className="text-xs text-zinc-400 hover:text-white transition disabled:opacity-50"
                >
                  {isResending ? "Resending..." : "Didn't receive the code? Resend"}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              {/* Display Name */}
              <div>
                <label
                  htmlFor="displayName"
                  className="block text-xs font-semibold text-zinc-300 mb-1.5"
                >
                  Display Name
                </label>
                <input
                  id="displayName"
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Alex Rivera"
                  maxLength={60}
                  className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-[#141517] text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-[#5865F2]/20 focus:border-[#5865F2] transition-all placeholder:text-zinc-500"
                />
              </div>

              {/* Handle / Username */}
              <div>
                <label
                  htmlFor="username"
                  className="block text-xs font-semibold text-zinc-300 mb-1.5"
                >
                  Choose username
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-zinc-500 font-semibold select-none text-sm">@</span>
                  <input
                    id="username"
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                    placeholder="your_handle"
                    maxLength={30}
                    className="w-full pl-8 pr-10 py-2.5 rounded-xl border border-white/10 bg-[#141517] text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-[#5865F2]/20 focus:border-[#5865F2] transition-all placeholder:text-zinc-500"
                  />
                  <div className="absolute right-3.5 top-3 flex items-center pointer-events-none">
                    {usernameStatus.loading ? (
                      <Loader2 className="w-4 h-4 text-zinc-400 animate-spin" />
                    ) : usernameStatus.available ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : username.length > 0 ? (
                      <XCircle className="w-4 h-4 text-rose-400" />
                    ) : null}
                  </div>
                </div>
                {usernameStatus.message && (
                  <p
                    className={`mt-1.5 text-xs font-medium ${
                      usernameStatus.available ? "text-emerald-400" : "text-rose-400"
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
                  className="block text-xs font-semibold text-zinc-300 mb-1.5"
                >
                  Email address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
                  <input
                    id="reg-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="alex@poppin.social"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-white/10 bg-[#141517] text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-[#5865F2]/20 focus:border-[#5865F2] transition-all placeholder:text-zinc-500"
                  />
                </div>
              </div>

            {/* Password */}
            <div>
              <label
                htmlFor="reg-password"
                className="block text-xs font-semibold text-zinc-300 mb-1.5"
              >
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
                <input
                  id="reg-password"
                  type="password"
                  required
                  minLength={8}
                  maxLength={72}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 8 characters, max 72"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-white/10 bg-[#141517] text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-[#5865F2]/20 focus:border-[#5865F2] transition-all placeholder:text-zinc-500"
                />
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label
                htmlFor="confirm-password"
                className="block text-xs font-semibold text-zinc-300 mb-1.5"
              >
                Confirm password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
                <input
                  id="confirm-password"
                  type="password"
                  required
                  minLength={8}
                  maxLength={72}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-white/10 bg-[#141517] text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-[#5865F2]/20 focus:border-[#5865F2] transition-all placeholder:text-zinc-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || usernameStatus.available === false}
              className="w-full min-h-[44px] inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-[#5865F2] hover:bg-[#4752C4] text-white font-semibold text-sm shadow-md shadow-[#5865F2]/25 transition-all disabled:opacity-50 active:scale-[0.98] mt-2 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Creating account...</span>
                </>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
          )}
        </div>

        {/* Footer Link */}
        <p className="mt-6 text-center text-sm text-zinc-400">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-semibold text-[#8A9BFF] hover:underline"
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
        <div className="flex-1 flex items-center justify-center min-h-[60vh] bg-[#080914]">
          <Loader2 className="w-6 h-6 animate-spin text-[#5865F2]" />
        </div>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}
