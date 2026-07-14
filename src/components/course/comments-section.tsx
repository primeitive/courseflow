"use client";

import * as React from "react";
import { useAuthStore } from "@/store/auth";
import { useRouterStore } from "@/store/router";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  MessageSquare,
  Send,
  Lock,
  Loader2,
} from "lucide-react";
import { useFetch } from "@/hooks/use-fetch";
import { formatRelative, getInitials } from "@/lib/format";
import { toast } from "sonner";
import type { Comment } from "@/types";

export function CommentsSection({ courseId }: { courseId: string }) {
  const user = useAuthStore((s) => s.user);
  const navigate = useRouterStore((s) => s.navigate);

  // Fetch course meta to know if user is enrolled
  const { data: courseMeta, refetch: refetchMeta } = useFetch<{
    isEnrolled: boolean;
  }>({
    url: `/api/courses/${courseId}`,
  });

  const {
    data,
    isLoading,
    refetch,
  } = useFetch<{ comments: Comment[] }>({
    url: `/api/comments/${courseId}`,
    deps: [courseId],
  });

  const [text, setText] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  const comments = data?.comments ?? [];
  const isEnrolled = !!courseMeta?.isEnrolled;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const content = text.trim();
    if (!content) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/comments/${courseId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Failed to post comment");
      setText("");
      refetch();
      toast.success("Comment posted");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to post comment");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section
      id="comments"
      aria-labelledby="comments-title"
      className="mt-10 border-t border-border pt-8"
    >
      <div className="mb-5 flex items-center gap-2">
        <MessageSquare className="h-5 w-5 text-primary" />
        <h2 id="comments-title" className="text-lg font-semibold tracking-tight">
          Student discussion
        </h2>
        <span className="ml-1 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
          {comments.length}
        </span>
      </div>

      {/* Composer */}
      {isEnrolled && user ? (
        <form onSubmit={onSubmit} className="mb-8">
          <div className="flex gap-3">
            <Avatar className="h-9 w-9 shrink-0 border border-border">
              {user.avatarUrl && (
                <AvatarImage src={user.avatarUrl} alt={user.fullName} />
              )}
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                {getInitials(user.fullName)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Share your thoughts, ask a question, or help a fellow student…"
                maxLength={1000}
                rows={3}
                className="resize-none"
              />
              <div className="mt-2 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {text.length}/1000
                </span>
                <Button
                  type="submit"
                  size="sm"
                  disabled={submitting || !text.trim()}
                >
                  {submitting ? (
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Send className="mr-1.5 h-3.5 w-3.5" />
                  )}
                  Post comment
                </Button>
              </div>
            </div>
          </div>
        </form>
      ) : (
        <div className="mb-8 flex items-center gap-3 rounded-lg border border-dashed border-border bg-muted/30 p-4 text-sm text-muted-foreground">
          <Lock className="h-4 w-4 shrink-0" />
          <span>
            {user
              ? "Enroll in this course to join the discussion."
              : "Sign in and enroll in this course to join the discussion."}{" "}
            {!user && (
              <button
                onClick={() => navigate({ name: "login" })}
                className="font-medium text-primary hover:underline"
              >
                Sign in
              </button>
            )}
          </span>
        </div>
      )}

      {/* List */}
      {isLoading ? (
        <div className="flex flex-col gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="h-9 w-9 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3 w-32" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            </div>
          ))}
        </div>
      ) : comments.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-muted/20 p-8 text-center">
          <MessageSquare className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
          <p className="text-sm font-medium text-foreground">No comments yet</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Be the first to start the discussion.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-5">
          {comments.map((c) => (
            <li key={c.id} className="flex gap-3">
              <Avatar className="h-9 w-9 shrink-0 border border-border">
                {c.user?.avatarUrl && (
                  <AvatarImage
                    src={c.user.avatarUrl}
                    alt={c.user.fullName}
                  />
                )}
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                  {getInitials(c.user?.fullName ?? "?")}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-medium text-foreground">
                    {c.user?.fullName ?? "Unknown"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatRelative(c.createdAt)}
                  </span>
                </div>
                <p className="mt-1 text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap">
                  {c.content}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Hidden helper to refetch meta */}
      <button
        onClick={() => refetchMeta()}
        className="hidden"
        aria-hidden
        tabIndex={-1}
      />
    </section>
  );
}
