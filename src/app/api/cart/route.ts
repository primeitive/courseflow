import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth/session";
import type { ApiResponse, CartItem } from "@/types";

// GET /api/cart — list current user's cart
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json<{ items: CartItem[] }>({ items: [] });
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("cart_items")
    .select(
      `
      id, user_id, course_id, added_at,
      course:courses(
        id, title, subtitle, description, thumbnail_url, price, status,
        instructor_id, created_at, updated_at,
        instructor:profiles!instructor_id(id, email, full_name, avatar_url, role, created_at, updated_at)
      )
      `
    )
    .eq("user_id", session.userId)
    .order("added_at", { ascending: false });

  if (error) {
    return NextResponse.json<{ items: CartItem[] }>({ items: [] });
  }

   
  const items: CartItem[] = (data ?? []).map((row: any) => {
    const courseData = Array.isArray(row.course) ? row.course[0] : row.course;
    const instructorData = courseData?.instructor
      ? Array.isArray(courseData.instructor)
        ? courseData.instructor[0]
        : courseData.instructor
      : null;

    return {
      id: row.id,
      userId: row.user_id,
      courseId: row.course_id,
      addedAt: row.added_at,
      course: courseData
        ? {
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
              ? {
                  id: instructorData.id,
                  email: instructorData.email,
                  fullName: instructorData.full_name,
                  avatarUrl: instructorData.avatar_url,
                  role: instructorData.role,
                  createdAt: instructorData.created_at,
                  updatedAt: instructorData.updated_at,
                }
              : undefined,
          }
        : undefined,
    };
  });
   

  return NextResponse.json<{ items: CartItem[] }>({ items });
}

// POST /api/cart — add a course to cart
export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json<ApiResponse>(
        { error: "Please sign in to add items to your cart." },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const courseId = String(body.courseId ?? "");

    if (!courseId) {
      return NextResponse.json<ApiResponse>(
        { error: "courseId is required." },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Check course exists and is published
    const { data: course, error: courseError } = await supabase
      .from("courses")
      .select("id, instructor_id, status")
      .eq("id", courseId)
      .single();

    if (courseError || !course || course.status !== "published") {
      return NextResponse.json<ApiResponse>(
        { error: "Course is not available." },
        { status: 404 }
      );
    }

    // Don't allow adding own course
    if (course.instructor_id === session.userId) {
      return NextResponse.json<ApiResponse>(
        { error: "You can't buy your own course." },
        { status: 400 }
      );
    }

    // Don't allow re-adding already-enrolled
    const { data: enrolled } = await supabase
      .from("enrollments")
      .select("id")
      .eq("user_id", session.userId)
      .eq("course_id", courseId)
      .maybeSingle();

    if (enrolled) {
      return NextResponse.json<ApiResponse>(
        { error: "You're already enrolled in this course." },
        { status: 400 }
      );
    }

    // Upsert (unique constraint on user_id + course_id prevents duplicates)
    const { error: upsertError } = await supabase
      .from("cart_items")
      .upsert(
        { user_id: session.userId, course_id: courseId },
        { onConflict: "user_id,course_id" }
      );

    if (upsertError) {
      return NextResponse.json<ApiResponse>(
        { error: "Could not add to cart." },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[cart POST]", e);
    return NextResponse.json<ApiResponse>(
      { error: "Could not add to cart." },
      { status: 500 }
    );
  }
}