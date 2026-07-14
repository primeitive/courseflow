import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/session";
import type { Course } from "@/types";

// GET /api/courses/teach/[courseId] — fetch a single course for editing
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const session = await requireRole("instructor", "admin");
    const { courseId } = await params;

    const supabase = await createClient();

    const { data: rawData, error } = await supabase
      .from("courses")
      .select(
        `
        id, title, subtitle, description, thumbnail_url, price, status,
        instructor_id, created_at, updated_at,
        course_videos(id, course_id, title, video_url, duration_seconds, sort_order, created_at),
        course_learnings(id, course_id, content, sort_order),
        course_prerequisites(id, course_id, content, sort_order),
        course_target_audiences(id, course_id, content, sort_order)
        `
      )
      .eq("id", courseId)
      .single();

    if (error || !rawData) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

     
    const c = rawData as any;

    if (c.instructor_id !== session.userId && session.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const course: Course = {
      id: c.id,
      title: c.title,
      subtitle: c.subtitle,
      description: c.description,
      thumbnailUrl: c.thumbnail_url,
      price: Number(c.price),
      status: c.status,
      instructorId: c.instructor_id,
      createdAt: c.created_at,
      updatedAt: c.updated_at,
      videos: (c.course_videos ?? [])
        .sort((a: any, b: any) => a.sort_order - b.sort_order)
        .map((v: any) => ({
          id: v.id,
          courseId: v.course_id,
          title: v.title,
          videoUrl: v.video_url,
          durationSeconds: v.duration_seconds,
          sortOrder: v.sort_order,
          createdAt: v.created_at,
        })),
      learnings: (c.course_learnings ?? [])
        .sort((a: any, b: any) => a.sort_order - b.sort_order)
        .map((l: any) => ({
          id: l.id,
          courseId: l.course_id,
          content: l.content,
          sortOrder: l.sort_order,
        })),
      prerequisites: (c.course_prerequisites ?? [])
        .sort((a: any, b: any) => a.sort_order - b.sort_order)
        .map((p: any) => ({
          id: p.id,
          courseId: p.course_id,
          content: p.content,
          sortOrder: p.sort_order,
        })),
      targetAudiences: (c.course_target_audiences ?? [])
        .sort((a: any, b: any) => a.sort_order - b.sort_order)
        .map((t: any) => ({
          id: t.id,
          courseId: t.course_id,
          content: t.content,
          sortOrder: t.sort_order,
        })),
    };
     

    return NextResponse.json({ course });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Server error";
    const status =
      msg === "UNAUTHORIZED" ? 401 : msg === "FORBIDDEN" ? 403 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}

// PATCH /api/courses/teach/[courseId] — update course
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const session = await requireRole("instructor", "admin");
    const { courseId } = await params;

    const supabase = await createClient();

    // Check ownership
    const { data: existing, error: existErr } = await supabase
      .from("courses")
      .select("id, instructor_id, title, subtitle, description, thumbnail_url, price, status")
      .eq("id", courseId)
      .single();

    if (existErr || !existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (existing.instructor_id !== session.userId && session.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));

    // Validation for publish action
    const nextStatus = body.status ?? existing.status;
    if (nextStatus === "published") {
      const title = String(body.title ?? existing.title ?? "").trim();
      const subtitle = String(body.subtitle ?? existing.subtitle ?? "").trim();
      const description = String(
        body.description ?? existing.description ?? ""
      ).trim();
      const thumbnailUrl = String(
        body.thumbnailUrl ?? existing.thumbnail_url ?? ""
      ).trim();
      const hasVideos =
        Array.isArray(body.videos) && body.videos.length > 0;
      const hasLearnings =
        Array.isArray(body.learnings) && body.learnings.length > 0;
      const price = Number(body.price ?? existing.price);

      const missing: string[] = [];
      if (title.length < 4) missing.push("title (min 4 chars)");
      if (!subtitle) missing.push("subtitle");
      if (description.length < 20) missing.push("description (min 20 chars)");
      if (!thumbnailUrl) missing.push("thumbnail");
      if (!hasVideos) missing.push("at least one video");
      if (!hasLearnings) missing.push("at least one learning outcome");
      if (!(price > 0)) missing.push("price > 0");

      if (missing.length > 0) {
        return NextResponse.json(
          { error: `Cannot publish — missing: ${missing.join(", ")}.` },
          { status: 400 }
        );
      }
    }

    // Update main course fields
    const updateData: Record<string, unknown> = {};
    if (body.title !== undefined) updateData.title = String(body.title).trim();
    if (body.subtitle !== undefined)
      updateData.subtitle = String(body.subtitle).trim();
    if (body.description !== undefined)
      updateData.description = String(body.description).trim();
    if (body.thumbnailUrl !== undefined)
      updateData.thumbnail_url = String(body.thumbnailUrl).trim();
    if (body.price !== undefined) updateData.price = Number(body.price);
    if (body.status !== undefined) updateData.status = body.status;

    if (Object.keys(updateData).length > 0) {
      const { error: updateErr } = await supabase
        .from("courses")
        .update(updateData)
        .eq("id", courseId);
      if (updateErr) throw updateErr;
    }

    // Replace nested arrays (delete + insert)
    if (Array.isArray(body.learnings)) {
      await supabase.from("course_learnings").delete().eq("course_id", courseId);
      const learnings = body.learnings
        .map((l: { content?: string }, i: number) => ({
          course_id: courseId,
          content: String(l?.content ?? "").trim(),
          sort_order: i,
        }))
        .filter((l: { content: string }) => l.content.length > 0);
      if (learnings.length) {
        await supabase.from("course_learnings").insert(learnings);
      }
    }

    if (Array.isArray(body.prerequisites)) {
      await supabase
        .from("course_prerequisites")
        .delete()
        .eq("course_id", courseId);
      const prereqs = body.prerequisites
        .map((p: { content?: string }, i: number) => ({
          course_id: courseId,
          content: String(p?.content ?? "").trim(),
          sort_order: i,
        }))
        .filter((p: { content: string }) => p.content.length > 0);
      if (prereqs.length) {
        await supabase.from("course_prerequisites").insert(prereqs);
      }
    }

    if (Array.isArray(body.targetAudiences)) {
      await supabase
        .from("course_target_audiences")
        .delete()
        .eq("course_id", courseId);
      const audiences = body.targetAudiences
        .map((t: { content?: string }, i: number) => ({
          course_id: courseId,
          content: String(t?.content ?? "").trim(),
          sort_order: i,
        }))
        .filter((t: { content: string }) => t.content.length > 0);
      if (audiences.length) {
        await supabase.from("course_target_audiences").insert(audiences);
      }
    }

    if (Array.isArray(body.videos)) {
      await supabase.from("course_videos").delete().eq("course_id", courseId);
      const videos = body.videos
        .map(
          (
            v: {
              title?: string;
              videoUrl?: string;
              durationSeconds?: number | null;
            },
            i: number
          ) => ({
            course_id: courseId,
            title: String(v?.title ?? "").trim(),
            video_url: String(v?.videoUrl ?? "").trim(),
            duration_seconds: v?.durationSeconds ?? null,
            sort_order: i,
          })
        )
        .filter(
          (v: { title: string; video_url: string }) =>
            v.title.length > 0 && v.video_url.length > 0
        );
      if (videos.length) {
        await supabase.from("course_videos").insert(videos);
      }
    }

    // Fetch updated course
    const { data: updated } = await supabase
      .from("courses")
      .select(
        "id, title, subtitle, description, thumbnail_url, price, status, instructor_id, created_at, updated_at"
      )
      .eq("id", courseId)
      .single();

    return NextResponse.json({
      course: {
        ...updated,
        status: updated?.status,
        createdAt: updated?.created_at,
        updatedAt: updated?.updated_at,
      },
    });
  } catch (e) {
    console.error("[teach PATCH]", e);
    const msg = e instanceof Error ? e.message : "Server error";
    const status =
      msg === "UNAUTHORIZED" ? 401 : msg === "FORBIDDEN" ? 403 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}

// DELETE /api/courses/teach/[courseId]
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const session = await requireRole("instructor", "admin");
    const { courseId } = await params;

    const supabase = await createClient();

    const { data: c } = await supabase
      .from("courses")
      .select("id, instructor_id")
      .eq("id", courseId)
      .single();

    if (!c) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (c.instructor_id !== session.userId && session.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Cascade delete akan handle course_videos, course_learnings, dll
    // (sesuai ON DELETE CASCADE di SQL schema)
    const { error } = await supabase
      .from("courses")
      .delete()
      .eq("id", courseId);

    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Server error";
    const status =
      msg === "UNAUTHORIZED" ? 401 : msg === "FORBIDDEN" ? 403 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}