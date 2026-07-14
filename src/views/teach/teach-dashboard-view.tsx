"use client";

import * as React from "react";
import { useRouterStore } from "@/store/router";
import { useFetch } from "@/hooks/use-fetch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from "@/components/common/states";
import {
  Sparkles,
  Plus,
  Users,
  PlayCircle,
  Pencil,
  Loader2,
  DollarSign,
} from "lucide-react";
import { formatPrice, formatDate } from "@/lib/format";
import { toast } from "sonner";
import type { Course } from "@/types";

export function TeachDashboardView() {
  const navigate = useRouterStore((s) => s.navigate);
  const { data, isLoading, error, refetch } = useFetch<{ courses: Course[] }>({
    url: "/api/courses/teach",
  });

  const [creating, setCreating] = React.useState(false);

  const courses = data?.courses ?? [];
  const published = courses.filter((c) => c.status === "published");
  const drafts = courses.filter((c) => c.status === "draft");
  const totalStudents = courses.reduce(
    (s, c) => s + (c.enrollmentCount ?? 0),
    0
  );
  const totalRevenue = courses.length
    ? courses.length * 49 // placeholder; real revenue is on Revenue page
    : 0;

  const onCreate = async () => {
    setCreating(true);
    try {
      const res = await fetch("/api/courses/teach", { method: "POST" });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Failed to create course");
      toast.success("New draft course created");
      navigate({ name: "teach-course-edit", courseId: body.course.id });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to create course");
    } finally {
      setCreating(false);
    }
  };

  if (isLoading) return <LoadingState label="Loading your courses…" />;

  if (error)
    return (
      <ErrorState
        description={error}
        onRetry={refetch}
        title="Couldn't load your courses"
      />
    );

  return (
    <div className="animate-fade-in mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Instructor dashboard
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Create, edit, and publish your courses.
          </p>
        </div>
        <Button onClick={onCreate} disabled={creating}>
          {creating ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Plus className="mr-2 h-4 w-4" />
          )}
          Create course
        </Button>
      </div>

      {/* Stats strip */}
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <StatCard
          icon={Sparkles}
          label="Total courses"
          value={String(courses.length)}
          sub={`${published.length} published · ${drafts.length} draft${
            drafts.length === 1 ? "" : "s"
          }`}
        />
        <StatCard
          icon={Users}
          label="Total students"
          value={totalStudents.toString()}
          sub="Across all your courses"
        />
        <StatCard
          icon={DollarSign}
          label="Est. revenue"
          value={formatPrice(totalRevenue)}
          sub="See revenue page for detail"
          action={() => navigate({ name: "teach-revenue" })}
        />
      </div>

      {/* Course list */}
      <h2 className="mb-4 text-base font-semibold tracking-tight text-foreground">
        Your courses
      </h2>
      {courses.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          title="No courses yet"
          description="Click 'Create course' to start your first draft."
          action={
            <Button onClick={onCreate} disabled={creating}>
              <Plus className="mr-2 h-4 w-4" />
              Create course
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4">
          {courses.map((c) => (
            <Card key={c.id} className="card-hover">
              <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
                {/* Thumbnail */}
                <button
                  onClick={() =>
                    navigate({ name: "teach-course-edit", courseId: c.id })
                  }
                  className="relative aspect-video w-full shrink-0 overflow-hidden rounded-lg bg-muted sm:w-40"
                >
                  {c.thumbnailUrl ? (
                     
                    <img
                      src={c.thumbnailUrl}
                      alt={c.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <PlayCircle className="h-6 w-6 text-muted-foreground/50" />
                    </div>
                  )}
                </button>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-start gap-2">
                    <button
                      onClick={() =>
                        navigate({ name: "teach-course-edit", courseId: c.id })
                      }
                      className="line-clamp-1 text-left text-sm font-semibold text-foreground hover:text-primary"
                    >
                      {c.title || "Untitled course"}
                    </button>
                    <StatusBadge status={c.status} />
                  </div>
                  {c.subtitle && (
                    <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                      {c.subtitle}
                    </p>
                  )}
                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {c.enrollmentCount ?? 0} students
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <DollarSign className="h-3 w-3" />
                      {formatPrice(c.price)}
                    </span>
                    <span>Updated {formatDate(c.updatedAt)}</span>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      navigate({ name: "teach-course-edit", courseId: c.id })
                    }
                  >
                    <Pencil className="mr-1.5 h-3.5 w-3.5" />
                    Edit
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  action,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  sub?: string;
  action?: () => void;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Icon className="h-4 w-4 text-primary" />
          <span className="text-xs font-medium uppercase tracking-wider">
            {label}
          </span>
        </div>
        <p className="mt-2 text-2xl font-bold tracking-tight text-foreground">
          {value}
        </p>
        {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
        {action && (
          <Button
            variant="link"
            size="sm"
            onClick={action}
            className="mt-2 h-auto p-0 text-xs"
          >
            View details →
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "published")
    return (
      <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300">
        Published
      </Badge>
    );
  if (status === "archived")
    return (
      <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 dark:bg-amber-950/60 dark:text-amber-300">
        Archived
      </Badge>
    );
  return <Badge variant="secondary">Draft</Badge>;
}
