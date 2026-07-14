import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { ApiResponse } from "@/types";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");

    if (!email || !password) {
      return NextResponse.json<ApiResponse>(
        { error: "Email and password are required." },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // SignIn dengan email + password
    // Session cookie otomatis di-set oleh @supabase/ssr
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // Translate error Supabase ke pesan yang lebih ramah user
      const friendlyMessage =
        error.message === "Invalid login credentials"
          ? "Email atau password salah."
          : error.message;

      return NextResponse.json<ApiResponse>(
        { error: friendlyMessage },
        { status: 401 }
      );
    }

    return NextResponse.json<ApiResponse>({
      data: {
        email,
        userId: data.user?.id,
      },
    });
  } catch (e) {
    console.error("[login]", e);
    return NextResponse.json<ApiResponse>(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}