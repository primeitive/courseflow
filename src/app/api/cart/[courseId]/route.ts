import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth/session";
import type { ApiResponse } from "@/types";

// DELETE /api/cart/[courseId] — remove a course from cart
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json<ApiResponse>(
        { error: "Please sign in." },
        { status: 401 }
      );
    }

    const { courseId } = await params;

    const supabase = await createClient();

    const { error } = await supabase
      .from("cart_items")
      .delete()
      .eq("user_id", session.userId)
      .eq("course_id", courseId);

    if (error) {
      return NextResponse.json<ApiResponse>(
        { error: "Could not remove from cart." },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[cart DELETE]", e);
    return NextResponse.json<ApiResponse>(
      { error: "Could not remove from cart." },
      { status: 500 }
    );
  }
}