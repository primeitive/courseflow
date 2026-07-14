import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/session";

// PATCH /api/courses/admin/[courseId] — change course status
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    await requireRole("admin");
    const { courseId } = await params;

    const body = await req.json().catch(() => ({}));
    const status = String(body.status ?? "").trim();

    if (!["draft", "published", "archived"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const supabase = await createClient();

    const { data: updated, error } = await supabase
      .from("courses")
      .update({ status })
      .eq("id", courseId)
      .select(
        "id, title, subtitle, description, thumbnail_url, price, status, instructor_id, created_at, updated_at"
      )
      .single();

    if (error) throw error;

    return NextResponse.json({
      course: {
        ...updated,
        createdAt: updated.created_at,
        updatedAt: updated.updated_at,
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Server error";
    const status =
      msg === "UNAUTHORIZED" ? 401 : msg === "FORBIDDEN" ? 403 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}

// DELETE /api/courses/admin/[courseId] — permanently delete a course
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    await requireRole("admin");
    const { courseId } = await params;

    const supabase = await createClient();

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