import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth/session";
import type { Course, Profile } from "@/types";

// GET /api/enrollments — list courses the current user is enrolled in
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ courses: [] });
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("enrollments")
    .select(
      `
      id, course_id, purchased_at,
      course:courses(
        id, title, subtitle, description, thumbnail_url, price, status,
        instructor_id, created_at, updated_at,
        instructor:profiles!instructor_id(id, email, full_name, avatar_url, role, created_at, updated_at),
        course_videos(id, duration_seconds),
        enrollments(count)
      )
      `
    )
    .eq("user_id", session.userId)
    .order("purchased_at", { ascending: false });

  if (error) {
    return NextResponse.json({ courses: [] });
  }

  /* eslint-disable @typescript-eslint/no-explicit-any */
  const courses: Course[] = (data ?? []).map((row: any) => {
    const courseData = Array.isArray(row.course) ? row.course[0] : row.course;
    const instructorData = courseData?.instructor
      ? Array.isArray(courseData.instructor)
        ? courseData.instructor[0]
        : courseData.instructor
      : null;

    return {
      id: courseData.id,
      title: courseData.title,
      subtitle: courseData.subtitle,
      description: courseData.description,
      thumbnailUrl: courseData.thumbnail_url,
      price: Number(courseData.price),
      status: courseData.status,
      instructorId: courseData.instructor_id,
      createdAt: courseData.created_at,
      updatedAt: courseData.updated_at,
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
      enrollmentCount: courseData.enrollments?.[0]?.count ?? 0,
    };
  });
  /* eslint-enable @typescript-eslint/no-explicit-any */

  return NextResponse.json({ courses });
}