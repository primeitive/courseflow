"use client";

import * as React from "react";
import { useRouterStore } from "@/store/router";
import { useFetch } from "@/hooks/use-fetch";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LoadingState, ErrorState, EmptyState } from "@/components/common/states";
import {
  BookOpen,
  Users,
  DollarSign,
  Eye,
  EyeOff,
  Trash2,
  Loader2,
  Search,
  X,
} from "lucide-react";
import { formatPrice, formatDate } from "@/lib/format";
import { toast } from "sonner";
import type { Course } from "@/types";

interface AdminCourse extends Course {
  instructor: { id: string; fullName: string; email: string; avatarUrl: string | null };
}

export function AdminCoursesView() {
  const navigate = useRouterStore((s) => s.navigate);
  const { data, isLoading, error, refetch } = useFetch<{
    courses: AdminCourse[];
  }>({ url: "/api/courses/admin" });

  const [filter, setFilter] = React.useState<"all" | "draft" | "published" | "archived">("all");
  const [search, setSearch] = React.useState("");
  const [updatingId, setUpdatingId] = React.useState<string | null>(null);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  const courses = data?.courses ?? [];
  const filtered = courses.filter((c) => {
    if (filter !== "all" && c.status !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        c.title.toLowerCase().includes(q) ||
        c.instructor?.fullName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const updateStatus = async (courseId: string, status: "draft" | "published" | "archived") => {
    setUpdatingId(courseId);
    try {
      const res = await fetch(`/api/courses/admin/${courseId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Update failed");
      toast.success(`Course ${status === "published" ? "published" : status === "archived" ? "archived" : "unpublished"}`);
      refetch();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed");
    } finally {
      setUpdatingId(null);
    }
  };

  const deleteCourse = async (courseId: string) => {
    setDeletingId(courseId);
    try {
      const res = await fetch(`/api/courses/admin/${courseId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Delete failed");
      }
      toast.success("Course deleted");
      refetch();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setDeletingId(null);
    }
  };

  if (isLoading) return <LoadingState label="Loading courses…" />;
  if (error)
    return (
      <ErrorState
        title="Couldn't load courses"
        description={error}
        onRetry={refetch}
      />
    );

  return (
    <div className="animate-fade-in mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="mb-1 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
        Manage courses
      </h1>
      <p className="mb-8 text-sm text-muted-foreground">
        Approve, unpublish, archive, or delete courses across the platform.
      </p>

      {/* Filter bar */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          {(["all", "published", "draft", "archived"] as const).map((f) => (
            <Button
              key={f}
              variant={filter === f ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(f)}
              className="capitalize"
            >
              {f}
            </Button>
          ))}
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search title or instructor…"
            className="h-9 pl-9 pr-9"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
              aria-label="Clear"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No courses match"
          description="Try a different filter or search."
        />
      ) : (
        <div className="grid gap-3">
          {filtered.map((c) => (
            <Card key={c.id} className="card-hover">
              <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                {/* Thumb */}
                <div className="aspect-video w-full shrink-0 overflow-hidden rounded-lg bg-muted sm:w-32">
                  {c.thumbnailUrl && (
                     
                    <img
                      src={c.thumbnailUrl}
                      alt={c.title}
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-start gap-2">
                    <button
                      onClick={() => navigate({ name: "course", courseId: c.id })}
                      className="line-clamp-1 text-left text-sm font-semibold text-foreground hover:text-primary"
                    >
                      {c.title || "Untitled"}
                    </button>
                    <StatusBadge status={c.status} />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    by {c.instructor?.fullName ?? "Unknown"} ·{" "}
                    {formatPrice(c.price)} ·{" "}
                    {c.enrollmentCount ?? 0} students · Updated{" "}
                    {formatDate(c.updatedAt)}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex shrink-0 items-center gap-2">
                  <Select
                    value={c.status}
                    onValueChange={(v) =>
                      updateStatus(c.id, v as "draft" | "published" | "archived")
                    }
                    disabled={updatingId === c.id}
                  >
                    <SelectTrigger className="h-9 w-[130px]" size="sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-destructive hover:text-destructive"
                    onClick={() => navigate({ name: "course", courseId: c.id })}
                    title="View as student"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-destructive hover:text-destructive"
                        disabled={deletingId === c.id}
                        title="Delete course"
                      >
                        {deletingId === c.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete this course?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This permanently removes &quot;{c.title}&quot; and all
                          its enrollments, comments, and videos. This action
                          cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteCourse(c.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete permanently
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
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
