import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/session";

// GET /api/teach/revenue — revenue metrics for the current instructor
export async function GET() {
  try {
    const session = await requireRole("instructor", "admin");

    const supabase = await createClient();

    // Get all transaction items where this user is the instructor
    const { data: items, error } = await supabase
      .from("transaction_items")
      .select(
        `
        id, course_id, instructor_id, price_at_purchase,
        transaction:transactions(id, xendit_status, paid_at, created_at),
        course:courses(id, title, thumbnail_url, price)
        `
      )
      .eq("instructor_id", session.userId)
      .order("created_at", { referencedTable: "transactions", ascending: false });

    if (error) throw error;

     
    const paidItems = (items ?? []).filter(
      (i: any) =>
        i.transaction &&
        (Array.isArray(i.transaction)
          ? i.transaction[0]?.xendit_status === "PAID"
          : i.transaction?.xendit_status === "PAID")
    );

    const totalRevenue = paidItems.reduce(
      (s: number, i: any) => s + Number(i.price_at_purchase),
      0
    );
    const totalSales = paidItems.length;

    // Revenue by course
    const byCourseMap = new Map<
      string,
      {
        courseId: string;
        title: string;
        thumbnailUrl: string | null;
        sales: number;
        revenue: number;
      }
    >();

    for (const i of paidItems) {
      const courseId = i.course_id;
      const courseData = i.course
        ? Array.isArray(i.course)
          ? i.course[0]
          : i.course
        : null;
      const cur =
        byCourseMap.get(courseId) ??
        {
          courseId,
          title: courseData?.title ?? "Unknown",
          thumbnailUrl: courseData?.thumbnail_url ?? null,
          sales: 0,
          revenue: 0,
        };
      cur.sales += 1;
      cur.revenue += Number(i.price_at_purchase);
      byCourseMap.set(courseId, cur);
    }

    const byCourse = [...byCourseMap.values()].sort(
      (a, b) => b.revenue - a.revenue
    );

    // Revenue by day for the last 14 days
    const since = new Date();
    since.setDate(since.getDate() - 13);
    since.setHours(0, 0, 0, 0);

    const byDay: Record<string, number> = {};
    for (let i = 0; i < 14; i++) {
      const d = new Date(since);
      d.setDate(d.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      byDay[key] = 0;
    }

    for (const i of paidItems) {
      const txn = Array.isArray(i.transaction)
        ? i.transaction[0]
        : i.transaction;
      const paidAt = txn?.paid_at;
      if (!paidAt) continue;
      const key = paidAt.slice(0, 10);
      if (key in byDay) byDay[key] += Number(i.price_at_purchase);
    }

    const revenueSeries = Object.entries(byDay).map(([date, amount]) => ({
      date,
      amount,
    }));

    // Course counts by status
    const { data: courseCounts } = await supabase
      .from("courses")
      .select("status")
      .eq("instructor_id", session.userId);

    const courseCountMap: Record<string, number> = {};
    for (const c of courseCounts ?? []) {
      courseCountMap[c.status] = (courseCountMap[c.status] ?? 0) + 1;
    }

    const coursesByStatus = Object.entries(courseCountMap).map(
      ([status, count]) => ({ status, count })
    );

    // Recent transactions (top 10)
    const recentTransactions = paidItems.slice(0, 10).map((i: any) => {
      const txn = Array.isArray(i.transaction)
        ? i.transaction[0]
        : i.transaction;
      const courseData = i.course
        ? Array.isArray(i.course)
          ? i.course[0]
          : i.course
        : null;
      return {
        id: i.id,
        courseTitle: courseData?.title ?? "Unknown course",
        amount: Number(i.price_at_purchase),
        paidAt: txn?.paid_at ?? null,
      };
    });
     

    return NextResponse.json({
      revenue: {
        total: totalRevenue,
        sales: totalSales,
        byCourse,
        series: revenueSeries,
      },
      courses: coursesByStatus,
      recentTransactions,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Server error";
    const status =
      msg === "UNAUTHORIZED" ? 401 : msg === "FORBIDDEN" ? 403 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}