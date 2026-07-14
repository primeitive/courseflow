import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { ApiResponse } from "@/types";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const fullName = String(body.fullName ?? "").trim();
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");

    // Validation
    if (!fullName || fullName.length < 2) {
      return NextResponse.json<ApiResponse>(
        { error: "Full name must be at least 2 characters." },
        { status: 400 }
      );
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json<ApiResponse>(
        { error: "Please enter a valid email address." },
        { status: 400 }
      );
    }
    if (password.length < 6) {
      return NextResponse.json<ApiResponse>(
        { error: "Password must be at least 6 characters." },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // SignUp via Supabase Auth
    // Profile akan otomatis dibuat oleh trigger SQL handle_new_user()
    // (yang kita buat di Bagian 3)
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) {
      return NextResponse.json<ApiResponse>(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json<ApiResponse>({
      data: {
        email,
        userId: data.user?.id,
      },
    });
  } catch (e) {
    console.error("[signup]", e);
    return NextResponse.json<ApiResponse>(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}