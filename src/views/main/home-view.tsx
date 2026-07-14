"use client";

import * as React from "react";
import { useRouterStore } from "@/store/router";
import { useFetch } from "@/hooks/use-fetch";
import { CourseCard } from "@/components/course/course-card";
import { CourseGridSkeleton } from "@/components/common/states";
import { Button } from "@/components/ui/button";
import {
  GraduationCap,
  Sparkles,
  ArrowRight,
  Users,
  PlayCircle,
  Star,
} from "lucide-react";
import type { Course } from "@/types";

export function HomeView() {
  const navigate = useRouterStore((s) => s.navigate);
  const { data, isLoading } = useFetch<{ courses: Course[] }>({
    url: "/api/courses",
  });

  const courses = data?.courses ?? [];
  // Show first 9 for the 3x3 grid
  const featured = courses.slice(0, 9);

  return (
    <div className="animate-fade-in">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border bg-grid-pattern">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary/5 via-background to-background" />
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-5 inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
              <Sparkles className="h-3 w-3" />
              Built for engineers, by engineers
            </div>
            <h1 className="text-balance text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Learn what&apos;s{" "}
              <span className="bg-gradient-to-r from-primary to-emerald-600 bg-clip-text text-transparent">
                next
              </span>
              .
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-balance text-base text-muted-foreground sm:text-lg">
              Production-grade courses on modern React, TypeScript, databases,
              design systems, and accessibility. No fluff, no bootcamps — just
              the engineering deep-dives you actually need.
            </p>
            <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button
                size="lg"
                className="h-11 px-6"
                onClick={() => navigate({ name: "courses" })}
              >
                Browse courses
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-11 px-6"
                onClick={() => navigate({ name: "teach" })}
              >
                <Sparkles className="mr-2 h-4 w-4" />
                Become an instructor
              </Button>
            </div>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Users className="h-4 w-4 text-primary" />
                <strong className="text-foreground">12,000+</strong> learners
              </span>
              <span className="inline-flex items-center gap-1.5">
                <PlayCircle className="h-4 w-4 text-primary" />
                <strong className="text-foreground">9</strong> expert-led courses
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Star className="h-4 w-4 text-primary" />
                <strong className="text-foreground">4.9/5</strong> average rating
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Course grid */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">
              Welcome back
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Hand-picked courses to level up your craft this week.
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate({ name: "courses" })}
            className="hidden sm:inline-flex"
          >
            View all
            <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
          </Button>
        </div>

        {isLoading ? (
          <CourseGridSkeleton count={9} />
        ) : featured.length === 0 ? (
          <div className="flex min-h-[40vh] flex-col items-center justify-center text-center">
            <GraduationCap className="mb-3 h-12 w-12 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">
              No courses published yet. Check back soon.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((c) => (
              <CourseCard key={c.id} course={c} />
            ))}
          </div>
        )}

        <div className="mt-8 flex justify-center sm:hidden">
          <Button
            variant="outline"
            onClick={() => navigate({ name: "courses" })}
          >
            View all courses
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </section>

      {/* Feature strip */}
      <section className="border-t border-border bg-card/40">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-12 sm:grid-cols-3 sm:px-6 lg:px-8">
          <Feature
            icon={PlayCircle}
            title="Hands-on, not theoretical"
            description="Every lesson ships with a lab and a real, refactored code sample you can copy into your repo today."
          />
          <Feature
            icon={Sparkles}
            title="Taught by working engineers"
            description="Instructors who have shipped production systems at scale. No theory-only lecturers."
          />
          <Feature
            icon={Star}
            title="Lifetime access, free updates"
            description="Buy once, keep forever. When we publish a new edition, you get it for free — no upsells."
          />
        </div>
      </section>
    </div>
  );
}

function Feature({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
