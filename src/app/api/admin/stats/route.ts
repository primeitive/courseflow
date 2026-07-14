import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/session";

// GET /api/admin/stats — platform-wide metrics for admin dashboard
export async function GET() {
  try {
    await requireRole("admin");

    const supabase = createServiceRoleClient();

    // Get counts in parallel
    const [
      { count: totalUsers },
      { count: totalInstructors },
      { count: totalStudents },
      { count: totalCourses },
      { count: publishedCourses },
      { count: draftCourses },
      { count: totalTransactions },
      { count: paidTransactions },
      { count: totalEnrollments },
    ] = await Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("role", "instructor"),
      supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("role", "student"),
      supabase.from("courses").select("*", { count: "exact", head: true }),
      supabase
        .from("courses")
        .select("*", { count: "exact", head: true })
        .eq("status", "published"),
      supabase
        .from("courses")
        .select("*", { count: "exact", head: true })
        .eq("status", "draft"),
      supabase.from("transactions").select("*", { count: "exact", head: true }),
      supabase
        .from("transactions")
        .select("*", { count: "exact", head: true })
        .eq("xendit_status", "PAID"),
      supabase.from("enrollments").select("*", { count: "exact", head: true }),
    ]);

    // Total revenue (sum of paid transactions)
    const { data: paidTxns } = await supabase
      .from("transactions")
      .select("total_amount")
      .eq("xendit_status", "PAID");

    const totalRevenue = (paidTxns ?? []).reduce(
      (s, t) => s + Number(t.total_amount),
      0
    );

    // Recent transactions (8 terbaru)
    const { data: recentTxnsData } = await supabase
      .from("transactions")
      .select(
        `
        id, total_amount, xendit_invoice_id, xendit_status, xendit_payment_method,
        paid_at, created_at,
        user:profiles!transactions_user_id_fkey(id, full_name, email, avatar_url),
        transaction_items(id, course_id, course:courses(id, title))
        `
      )
      .order("created_at", { ascending: false })
      .limit(8);

     
    const recentTransactions = (recentTxnsData ?? []).map((t: any) => {
      const userData = t.user
        ? Array.isArray(t.user)
          ? t.user[0]
          : t.user
        : null;

      return {
        id: t.id,
        totalAmount: Number(t.total_amount),
        xenditInvoiceId: t.xendit_invoice_id,
        xenditStatus: t.xendit_status,
        xenditPaymentMethod: t.xendit_payment_method,
        paidAt: t.paid_at,
        createdAt: t.created_at,
        user: userData
          ? {
              id: userData.id,
              fullName: userData.full_name,
              email: userData.email,
              avatarUrl: userData.avatar_url,
            }
          : null,
        itemCount: t.transaction_items?.length ?? 0,
        items: (t.transaction_items ?? []).map((it: any) => ({
          id: it.id,
          priceAtPurchase: Number(it.price_at_purchase),
          course: it.course
            ? {
                id: it.course.id,
                title: it.course.title,
              }
            : null,
        })),
      };
    });
     

    // Recent users (6 terbaru)
    const { data: recentUsersData } = await supabase
      .from("profiles")
      .select("id, full_name, email, role, avatar_url, created_at")
      .order("created_at", { ascending: false })
      .limit(6);

    const recentUsers = (recentUsersData ?? []).map((u) => ({
      id: u.id,
      fullName: u.full_name,
      email: u.email,
      role: u.role,
      avatarUrl: u.avatar_url,
      createdAt: u.created_at,
    }));

    // Top courses (by enrollment count)
    const { data: allCourses } = await supabase
      .from("courses")
      .select(
        `
        id, title, price, status,
        instructor:profiles!instructor_id(id, full_name),
        enrollments(count)
        `
      )
      .eq("status", "published");

     
    const topCourses = (allCourses ?? [])
      .map((c: any) => {
        const instructorData = c.instructor
          ? Array.isArray(c.instructor)
            ? c.instructor[0]
            : c.instructor
          : null;
        return {
          id: c.id,
          title: c.title,
          price: Number(c.price),
          status: c.status,
          instructor: instructorData
            ? {
                id: instructorData.id,
                fullName: instructorData.full_name,
              }
            : null,
          enrollmentCount: c.enrollments?.[0]?.count ?? 0,
        };
      })
      .sort((a, b) => b.enrollmentCount - a.enrollmentCount)
      .slice(0, 5);
     

    // Revenue by day (last 14 days)
    const since = new Date();
    since.setDate(since.getDate() - 13);
    since.setHours(0, 0, 0, 0);

    const { data: paidTxnsWithDate } = await supabase
      .from("transactions")
      .select("paid_at, total_amount")
      .eq("xendit_status", "PAID")
      .not("paid_at", "is", null)
      .gte("paid_at", since.toISOString());

    const byDay: Record<string, number> = {};
    for (let i = 0; i < 14; i++) {
      const d = new Date(since);
      d.setDate(d.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      byDay[key] = 0;
    }
    for (const t of paidTxnsWithDate ?? []) {
      if (!t.paid_at) continue;
      const key = t.paid_at.slice(0, 10);
      if (key in byDay) byDay[key] += Number(t.total_amount);
    }

    const revenueSeries = Object.entries(byDay).map(([date, amount]) => ({
      date,
      amount,
    }));

    return NextResponse.json({
      stats: {
        totalUsers: totalUsers ?? 0,
        totalInstructors: totalInstructors ?? 0,
        totalStudents: totalStudents ?? 0,
        totalCourses: totalCourses ?? 0,
        publishedCourses: publishedCourses ?? 0,
        draftCourses: draftCourses ?? 0,
        totalTransactions: totalTransactions ?? 0,
        paidTransactions: paidTransactions ?? 0,
        totalRevenue,
        totalEnrollments: totalEnrollments ?? 0,
        revenueSeries,
      },
      recentTransactions,
      recentUsers,
      topCourses,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Server error";
    const status =
      msg === "UNAUTHORIZED" ? 401 : msg === "FORBIDDEN" ? 403 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}