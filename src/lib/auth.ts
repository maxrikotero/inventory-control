"use client";

import { User } from "@/types/user";

const STORAGE_KEY = "mock_user";

export function getUserFromStorage(): User | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

export async function mockSignIn(
  email: string,
  password: string
): Promise<User> {
  // Mock implementation - password is unused but kept for future real auth
  console.log(
    "Mock login for:",
    email,
    password ? "with password" : "without password"
  );
  const user: User = {
    id: "mock-" + Math.random().toString(36).slice(2),
    email,
    name: email.split("@")[0] || "Usuario",
  };
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  }
  return user;
}

export async function mockSignOut(): Promise<void> {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(STORAGE_KEY);
  }
}
