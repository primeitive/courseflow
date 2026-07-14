"use client";

import { create } from "zustand";
import type { Route } from "@/types";

interface RouterState {
  route: Route;
  // History for back button support
  history: Route[];
  navigate: (route: Route) => void;
  back: () => void;
  canGoBack: () => boolean;
}

export const useRouterStore = create<RouterState>((set, get) => ({
  route: { name: "home" },
  history: [],
  navigate: (route) => {
    const { route: current, history } = get();
    set({
      route,
      history: [...history, current],
    });
    // Scroll to top on every navigation
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "instant" });
    }
  },
  back: () => {
    const { history } = get();
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    set({
      route: prev,
      history: history.slice(0, -1),
    });
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "instant" });
    }
  },
  canGoBack: () => get().history.length > 0,
}));
