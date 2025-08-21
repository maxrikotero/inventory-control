"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { User } from "@/types/user";
import {
  getAuthenticatedUser,
  loginUser,
  logoutUser,
  registerUser,
  initializeDemoUser,
} from "@/lib/auth-service";
import { UserRegistrationData } from "@/types/user";

type AuthContextValue = {
  user: User | null;
  signIn: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: string }>;
  signUp: (
    userData: UserRegistrationData
  ) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  loading: boolean;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Initialize demo user first
        initializeDemoUser();

        const authenticatedUser = getAuthenticatedUser();
        setUser(authenticatedUser);
      } catch (error) {
        console.error("Error initializing auth:", error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      async signIn(email: string, password: string) {
        setLoading(true);
        try {
          const result = await loginUser(email, password);
          if (result.success && result.user) {
            setUser(result.user);
          }
          return result;
        } finally {
          setLoading(false);
        }
      },
      async signUp(userData: UserRegistrationData) {
        setLoading(true);
        try {
          const result = await registerUser(userData);
          if (result.success && result.user) {
            setUser(result.user);
          }
          return result;
        } finally {
          setLoading(false);
        }
      },
      async signOut() {
        setLoading(true);
        try {
          await logoutUser();
          setUser(null);
        } finally {
          setLoading(false);
        }
      },
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
