"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  Loader2,
  CheckCircle2,
  KeyRound,
  X,
} from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();

  const nextUrl = searchParams.get("next") || "/feed";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Forgot password modal state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotStatus, setForgotStatus] = useState<{
    loading: boolean;
    success?: boolean;
    message?: string;
    resetToken?: string;
  }>({ loading: false });

  // Reset password state
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);

    try {
      const res = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (data.success && data.data?.token) {
        login(data.data.token, data.data.user);
        router.push(nextUrl);
      } else {
        setErrorMsg(data.error?.message || "Invalid credentials. Please verify your details.");
      }
    } catch {
      setErrorMsg("Failed to connect to authentication server. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) return;

    setForgotStatus({ loading: true });

    try {
      const res = await fetch("/api/v1/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail }),
      });
      const data = await res.json();

      if (data.success) {
        setForgotStatus({
          loading: false,
          success: true,
          message: data.message || "Password recovery token generated.",
          resetToken: data.data?.resetToken,
        });
        if (data.data?.resetToken) {
          setResetToken(data.data.resetToken);
        }
      } else {
        setForgotStatus({
          loading: false,
          success: false,
          message: data.error?.message || "Could not generate recovery token.",
        });
      }
    } catch {
      setForgotStatus({
        loading: false,
        success: false,
        message: "Network error requesting password reset.",
      });
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetLoading(true);

    try {
      const res = await fetch("/api/v1/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: resetToken,
          newPassword,
        }),
      });
      const data = await res.json();

      if (data.success) {
        setResetSuccess(true);
        setTimeout(() => {
          setShowForgotModal(false);
          setResetSuccess(false);
          setForgotStatus({ loading: false });
        }, 2000);
      } else {
        setErrorMsg(data.error?.message || "Failed to reset password.");
      }
    } catch {
      setErrorMsg("Network error resetting password.");
    } finally {
      setResetLoading(false);
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
            Welcome back.
          </h1>
          <p className="mt-2 text-sm text-zinc-400 font-sans">
            Sign in to continue to your feed and discussions
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

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-semibold text-zinc-300 mb-1.5"
              >
                Email address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alex@poppin.social"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-white/10 bg-[#141517] text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-[#5865F2]/20 focus:border-[#5865F2] transition-all placeholder:text-zinc-500"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="password"
                  className="block text-xs font-semibold text-zinc-300"
                >
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="text-xs font-semibold text-[#8A9BFF] hover:text-white transition"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-white/10 bg-[#141517] text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-[#5865F2]/20 focus:border-[#5865F2] transition-all placeholder:text-zinc-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full min-h-[44px] inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-[#5865F2] hover:bg-[#4752C4] text-white font-semibold text-sm shadow-md shadow-[#5865F2]/25 transition-all disabled:opacity-50 active:scale-[0.98] mt-2 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer Link */}
        <p className="mt-6 text-center text-sm text-zinc-400">
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="font-semibold text-[#8A9BFF] hover:underline"
          >
            Create account
          </Link>
        </p>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-[#1E1F22] w-full max-w-md rounded-2xl p-6 sm:p-7 shadow-2xl border border-white/10 text-[#F2F3F5]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-white font-heading font-bold text-base">
                <KeyRound className="w-5 h-5 text-[#8A9BFF]" />
                <span>Recover Account Password</span>
              </div>
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="text-zinc-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {resetSuccess ? (
              <div className="p-4 bg-emerald-500/10 text-emerald-300 rounded-xl flex items-center gap-2 text-sm border border-emerald-500/20">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span>Password successfully reset! Logging you in...</span>
              </div>
            ) : !forgotStatus.success ? (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <p className="text-sm text-zinc-300">
                  Enter your registered email address to generate a secure recovery token.
                </p>
                <div>
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="your-email@poppin.social"
                    className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-[#141517] text-white text-sm font-medium focus:ring-2 focus:ring-[#5865F2]/20 focus:border-[#5865F2] outline-none placeholder:text-zinc-500"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={forgotStatus.loading}
                    className="px-5 py-2 rounded-xl bg-[#5865F2] hover:bg-[#4752C4] text-white font-semibold text-sm disabled:opacity-50 flex items-center gap-2"
                  >
                    {forgotStatus.loading && <Loader2 className="w-4 h-4 animate-spin text-white" />}
                    <span>Request Recovery</span>
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="p-3 bg-emerald-500/10 text-emerald-300 rounded-xl text-xs font-semibold border border-emerald-500/20">
                  Recovery token created! Enter your new password below.
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Recovery Token
                  </label>
                  <input
                    type="text"
                    required
                    value={resetToken}
                    onChange={(e) => setResetToken(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-[#141517] text-white text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    New Password
                  </label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    maxLength={72}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min 8 characters"
                    className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-[#141517] text-white text-sm font-medium focus:ring-2 focus:ring-[#5865F2]/20 outline-none placeholder:text-zinc-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={resetLoading}
                  className="w-full py-2.5 rounded-xl bg-[#5865F2] hover:bg-[#4752C4] text-white font-semibold text-sm flex items-center justify-center gap-2"
                >
                  {resetLoading && <Loader2 className="w-4 h-4 animate-spin text-white" />}
                  <span>Set New Password</span>
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center min-h-[60vh] bg-[#080914]">
          <Loader2 className="w-6 h-6 animate-spin text-[#5865F2]" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
