"use client";

import { create } from "zustand";
import type { Profile } from "@/types";

interface AuthState {
  user: Profile | null;
  isLoading: boolean;
  hasFetched: boolean;
  setUser: (u: Profile | null) => void;
  setLoading: (b: boolean) => void;
  fetch: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: true,
  hasFetched: false,
  setUser: (u) => set({ user: u }),
  setLoading: (b) => set({ isLoading: b }),
  fetch: async () => {
    try {
      set({ isLoading: true });
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      if (!res.ok) {
        set({ user: null });
        return;
      }
      const data = await res.json();
      set({ user: data.user ?? null });
    } catch {
      set({ user: null });
    } finally {
      set({ isLoading: false, hasFetched: true });
    }
  },
  logout: async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    set({ user: null });
  },
}));
