import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth/session";
import type { Comment } from "@/types";

// GET /api/comments/[courseId] — list comments for a course (public)
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const { courseId } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("comments")
    .select(
      `
      id, user_id, course_id, content, created_at,
      user:profiles!comments_user_id_fkey(id, full_name, avatar_url)
      `
    )
    .eq("course_id", courseId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json<{ comments: Comment[] }>({ comments: [] });
  }

   
  const comments: Comment[] = (data ?? []).map((c: any) => ({
    id: c.id,
    userId: c.user_id,
    courseId: c.course_id,
    content: c.content,
    createdAt: c.created_at,
    user: c.user
      ? {
          id: c.user.id,
          fullName: c.user.full_name,
          avatarUrl: c.user.avatar_url,
        }
      : undefined,
  }));
   

  return NextResponse.json<{ comments: Comment[] }>({ comments });
}

// POST /api/comments/[courseId] — add a comment (must be enrolled)
export async function POST(
  req: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: "Please sign in to comment." },
        { status: 401 }
      );
    }

    const { courseId } = await params;
    const supabase = await createClient();

    // Check enrollment
    const { data: enrolled } = await supabase
      .from("enrollments")
      .select("id")
      .eq("user_id", session.userId)
      .eq("course_id", courseId)
      .maybeSingle();

    if (!enrolled) {
      return NextResponse.json(
        { error: "Only enrolled students can comment." },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const content = String(body.content ?? "").trim();

    if (!content) {
      return NextResponse.json(
        { error: "Comment cannot be empty." },
        { status: 400 }
      );
    }
    if (content.length > 1000) {
      return NextResponse.json(
        { error: "Comment must be 1000 characters or fewer." },
        { status: 400 }
      );
    }

    const { data: comment, error: insertError } = await supabase
      .from("comments")
      .insert({
        user_id: session.userId,
        course_id: courseId,
        content,
      })
      .select(
        `
        id, user_id, course_id, content, created_at,
        user:profiles!comments_user_id_fkey(id, full_name, avatar_url)
        `
      )
      .single();

    if (insertError || !comment) {
      return NextResponse.json(
        { error: "Could not post comment." },
        { status: 500 }
      );
    }

     
    const out: Comment = {
      id: (comment as any).id,
      userId: (comment as any).user_id,
      courseId: (comment as any).course_id,
      content: (comment as any).content,
      createdAt: (comment as any).created_at,
      user: (comment as any).user
        ? {
            id: (comment as any).user.id,
            fullName: (comment as any).user.full_name,
            avatarUrl: (comment as any).user.avatar_url,
          }
        : undefined,
    };
     

    return NextResponse.json<{ comment: Comment }>({ comment: out });
  } catch (e) {
    console.error("[comments POST]", e);
    return NextResponse.json(
      { error: "Could not post comment." },
      { status: 500 }
    );
  }
}