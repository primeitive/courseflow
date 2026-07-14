import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth/session";
import type { Course, Profile } from "@/types";

// GET /api/courses/[courseId] — single course with all relations + enrollment flag
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const { courseId } = await params;
  const session = await getSession();

  const supabase = await createClient();

  const { data: rawData, error } = await supabase
    .from("courses")
    .select(
      `
      id, title, subtitle, description, thumbnail_url, price, status,
      instructor_id, created_at, updated_at,
      instructor:profiles!instructor_id(id, email, full_name, avatar_url, role, created_at, updated_at),
      course_videos(id, course_id, title, video_url, duration_seconds, sort_order, created_at),
      course_learnings(id, course_id, content, sort_order),
      course_prerequisites(id, course_id, content, sort_order),
      course_target_audiences(id, course_id, content, sort_order),
      enrollments(count)
      `
    )
    .eq("id", courseId)
    .single();

  if (error || !rawData) {
    return NextResponse.json({ error: "Course not found" }, { status: 404 });
  }

  // Cast to any karena Supabase TS types kadang infer relasi sebagai array
   
  const c = rawData as any;

  // Handle instructor yang mungkin berupa array atau object
  const instructorData = c.instructor
    ? Array.isArray(c.instructor)
      ? c.instructor[0]
      : c.instructor
    : null;

  // If not published, only author or admin can view
  if (
    c.status !== "published" &&
    (!session ||
      (session.userId !== c.instructor_id && session.role !== "admin"))
  ) {
    return NextResponse.json({ error: "Course not found" }, { status: 404 });
  }

  // Check enrollment + cart
  let isEnrolled = false;
  let inCart = false;
  if (session) {
    const { data: enr } = await supabase
      .from("enrollments")
      .select("id")
      .eq("user_id", session.userId)
      .eq("course_id", courseId)
      .maybeSingle();

    isEnrolled = !!enr;

    const { data: cart } = await supabase
      .from("cart_items")
      .select("id")
      .eq("user_id", session.userId)
      .eq("course_id", courseId)
      .maybeSingle();

    inCart = !!cart;
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
    instructor: instructorData
      ? ({
          id: instructorData.id,
          email: instructorData.email,
          fullName: instructorData.full_name,
          avatarUrl: instructorData.avatar_url,
          role: instructorData.role,
          createdAt: instructorData.created_at,
          updatedAt: instructorData.updated_at,
        } as Profile)
      : undefined,
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
    enrollmentCount: c.enrollments?.[0]?.count ?? 0,
  };
   

  return NextResponse.json({
    course,
    isEnrolled,
    inCart,
    isAuthor: session?.userId === c.instructor_id,
  });
}