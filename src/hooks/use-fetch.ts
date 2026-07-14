"use client";

import * as React from "react";

interface UseFetchOptions<T> {
  // The fetch URL
  url: string | null;
  // Whether to skip the fetch (e.g. when not authenticated)
  enabled?: boolean;
  // Initial data
  initialData?: T;
  // Cache key for refresh
  deps?: React.DependencyList;
}

interface UseFetchResult<T> {
  data: T | undefined;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
  setData: (data: T | undefined) => void;
}

/**
 * Tiny data-fetching hook with abort + refresh.
 * Avoids pulling in TanStack Query for the simple cases; we still use
 * TanStack for some queries but this is the workhorse.
 */
export function useFetch<T>({
  url,
  enabled = true,
  initialData,
  deps = [],
}: UseFetchOptions<T>): UseFetchResult<T> {
  const [data, setData] = React.useState<T | undefined>(initialData);
  const [isLoading, setIsLoading] = React.useState<boolean>(!!url && enabled);
  const [error, setError] = React.useState<string | null>(null);
  const [nonce, setNonce] = React.useState(0);

  React.useEffect(() => {
    if (!url || !enabled) {
      setIsLoading(false);
      return;
    }
    const ac = new AbortController();
    setIsLoading(true);
    setError(null);
    fetch(url, { signal: ac.signal, cache: "no-store" })
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || `Request failed (${res.status})`);
        }
        return res.json();
      })
      .then((json) => {
        setData(json);
        setIsLoading(false);
      })
      .catch((e) => {
        if (e?.name === "AbortError") return;
        setError(e?.message ?? "Failed to load");
        setIsLoading(false);
      });
    return () => ac.abort();
     
  }, [url, enabled, nonce, ...deps]);

  return {
    data,
    isLoading,
    error,
    refetch: () => setNonce((n) => n + 1),
    setData,
  };
}
