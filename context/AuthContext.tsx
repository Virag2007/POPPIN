"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { SafeProfile } from "@/types";

export interface AuthContextType {
  user: { id: string; email: string } | null;
  profile: SafeProfile | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string, user: { id: string; email: string }) => void;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateProfileState: (profile: SafeProfile) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  token: null,
  isLoading: true,
  login: () => {},
  logout: async () => {},
  refreshUser: async () => {},
  updateProfileState: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [profile, setProfile] = useState<SafeProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = useCallback(async (authToken: string) => {
    try {
      const res = await fetch("/api/v1/users/me/profile", {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) {
        const body = await res.json();
        if (body.success && body.data) {
          setProfile(body.data);
        }
      }
    } catch {
      // Profile not created yet or request failed
    }
  }, []);

  const refreshUser = useCallback(async () => {
    const savedToken = localStorage.getItem("poppin_jwt");
    if (!savedToken) {
      setUser(null);
      setProfile(null);
      setIsLoading(false);
      return;
    }

    setToken(savedToken);

    try {
      const res = await fetch("/api/v1/auth/me", {
        headers: { Authorization: `Bearer ${savedToken}` },
      });

      if (res.ok) {
        const body = await res.json();
        if (body.success && body.data) {
          setUser(body.data);
          await fetchProfile(savedToken);
        } else {
          localStorage.removeItem("poppin_jwt");
          setUser(null);
          setProfile(null);
        }
      } else {
        localStorage.removeItem("poppin_jwt");
        setUser(null);
        setProfile(null);
      }
    } catch {
      // Server error or network issue
    } finally {
      setIsLoading(false);
    }
  }, [fetchProfile]);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = (authToken: string, authUser: { id: string; email: string }) => {
    localStorage.setItem("poppin_jwt", authToken);
    // Ensure document.cookie is synced for client-side navigation
    if (typeof document !== "undefined") {
      document.cookie = `poppin_token=${authToken}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
    }
    setToken(authToken);
    setUser(authUser);
    fetchProfile(authToken);
  };

  const logout = async () => {
    // 1. Immediately wipe local auth credentials and state synchronously for instant UI response
    localStorage.removeItem("poppin_jwt");
    if (typeof document !== "undefined") {
      document.cookie = "poppin_token=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
    }
    setToken(null);
    setUser(null);
    setProfile(null);

    // 2. Fire session revocation in background without blocking UI
    try {
      fetch("/api/v1/auth/logout", { method: "POST", keepalive: true }).catch(() => {});
    } catch {
      // Ignore network errors on logout
    }

    // 3. Immediately redirect to login
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
  };

  const updateProfileState = (updated: SafeProfile) => {
    setProfile(updated);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        token,
        isLoading,
        login,
        logout,
        refreshUser,
        updateProfileState,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

