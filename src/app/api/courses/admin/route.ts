import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/session";

// GET /api/courses/admin — list ALL courses for admin
export async function GET() {
  try {
    await requireRole("admin");

    const supabase = await createClient();

    const { data, error } = await supabase
      .from("courses")
      .select(
        `
        id, title, subtitle, description, thumbnail_url, price, status,
        instructor_id, created_at, updated_at,
        instructor:profiles!instructor_id(id, full_name, email, avatar_url),
        enrollments(count)
        `
      )
      .order("created_at", { ascending: false });

    if (error) throw error;

     
    const courses = (data ?? []).map((c: any) => {
      const instructorData = c.instructor
        ? Array.isArray(c.instructor)
          ? c.instructor[0]
          : c.instructor
        : null;

      return {
        id: c.id,
        title: c.title,
        subtitle: c.subtitle,
        description: c.description,
        thumbnailUrl: c.thumbnail_url,
        price: Number(c.price),
        status: c.status,
        instructorId: c.instructor_id,
        instructor: instructorData
          ? {
              id: instructorData.id,
              fullName: instructorData.full_name,
              email: instructorData.email,
              avatarUrl: instructorData.avatar_url,
            }
          : null,
        createdAt: c.created_at,
        updatedAt: c.updated_at,
        enrollmentCount: c.enrollments?.[0]?.count ?? 0,
      };
    });
     

    return NextResponse.json({ courses });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Server error";
    const status =
      msg === "UNAUTHORIZED" ? 401 : msg === "FORBIDDEN" ? 403 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}