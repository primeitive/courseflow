import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import type { Profile } from "@/types";

export async function GET() {
  const session = await getSession();

  if (!session) {
    return NextResponse.json<{ user: null }>({ user: null });
  }

  // Return sebagai Profile object (format yang sama dengan lama,
  // supaya frontend tidak perlu diubah)
  const profile: Profile = {
    id: session.userId,
    email: session.email,
    fullName: session.fullName,
    avatarUrl: session.avatarUrl,
    role: session.role,
    createdAt: "", // tidak dipakai frontend
    updatedAt: "", // tidak dipakai frontend
  };

  return NextResponse.json<{ user: Profile }>({ user: profile });
}