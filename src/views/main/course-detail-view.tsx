"use client";

import * as React from "react";
import { useRouterStore } from "@/store/router";
import { useFetch } from "@/hooks/use-fetch";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  CourseGridSkeleton,
  ErrorState,
} from "@/components/common/states";
import {
  AddToCartButton,
  BuyNowButton,
} from "@/components/course/purchase-buttons";
import { CommentsSection } from "@/components/course/comments-section";
import {
  PlayCircle,
  CheckCircle2,
  AlertCircle,
  Users,
  Clock,
  ListChecks,
  Target,
  Info,
  ChevronLeft,
  Loader2,
} from "lucide-react";
import { formatPrice, formatTotalDuration, getInitials } from "@/lib/format";
import type { Course } from "@/types";

interface CourseDetailResponse {
  course: Course;
  isEnrolled: boolean;
  inCart: boolean;
  isAuthor: boolean;
}

export function CourseDetailView({ courseId }: { courseId: string }) {
  const navigate = useRouterStore((s) => s.navigate);
  const back = useRouterStore((s) => s.back);
  const {
    data,
    isLoading,
    error,
    refetch,
  } = useFetch<CourseDetailResponse>({
    url: `/api/courses/${courseId}`,
    deps: [courseId],
  });

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <CourseDetailSkeleton />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <ErrorState
          title="Course not found"
          description={error ?? undefined}
          onRetry={refetch}
        />
      </div>
    );
  }

  const { course, isEnrolled, inCart, isAuthor } = data;
  const totalDuration = course.videos?.reduce(
    (s, v) => s + (v.durationSeconds ?? 0),
    0
  );

  return (
    <div className="animate-fade-in">
      {/* Breadcrumb */}
      <div className="border-b border-border bg-muted/30">
        <div className="mx-auto flex max-w-7xl items-center gap-1 px-4 py-3 text-xs sm:px-6 lg:px-8">
          <button
            onClick={() => (back ? back() : navigate({ name: "courses" }))}
            className="inline-flex items-center gap-1 text-muted-foreground transition hover:text-foreground"
          >
            <ChevronLeft className="h-3 w-3" />
            Back to courses
          </button>
        </div>
      </div>

      {/* Hero */}
      <section className="border-b border-border bg-card/40">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-3 lg:px-8 lg:py-12">
          {/* Left: text */}
          <div className="lg:col-span-2">
            <Badge
              variant="secondary"
              className="mb-3 bg-primary/10 text-primary"
            >
              {course.enrollmentCount ?? 0}{" "}
              {course.enrollmentCount === 1 ? "student" : "students"} enrolled
            </Badge>
            <h1 className="text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              {course.title}
            </h1>
            {course.subtitle && (
              <p className="mt-3 text-balance text-base text-muted-foreground sm:text-lg">
                {course.subtitle}
              </p>
            )}

            {/* Instructor */}
            {course.instructor && (
              <div className="mt-5 flex items-center gap-3">
                <Avatar className="h-11 w-11 border border-border">
                  {course.instructor.avatarUrl && (
                    <AvatarImage
                      src={course.instructor.avatarUrl}
                      alt={course.instructor.fullName}
                    />
                  )}
                  <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                    {getInitials(course.instructor.fullName)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-xs text-muted-foreground">Instructor</p>
                  <p className="text-sm font-medium text-foreground">
                    {course.instructor.fullName}
                  </p>
                </div>
              </div>
            )}

            {/* Meta strip */}
            <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
              {course.videos?.length != null && (
                <span className="inline-flex items-center gap-1.5">
                  <PlayCircle className="h-4 w-4 text-primary" />
                  {course.videos.length}{" "}
                  {course.videos.length === 1 ? "lesson" : "lessons"}
                </span>
              )}
              {totalDuration ? (
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-primary" />
                  {formatTotalDuration(totalDuration)} total
                </span>
              ) : null}
              {course.enrollmentCount != null && (
                <span className="inline-flex items-center gap-1.5">
                  <Users className="h-4 w-4 text-primary" />
                  {course.enrollmentCount} enrolled
                </span>
              )}
            </div>
          </div>

          {/* Right: thumbnail + buy card (desktop) */}
          <div className="lg:col-span-1">
            <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
              <div className="aspect-video w-full overflow-hidden bg-muted">
                {course.thumbnailUrl ? (
                   
                  <img
                    src={course.thumbnailUrl}
                    alt={course.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <PlayCircle className="h-10 w-10 text-primary/40" />
                  </div>
                )}
              </div>
              <div className="p-4">
                <div className="mb-4 flex items-baseline gap-2">
                  <span className="text-2xl font-bold tracking-tight text-foreground">
                    {formatPrice(course.price)}
                  </span>
                  <span className="text-xs text-muted-foreground">USD</span>
                </div>
                <div className="flex flex-col gap-2">
                  <BuyNowButton
                    courseId={course.id}
                    isEnrolled={isEnrolled}
                    isOwn={isAuthor}
                  />
                  <AddToCartButton
                    courseId={course.id}
                    inCart={inCart}
                    isEnrolled={isEnrolled}
                    isOwn={isAuthor}
                  />
                </div>

                <Separator className="my-4" />
                <p className="text-xs text-muted-foreground">
                  <strong className="text-foreground">30-day money back</strong>{" "}
                  guarantee. Lifetime access. Free updates.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Body */}
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-3">
          {/* Main column */}
          <div className="space-y-10 lg:col-span-2">
            {/* Description */}
            {course.description && (
              <div>
                <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold tracking-tight">
                  <Info className="h-4 w-4 text-primary" />
                  About this course
                </h2>
                <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap">
                  {course.description}
                </p>
              </div>
            )}

            {/* Learnings */}
            {course.learnings && course.learnings.length > 0 && (
              <div>
                <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold tracking-tight">
                  <ListChecks className="h-4 w-4 text-primary" />
                  What you&apos;ll learn
                </h2>
                <ul className="grid gap-2.5 sm:grid-cols-2">
                  {course.learnings.map((l) => (
                    <li
                      key={l.id}
                      className="flex items-start gap-2 text-sm text-foreground/90"
                    >
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span>{l.content}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Prerequisites */}
            {course.prerequisites && course.prerequisites.length > 0 && (
              <div>
                <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold tracking-tight">
                  <AlertCircle className="h-4 w-4 text-primary" />
                  Prerequisites
                </h2>
                <ul className="flex flex-col gap-2">
                  {course.prerequisites.map((p) => (
                    <li
                      key={p.id}
                      className="flex items-start gap-2 text-sm text-foreground/90"
                    >
                      <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-muted-foreground" />
                      <span>{p.content}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Target audiences */}
            {course.targetAudiences && course.targetAudiences.length > 0 && (
              <div>
                <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold tracking-tight">
                  <Target className="h-4 w-4 text-primary" />
                  Who this course is for
                </h2>
                <ul className="flex flex-col gap-2">
                  {course.targetAudiences.map((t) => (
                    <li
                      key={t.id}
                      className="flex items-start gap-2 text-sm text-foreground/90"
                    >
                      <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-muted-foreground" />
                      <span>{t.content}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Comments */}
            <CommentsSection courseId={course.id} />
          </div>

          {/* Side column: video list */}
          <aside className="lg:col-span-1">
            <div className="lg:sticky lg:top-20">
              <h2 className="mb-3 flex items-center gap-2 text-base font-semibold tracking-tight">
                <PlayCircle className="h-4 w-4 text-primary" />
                Course content
                {course.videos?.length != null && (
                  <span className="ml-1 text-xs text-muted-foreground">
                    {course.videos.length}{" "}
                    {course.videos.length === 1 ? "lesson" : "lessons"}
                  </span>
                )}
              </h2>
              <div className="overflow-hidden rounded-xl border border-border bg-card">
                {course.videos && course.videos.length > 0 ? (
                  <ol className="max-h-[28rem] divide-y divide-border overflow-y-auto scrollbar-thin">
                    {course.videos.map((v, idx) => (
                      <li
                        key={v.id}
                        className="flex items-start gap-3 p-3 transition hover:bg-muted/40"
                      >
                        <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                          {idx + 1}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-foreground">
                            {v.title}
                          </p>
                          <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                            <PlayCircle className="h-3 w-3" />
                            {formatTotalDuration(v.durationSeconds)}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <div className="p-6 text-center text-sm text-muted-foreground">
                    No lessons published yet.
                  </div>
                )}
              </div>

              {/* Sticky purchase card on mobile */}
              <div className="mt-4 lg:hidden">
                <div className="rounded-xl border border-border bg-card p-4">
                  <div className="mb-3 flex items-baseline gap-2">
                    <span className="text-2xl font-bold tracking-tight text-foreground">
                      {formatPrice(course.price)}
                    </span>
                    <span className="text-xs text-muted-foreground">USD</span>
                  </div>
                  <div className="flex flex-col gap-2">
                    <BuyNowButton
                      courseId={course.id}
                      isEnrolled={isEnrolled}
                      isOwn={isAuthor}
                    />
                    <AddToCartButton
                      courseId={course.id}
                      inCart={inCart}
                      isEnrolled={isEnrolled}
                      isOwn={isAuthor}
                    />
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}

// ─── Skeleton ───────────────────────────────────────────────────────────────

function CourseDetailSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div className="h-5 w-32 rounded-full bg-muted" />
          <div className="h-10 w-3/4 rounded-md bg-muted" />
          <div className="h-4 w-full rounded bg-muted" />
          <div className="h-4 w-2/3 rounded bg-muted" />
          <div className="mt-6 flex gap-3">
            <div className="h-11 w-11 rounded-full bg-muted" />
            <div className="space-y-2">
              <div className="h-3 w-20 rounded bg-muted" />
              <div className="h-3 w-32 rounded bg-muted" />
            </div>
          </div>
        </div>
        <div className="space-y-4">
          <div className="aspect-video w-full rounded-xl bg-muted" />
          <div className="h-10 w-full rounded-md bg-muted" />
          <div className="h-10 w-full rounded-md bg-muted" />
        </div>
      </div>
      <div className="mt-12 grid gap-10 lg:grid-cols-3">
        <div className="space-y-3 lg:col-span-2">
          <div className="h-6 w-48 rounded bg-muted" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-3 w-full rounded bg-muted" />
          ))}
        </div>
        <div className="space-y-2">
          <div className="h-6 w-32 rounded bg-muted" />
          <div className="h-32 w-full rounded-xl bg-muted" />
        </div>
      </div>
    </div>
  );
}
