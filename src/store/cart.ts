"use client";

import { create } from "zustand";
import type { CartItem } from "@/types";

interface CartState {
  items: CartItem[];
  isLoading: boolean;
  hasFetched: boolean;
  setItems: (items: CartItem[]) => void;
  fetch: () => Promise<void>;
  add: (courseId: string) => Promise<boolean>;
  remove: (courseId: string) => Promise<boolean>;
  clear: () => void;
  count: () => number;
  total: () => number;
  has: (courseId: string) => boolean;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  isLoading: false,
  hasFetched: false,
  setItems: (items) => set({ items }),
  fetch: async () => {
    set({ isLoading: true });
    try {
      const res = await fetch("/api/cart", { cache: "no-store" });
      if (!res.ok) {
        set({ items: [] });
        return;
      }
      const data = await res.json();
      set({ items: data.items ?? [] });
    } catch {
      set({ items: [] });
    } finally {
      set({ isLoading: false, hasFetched: true });
    }
  },
  add: async (courseId) => {
    const res = await fetch("/api/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ courseId }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error ?? "Failed to add to cart");
    }
    await get().fetch();
    return true;
  },
  remove: async (courseId) => {
    const res = await fetch(`/api/cart?courseId=${encodeURIComponent(courseId)}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error ?? "Failed to remove from cart");
    }
    await get().fetch();
    return true;
  },
  clear: () => set({ items: [] }),
  count: () => get().items.length,
  total: () =>
    get().items.reduce(
      (sum, item) => sum + (item.course?.price ?? 0),
      0
    ),
  has: (courseId) => get().items.some((i) => i.courseId === courseId),
}));
