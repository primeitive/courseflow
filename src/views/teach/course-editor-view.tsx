"use client";

import * as React from "react";
import { useRouterStore } from "@/store/router";
import { useFetch } from "@/hooks/use-fetch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Plus,
  Trash2,
  Loader2,
  GripVertical,
  PlayCircle,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  ImagePlus,
} from "lucide-react";
import { toast } from "sonner";
import type { Course, CourseStatus } from "@/types";

interface EditableItem {
  id?: string;
  content?: string;
  title?: string;
  videoUrl?: string;
  durationSeconds?: number | null;
}

export function CourseEditorView({ courseId }: { courseId: string }) {
  const navigate = useRouterStore((s) => s.navigate);
  const { data, isLoading, error, refetch } = useFetch<{ course: Course }>({
    url: courseId ? `/api/courses/teach/${courseId}` : null,
  });

  const course = data?.course;

  // Local editable state
  const [title, setTitle] = React.useState("");
  const [subtitle, setSubtitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [thumbnailUrl, setThumbnailUrl] = React.useState("");
  const [price, setPrice] = React.useState<number>(0);
  const [status, setStatus] = React.useState<CourseStatus>("draft");
  const [learnings, setLearnings] = React.useState<EditableItem[]>([]);
  const [prerequisites, setPrerequisites] = React.useState<EditableItem[]>([]);
  const [audiences, setAudiences] = React.useState<EditableItem[]>([]);
  const [videos, setVideos] = React.useState<EditableItem[]>([]);
  const [saving, setSaving] = React.useState(false);
  const [showPreview, setShowPreview] = React.useState(false);

  // Hydrate from fetched course
  React.useEffect(() => {
    if (!course) return;
    setTitle(course.title ?? "");
    setSubtitle(course.subtitle ?? "");
    setDescription(course.description ?? "");
    setThumbnailUrl(course.thumbnailUrl ?? "");
    setPrice(course.price ?? 0);
    setStatus(course.status as CourseStatus);
    setLearnings(
      (course.learnings ?? []).map((l) => ({ id: l.id, content: l.content }))
    );
    setPrerequisites(
      (course.prerequisites ?? []).map((p) => ({
        id: p.id,
        content: p.content,
      }))
    );
    setAudiences(
      (course.targetAudiences ?? []).map((t) => ({
        id: t.id,
        content: t.content,
      }))
    );
    setVideos(
      (course.videos ?? []).map((v) => ({
        id: v.id,
        title: v.title,
        videoUrl: v.videoUrl,
        durationSeconds: v.durationSeconds,
      }))
    );
  }, [course]);

  const handleSave = async (nextStatus?: CourseStatus) => {
    if (!courseId) return;
    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        subtitle: subtitle.trim(),
        description: description.trim(),
        thumbnailUrl: thumbnailUrl.trim(),
        price: Number(price) || 0,
        status: nextStatus ?? status,
        learnings: learnings.map((l) => ({ content: l.content ?? "" })),
        prerequisites: prerequisites.map((p) => ({
          content: p.content ?? "",
        })),
        targetAudiences: audiences.map((t) => ({ content: t.content ?? "" })),
        videos: videos.map((v) => ({
          title: v.title ?? "",
          videoUrl: v.videoUrl ?? "",
          durationSeconds: v.durationSeconds ?? null,
        })),
      };

      const res = await fetch(`/api/courses/teach/${courseId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Save failed");

      if (nextStatus) setStatus(nextStatus);
      refetch();
      toast.success(
        nextStatus === "published"
          ? "Course published! 🎉"
          : nextStatus === "archived"
          ? "Course archived"
          : "Saved"
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!courseId) return;
    if (!confirm("Delete this course permanently? This cannot be undone."))
      return;
    setSaving(true);
    try {
      const res = await fetch(`/api/courses/teach/${courseId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Delete failed");
      }
      toast.success("Course deleted");
      navigate({ name: "teach-courses" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }
  if (error || !course) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <AlertCircle className="mx-auto mb-3 h-10 w-10 text-destructive" />
        <p className="text-sm text-muted-foreground">
          {error ?? "Course not found."}
        </p>
      </div>
    );
  }

  // Validation for the publish button
  const publishChecklist = {
    title: title.trim().length >= 4,
    subtitle: subtitle.trim().length > 0,
    description: description.trim().length >= 20,
    thumbnail: thumbnailUrl.trim().length > 0,
    videos: videos.filter((v) => v.title && v.videoUrl).length > 0,
    learnings: learnings.filter((l) => l.content).length > 0,
    price: Number(price) > 0,
  };
  const allValid = Object.values(publishChecklist).every(Boolean);

  return (
    <div className="animate-fade-in mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header actions row */}
      <div className="mb-6 flex items-center justify-end gap-2 sm:hidden">
        {/* Mobile publish/save moved below */}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main column */}
        <div className="space-y-6 lg:col-span-2">
          {/* Course basics */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Course basics</CardTitle>
              <CardDescription>
                The title and subtitle appear in cards and search results.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="title">Course title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Modern React from First Principles"
                  className="h-10"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="subtitle">Subtitle</Label>
                <Input
                  id="subtitle"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  placeholder="A one-line hook that makes students click"
                  className="h-10"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What will students learn? Why should they take this course over another?"
                  rows={5}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  {description.length} characters · min 20 to publish
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Thumbnail + price */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Thumbnail & pricing</CardTitle>
              <CardDescription>
                A 16:9 image works best. Price is in USD.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="thumbnail">Thumbnail URL</Label>
                <div className="flex gap-2">
                  <Input
                    id="thumbnail"
                    value={thumbnailUrl}
                    onChange={(e) => setThumbnailUrl(e.target.value)}
                    placeholder="https://…"
                    className="h-10"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      setThumbnailUrl(
                        `https://picsum.photos/seed/${Date.now()}/640/360`
                      )
                    }
                  >
                    <ImagePlus className="mr-1.5 h-3.5 w-3.5" />
                    Random
                  </Button>
                </div>
              </div>
              {thumbnailUrl && (
                <div className="aspect-video w-full max-w-sm overflow-hidden rounded-lg border border-border">
                  { }
                  <img
                    src={thumbnailUrl}
                    alt="Thumbnail preview"
                    className="h-full w-full object-cover"
                  />
                </div>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="price">Price (USD)</Label>
                <div className="relative max-w-[160px]">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    $
                  </span>
                  <Input
                    id="price"
                    type="number"
                    min="0"
                    step="1"
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="h-10 pl-7"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Dynamic lists */}
          <DynamicListCard
            title="What students will learn"
            description="Outcomes students get from this course. 4–8 items works best."
            placeholder="e.g. Reason about the React render cycle from commit to paint"
            items={learnings}
            onChange={setLearnings}
            emptyHint="Add your first learning outcome"
          />
          <DynamicListCard
            title="Prerequisites"
            description="What students should already know before starting."
            placeholder="e.g. Comfortable with modern JavaScript (ES2020+)"
            items={prerequisites}
            onChange={setPrerequisites}
            emptyHint="Add a prerequisite"
          />
          <DynamicListCard
            title="Who this course is for"
            description="Target audiences help students decide if this is right for them."
            placeholder="e.g. Frontend developers with 1+ year of experience"
            items={audiences}
            onChange={setAudiences}
            emptyHint="Add a target audience"
          />

          {/* Videos */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Course videos</CardTitle>
              <CardDescription>
                Add your lessons one by one. Duration is in seconds.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {videos.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  No videos yet. Add your first lesson below.
                </p>
              )}
              {videos.map((v, idx) => (
                <div
                  key={idx}
                  className="rounded-lg border border-border bg-muted/30 p-3"
                >
                  <div className="mb-2 flex items-center gap-2">
                    <GripVertical className="h-3.5 w-3.5 text-muted-foreground/60" />
                    <span className="text-xs font-medium text-muted-foreground">
                      Lesson {idx + 1}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="ml-auto h-6 w-6 text-muted-foreground hover:text-destructive"
                      onClick={() =>
                        setVideos((arr) => arr.filter((_, i) => i !== idx))
                      }
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-12">
                    <Input
                      value={v.title ?? ""}
                      onChange={(e) =>
                        setVideos((arr) =>
                          arr.map((it, i) =>
                            i === idx ? { ...it, title: e.target.value } : it
                          )
                        )
                      }
                      placeholder="Lesson title"
                      className="h-9 sm:col-span-7"
                    />
                    <Input
                      value={v.videoUrl ?? ""}
                      onChange={(e) =>
                        setVideos((arr) =>
                          arr.map((it, i) =>
                            i === idx
                              ? { ...it, videoUrl: e.target.value }
                              : it
                          )
                        )
                      }
                      placeholder="Video URL (https://…)"
                      className="h-9 sm:col-span-5"
                    />
                    <Input
                      type="number"
                      min="0"
                      value={v.durationSeconds ?? ""}
                      onChange={(e) =>
                        setVideos((arr) =>
                          arr.map((it, i) =>
                            i === idx
                              ? {
                                  ...it,
                                  durationSeconds: e.target.value
                                    ? Number(e.target.value)
                                    : null,
                                }
                              : it
                          )
                        )
                      }
                      placeholder="Duration (sec)"
                      className="h-9 sm:col-span-4"
                    />
                  </div>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setVideos((arr) => [
                    ...arr,
                    { title: "", videoUrl: "", durationSeconds: null },
                  ])
                }
              >
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                Add lesson
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          {/* Publish card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Publish</CardTitle>
              <CardDescription>
                Save a draft or publish to all students.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                className="h-10 w-full"
                onClick={() => handleSave()}
                disabled={saving}
              >
                {saving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                )}
                Save draft
              </Button>

              {status === "published" ? (
                <Button
                  variant="outline"
                  className="h-10 w-full"
                  onClick={() => handleSave("draft")}
                  disabled={saving}
                >
                  <EyeOff className="mr-2 h-4 w-4" />
                  Unpublish
                </Button>
              ) : (
                <Button
                  variant="secondary"
                  className="h-10 w-full"
                  onClick={() => handleSave("published")}
                  disabled={saving || !allValid}
                  title={
                    !allValid
                      ? "Complete all required fields before publishing"
                      : ""
                  }
                >
                  <Eye className="mr-2 h-4 w-4" />
                  Publish course
                </Button>
              )}

              <Separator className="my-2" />
              <p className="text-xs font-medium text-foreground">
                Publish checklist
              </p>
              <ul className="space-y-1.5 text-xs">
                <ChecklistItem ok={publishChecklist.title} label="Title (min 4 chars)" />
                <ChecklistItem ok={publishChecklist.subtitle} label="Subtitle" />
                <ChecklistItem
                  ok={publishChecklist.description}
                  label="Description (min 20 chars)"
                />
                <ChecklistItem ok={publishChecklist.thumbnail} label="Thumbnail" />
                <ChecklistItem ok={publishChecklist.videos} label="At least one video" />
                <ChecklistItem ok={publishChecklist.learnings} label="At least one learning outcome" />
                <ChecklistItem ok={publishChecklist.price} label="Price > 0" />
              </ul>
            </CardContent>
          </Card>

          {/* Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Student preview</CardTitle>
              <CardDescription>
                Toggle to see what students will see.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                className="h-10 w-full"
                onClick={() => {
                  if (courseId) navigate({ name: "course", courseId });
                }}
              >
                <PlayCircle className="mr-2 h-4 w-4" />
                Open as student
              </Button>
            </CardContent>
          </Card>

          {/* Danger zone */}
          <Card className="border-destructive/30">
            <CardHeader>
              <CardTitle className="text-base text-destructive">
                Danger zone
              </CardTitle>
              <CardDescription>
                Deleting a course is permanent and removes all enrollments.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                className="h-10 w-full text-destructive hover:text-destructive"
                onClick={handleDelete}
                disabled={saving}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete course
              </Button>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}

// ─── Dynamic list card ─────────────────────────────────────────────────────

function DynamicListCard({
  title,
  description,
  placeholder,
  items,
  onChange,
  emptyHint,
}: {
  title: string;
  description: string;
  placeholder: string;
  items: EditableItem[];
  onChange: (items: EditableItem[]) => void;
  emptyHint: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.length === 0 && (
          <p className="rounded-md border border-dashed border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
            {emptyHint}
          </p>
        )}
        {items.map((item, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <GripVertical className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
            <Input
              value={item.content ?? ""}
              onChange={(e) =>
                onChange(
                  items.map((it, i) =>
                    i === idx ? { ...it, content: e.target.value } : it
                  )
                )
              }
              placeholder={placeholder}
              className="h-9"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive"
              onClick={() => onChange(items.filter((_, i) => i !== idx))}
              aria-label="Remove item"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onChange([...items, { content: "" }])}
        >
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Add item
        </Button>
      </CardContent>
    </Card>
  );
}

function ChecklistItem({ ok, label }: { ok: boolean; label: string }) {
  return (
    <li className="flex items-center gap-1.5">
      {ok ? (
        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
      ) : (
        <span className="h-3.5 w-3.5 rounded-full border border-muted-foreground/40" />
      )}
      <span className={ok ? "text-foreground" : "text-muted-foreground"}>
        {label}
      </span>
    </li>
  );
}
