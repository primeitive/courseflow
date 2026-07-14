import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Course, Profile } from "@/types";

// GET /api/courses — list all published courses (with optional ?q=search)
export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.trim() ?? "";

  const supabase = await createClient();

  let query = supabase
    .from("courses")
    .select(
      `
      id, title, subtitle, description, thumbnail_url, price, status,
      instructor_id, created_at, updated_at,
      instructor:profiles!instructor_id(id, email, full_name, avatar_url, role, created_at, updated_at),
      enrollments(count)
      `
    )
    .eq("status", "published")
    .order("created_at", { ascending: false });

  if (q) {
    query = query.or(
      `title.ilike.%${q}%,subtitle.ilike.%${q}%,description.ilike.%${q}%`
    );
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

   
  const courses: Course[] = (data ?? []).map((row: any) => {
    const instructorData = row.instructor
      ? Array.isArray(row.instructor)
        ? row.instructor[0]
        : row.instructor
      : null;

    return {
      id: row.id,
      title: row.title,
      subtitle: row.subtitle,
      description: row.description,
      thumbnailUrl: row.thumbnail_url,
      price: Number(row.price),
      status: row.status,
      instructorId: row.instructor_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
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
      enrollmentCount: row.enrollments?.[0]?.count ?? 0,
    };
  });
   

  return NextResponse.json<{ courses: Course[] }>({ courses });
}