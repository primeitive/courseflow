import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth/session";
import type { ApiResponse, Profile } from "@/types";

export async function PATCH(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json<ApiResponse>(
        { error: "Please sign in to continue." },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const fullName = String(body.fullName ?? "").trim();
    const avatarUrl =
      body.avatarUrl === null
        ? null
        : String(body.avatarUrl ?? "").trim();

    if (!fullName || fullName.length < 2) {
      return NextResponse.json<ApiResponse>(
        { error: "Full name must be at least 2 characters." },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Update profile di tabel profiles
    const { data: updated, error } = await supabase
      .from("profiles")
      .update({
        full_name: fullName,
        avatar_url: avatarUrl || null,
      })
      .eq("id", session.userId)
      .select("id, email, full_name, avatar_url, role, created_at, updated_at")
      .single();

    if (error || !updated) {
      return NextResponse.json<ApiResponse>(
        { error: "Could not update profile." },
        { status: 500 }
      );
    }

    // Convert snake_case ke camelCase (format yang dipakai frontend)
    const profile: Profile = {
      id: updated.id,
      email: updated.email,
      fullName: updated.full_name,
      avatarUrl: updated.avatar_url,
      role: updated.role as Profile["role"],
      createdAt: updated.created_at,
      updatedAt: updated.updated_at,
    };

    return NextResponse.json<ApiResponse<{ user: Profile }>>({
      data: { user: profile },
    });
  } catch (e) {
    console.error("[profile PATCH]", e);
    return NextResponse.json<ApiResponse>(
      { error: "Could not update profile." },
      { status: 500 }
    );
  }
}