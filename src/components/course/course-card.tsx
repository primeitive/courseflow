"use client";

import * as React from "react";
import { useRouterStore } from "@/store/router";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { formatPrice, getInitials } from "@/lib/format";
import { Users, Clock, PlayCircle } from "lucide-react";
import type { Course } from "@/types";

interface CourseCardProps {
  course: Course;
  totalDurationSeconds?: number;
  videoCount?: number;
}

export function CourseCard({
  course,
  totalDurationSeconds,
  videoCount,
}: CourseCardProps) {
  const navigate = useRouterStore((s) => s.navigate);
  const instructor = course.instructor;

  const hours = totalDurationSeconds
    ? Math.floor(totalDurationSeconds / 3600)
    : null;
  const mins = totalDurationSeconds
    ? Math.floor((totalDurationSeconds % 3600) / 60)
    : null;
  const durationLabel =
    totalDurationSeconds != null
      ? hours && hours > 0
        ? `${hours}h ${mins}m`
        : `${mins}m`
      : null;

  return (
    <button
      onClick={() => navigate({ name: "course", courseId: course.id })}
      className="card-hover group flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      {/* Thumbnail */}
      <div className="relative aspect-video w-full overflow-hidden bg-muted">
        {course.thumbnailUrl ? (
           
          <img
            src={course.thumbnailUrl}
            alt={course.title}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/10 via-primary/5 to-transparent">
            <PlayCircle className="h-10 w-10 text-primary/40" />
          </div>
        )}
        <div className="absolute right-2 top-2">
          <Badge
            variant="secondary"
            className="bg-background/90 text-foreground shadow-sm backdrop-blur"
          >
            {formatPrice(course.price)}
          </Badge>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-foreground">
          {course.title}
        </h3>
        {course.subtitle && (
          <p className="line-clamp-2 text-xs text-muted-foreground">
            {course.subtitle}
          </p>
        )}

        {/* Instructor */}
        {instructor && (
          <div className="mt-1 flex items-center gap-2">
            <Avatar className="h-5 w-5 border border-border">
              {instructor.avatarUrl && (
                <AvatarImage
                  src={instructor.avatarUrl}
                  alt={instructor.fullName}
                />
              )}
              <AvatarFallback className="text-[9px] font-semibold bg-primary/10 text-primary">
                {getInitials(instructor.fullName)}
              </AvatarFallback>
            </Avatar>
            <span className="truncate text-xs text-muted-foreground">
              {instructor.fullName}
            </span>
          </div>
        )}

        {/* Meta row */}
        <div className="mt-auto flex items-center gap-3 pt-2 text-[11px] text-muted-foreground">
          {videoCount != null && (
            <span className="flex items-center gap-1">
              <PlayCircle className="h-3 w-3" />
              {videoCount} {videoCount === 1 ? "lesson" : "lessons"}
            </span>
          )}
          {durationLabel && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {durationLabel}
            </span>
          )}
          {course.enrollmentCount != null && (
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {course.enrollmentCount}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
