import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/session";

// GET /api/admin/users — list all users with role + enrollment + revenue stats
export async function GET() {
  try {
    await requireRole("admin");

    // Use service role client to bypass RLS for admin queries
    const supabase = createServiceRoleClient();

    const { data, error } = await supabase
      .from("profiles")
      .select(
        `
        id, email, full_name, avatar_url, role, created_at, updated_at,
        enrollments(count),
        courses(count),
        transactions(count)
        `
      )
      .order("created_at", { ascending: false });

    if (error) throw error;

     
    const users = (data ?? []).map((u: any) => ({
      id: u.id,
      email: u.email,
      fullName: u.full_name,
      avatarUrl: u.avatar_url,
      role: u.role,
      createdAt: u.created_at,
      updatedAt: u.updated_at,
      enrollmentCount: u.enrollments?.[0]?.count ?? 0,
      courseCount: u.courses?.[0]?.count ?? 0,
      transactionCount: u.transactions?.[0]?.count ?? 0,
    }));
     

    return NextResponse.json({ users });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Server error";
    const status =
      msg === "UNAUTHORIZED" ? 401 : msg === "FORBIDDEN" ? 403 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}