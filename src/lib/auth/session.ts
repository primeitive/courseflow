import { createClient } from "@/lib/supabase/server";
import type { Role, Session } from "@/types";

// Ambil session user yang lagi login
// Return null kalau tidak login
export async function getSession(): Promise<Session | null> {
  const supabase = await createClient();
  
  // Cek apakah ada user yang login (via Supabase Auth)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Ambil data profile dari tabel profiles
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email, full_name, avatar_url, role")
    .eq("id", user.id)
    .single();

  if (!profile) return null;

  return {
    userId: profile.id,
    email: profile.email,
    fullName: profile.full_name,
    role: profile.role as Role,
    avatarUrl: profile.avatar_url,
  };
}

// Minta user harus login. Kalau tidak, throw error "UNAUTHORIZED"
export async function requireUser(): Promise<Session> {
  const session = await getSession();
  if (!session) throw new Error("UNAUTHORIZED");
  return session;
}

// Minta user harus login DAN punya role tertentu
// Contoh: requireRole("instructor", "admin") → hanya instructor atau admin yang boleh
export async function requireRole(...roles: Role[]): Promise<Session> {
  const session = await requireUser();
  if (!roles.includes(session.role)) throw new Error("FORBIDDEN");
  return session;
}