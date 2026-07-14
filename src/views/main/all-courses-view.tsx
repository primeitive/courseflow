"use client";

import * as React from "react";
import { useRouterStore } from "@/store/router";
import { useFetch } from "@/hooks/use-fetch";
import { useUIStore } from "@/store/ui";
import { CourseCard } from "@/components/course/course-card";
import {
  CourseGridSkeleton,
  EmptyState,
  ErrorState,
} from "@/components/common/states";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, BookOpen, X } from "lucide-react";
import type { Course } from "@/types";

export function AllCoursesView() {
  const navigate = useRouterStore((s) => s.navigate);
  const searchQuery = useUIStore((s) => s.searchQuery);
  const setSearchQuery = useUIStore((s) => s.setSearchQuery);
  const [local, setLocal] = React.useState(searchQuery);
  const [debounced, setDebounced] = React.useState(searchQuery);

  // Debounce
  React.useEffect(() => {
    const t = setTimeout(() => {
      setDebounced(local);
      setSearchQuery(local);
    }, 250);
    return () => clearTimeout(t);
  }, [local, setSearchQuery]);

  const url = debounced
    ? `/api/courses?q=${encodeURIComponent(debounced)}`
    : `/api/courses`;

  const { data, isLoading, error, refetch } = useFetch<{ courses: Course[] }>({
    url,
    deps: [debounced],
  });

  const courses = data?.courses ?? [];

  return (
    <div className="animate-fade-in mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Page header */}
      <div className="mb-8 flex flex-col gap-3">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          All courses
        </h1>
        <p className="text-sm text-muted-foreground">
          Browse our full catalogue of engineering deep-dives.
        </p>
      </div>

      {/* Search bar */}
      <div className="mb-6 flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={local}
            onChange={(e) => setLocal(e.target.value)}
            placeholder="Search by title, topic, or instructor…"
            className="h-10 pl-9 pr-9"
            aria-label="Search courses"
          />
          {local && (
            <button
              onClick={() => setLocal("")}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Results */}
      {isLoading ? (
        <CourseGridSkeleton count={9} />
      ) : error ? (
        <ErrorState description={error} onRetry={refetch} />
      ) : courses.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title={local ? `No courses match "${local}"` : "No courses yet"}
          description={
            local
              ? "Try a different search term, or browse all courses."
              : "Check back soon — we publish new courses every month."
          }
          action={
            <Button onClick={() => navigate({ name: "home" })}>
              Back to home
            </Button>
          }
        />
      ) : (
        <>
          <p className="mb-4 text-xs text-muted-foreground">
            {courses.length} {courses.length === 1 ? "course" : "courses"}{" "}
            {local ? `matching "${local}"` : "available"}
          </p>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((c) => (
              <CourseCard key={c.id} course={c} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
