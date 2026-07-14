"use client";

import * as React from "react";
import { useRouterStore } from "@/store/router";
import { useAuthStore } from "@/store/auth";
import { useFetch } from "@/hooks/use-fetch";
import { Button } from "@/components/ui/button";
import {
  EmptyState,
  LoadingState,
  CourseGridSkeleton,
} from "@/components/common/states";
import { CourseCard } from "@/components/course/course-card";
import { GraduationCap, ArrowRight, PlayCircle, Clock } from "lucide-react";
import { formatRelative } from "@/lib/format";
import type { Course } from "@/types";

export function MyLearningView() {
  const navigate = useRouterStore((s) => s.navigate);
  const user = useAuthStore((s) => s.user);

  const { data, isLoading } = useFetch<{ courses: Course[] }>({
    url: user ? "/api/enrollments" : null,
  });

  const courses = data?.courses ?? [];

  if (!user) {
    return (
      <EmptyState
        icon={GraduationCap}
        title="Sign in to see your courses"
        description="Your purchased courses live here. Sign in to continue learning."
        action={
          <Button onClick={() => navigate({ name: "login" })}>Sign in</Button>
        }
      />
    );
  }

  return (
    <div className="animate-fade-in mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          My learning
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Courses you&apos;ve enrolled in. Pick up where you left off.
        </p>
      </div>

      {isLoading ? (
        <CourseGridSkeleton count={3} />
      ) : courses.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title="No courses yet"
          description="You haven't enrolled in any courses. Browse the catalogue to get started."
          action={
            <Button onClick={() => navigate({ name: "courses" })}>
              Browse courses
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          }
        />
      ) : (
        <>
          <p className="mb-4 text-xs text-muted-foreground">
            {courses.length} {courses.length === 1 ? "course" : "courses"} in
            your library
          </p>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((c) => {
              const totalDuration = c.videos?.reduce(
                (s, v) => s + (v.durationSeconds ?? 0),
                0
              );
              return (
                <div
                  key={c.id}
                  className="card-hover flex flex-col overflow-hidden rounded-xl border border-border bg-card"
                >
                  <button
                    onClick={() =>
                      navigate({ name: "course", courseId: c.id })
                    }
                    className="relative aspect-video w-full overflow-hidden bg-muted"
                  >
                    {c.thumbnailUrl ? (
                      <img
                        src={c.thumbnailUrl}
                        alt={c.title}
                        className="h-full w-full object-cover"
                      />
                    ) : null}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition hover:opacity-100">
                      <span className="flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-xs font-medium text-foreground">
                        <PlayCircle className="h-3.5 w-3.5" />
                        Continue learning
                      </span>
                    </div>
                  </button>
                  <div className="flex flex-1 flex-col p-4">
                    <h3 className="line-clamp-2 text-sm font-semibold text-foreground">
                      {c.title}
                    </h3>
                    {c.instructor && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {c.instructor.fullName}
                      </p>
                    )}
                    <div className="mt-auto flex items-center gap-3 pt-3 text-[11px] text-muted-foreground">
                      {c.videos?.length != null && (
                        <span className="flex items-center gap-1">
                          <PlayCircle className="h-3 w-3" />
                          {c.videos.length} lessons
                        </span>
                      )}
                      {totalDuration ? (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {Math.floor(totalDuration / 60)}m
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}