import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/session";

// PATCH /api/admin/users/[userId] — update role
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await requireRole("admin");
    const { userId } = await params;

    const body = await req.json().catch(() => ({}));
    const role = String(body.role ?? "").trim();

    if (!["student", "instructor", "admin"].includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    // Prevent self-demotion
    if (userId === session.userId && role !== "admin") {
      return NextResponse.json(
        { error: "You can't demote yourself." },
        { status: 400 }
      );
    }

    const supabase = createServiceRoleClient();

    const { data: updated, error } = await supabase
      .from("profiles")
      .update({ role })
      .eq("id", userId)
      .select("id, email, full_name, avatar_url, role, created_at, updated_at")
      .single();

    if (error) throw error;

    return NextResponse.json({
      user: {
        id: updated.id,
        email: updated.email,
        fullName: updated.full_name,
        avatarUrl: updated.avatar_url,
        role: updated.role,
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