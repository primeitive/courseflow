import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/session";
import type { Course } from "@/types";

// GET /api/courses/teach — list current instructor's courses
export async function GET() {
  try {
    const session = await requireRole("instructor", "admin");

    const supabase = await createClient();

    const { data, error } = await supabase
      .from("courses")
      .select(
        `
        id, title, subtitle, description, thumbnail_url, price, status,
        instructor_id, created_at, updated_at,
        enrollments(count),
        course_videos(count)
        `
      )
      .eq("instructor_id", session.userId)
      .order("updated_at", { ascending: false });

    if (error) throw error;

     
    const courses: Course[] = (data ?? []).map((c: any) => ({
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
      enrollmentCount: c.enrollments?.[0]?.count ?? 0,
    }));
     

    return NextResponse.json<{ courses: Course[] }>({ courses });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Server error";
    const status =
      msg === "UNAUTHORIZED" ? 401 : msg === "FORBIDDEN" ? 403 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}

// POST /api/courses/teach — create a new draft course
export async function POST() {
  try {
    const session = await requireRole("instructor", "admin");

    const supabase = await createClient();

    const { data: course, error } = await supabase
      .from("courses")
      .insert({
        title: "Untitled course",
        instructor_id: session.userId,
        status: "draft",
        price: 0,
      })
      .select(
        "id, title, subtitle, description, thumbnail_url, price, status, instructor_id, created_at, updated_at"
      )
      .single();

    if (error) throw error;

    const out: Course = {
      id: course.id,
      title: course.title,
      subtitle: course.subtitle,
      description: course.description,
      thumbnailUrl: course.thumbnail_url,
      price: Number(course.price),
      status: course.status,
      instructorId: course.instructor_id,
      createdAt: course.created_at,
      updatedAt: course.updated_at,
    };

    return NextResponse.json<{ course: Course }>({ course: out });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Server error";
    const status =
      msg === "UNAUTHORIZED" ? 401 : msg === "FORBIDDEN" ? 403 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}