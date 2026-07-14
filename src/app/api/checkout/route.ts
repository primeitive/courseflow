import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth/session";
import { randomBytes } from "crypto";
import type { ApiResponse, Transaction } from "@/types";

// POST /api/checkout
// Body: { items: [{ courseId }], paymentMethod: "EWALLET"|"BANK_TRANSFER"|"CREDIT_CARD" }
// Simulates Xendit payment — invoice immediately "paid".
// NOTE: Not atomic (no DB transaction in Supabase JS client).
// For production, use a Postgres RPC function.
export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json<ApiResponse>(
        { error: "Please sign in to checkout." },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const items: Array<{ courseId: string }> = Array.isArray(body.items)
      ? body.items
      : [];
    const paymentMethod = String(body.paymentMethod ?? "EWALLET").toUpperCase();

    if (!items.length) {
      return NextResponse.json<ApiResponse>(
        { error: "Your cart is empty." },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const courseIds = items.map((i) => i.courseId).filter(Boolean);

    // Fetch courses
    const { data: courses, error: coursesError } = await supabase
      .from("courses")
      .select("id, title, price, status, instructor_id")
      .in("id", courseIds)
      .eq("status", "published");

    if (coursesError || !courses || courses.length !== courseIds.length) {
      return NextResponse.json<ApiResponse>(
        { error: "One or more courses are no longer available." },
        { status: 400 }
      );
    }

    // Don't allow buying own course
    const ownCourse = courses.find(
      (c) => c.instructor_id === session.userId
    );
    if (ownCourse) {
      return NextResponse.json<ApiResponse>(
        { error: "You can't buy your own course." },
        { status: 400 }
      );
    }

    // Check already enrolled
    const { data: existingEnrollments } = await supabase
      .from("enrollments")
      .select("course_id")
      .eq("user_id", session.userId)
      .in("course_id", courseIds);

    if (existingEnrollments && existingEnrollments.length > 0) {
      return NextResponse.json<ApiResponse>(
        {
          error:
            "You're already enrolled in one or more of these courses.",
        },
        { status: 400 }
      );
    }

    const totalAmount = courses.reduce((s, c) => s + Number(c.price), 0);
    const xenditInvoiceId = "inv-" + randomBytes(8).toString("hex");
    const now = new Date().toISOString();

    // 1. Create transaction
    const { data: txn, error: txnError } = await supabase
      .from("transactions")
      .insert({
        user_id: session.userId,
        total_amount: totalAmount,
        xendit_invoice_id: xenditInvoiceId,
        xendit_payment_method: paymentMethod,
        xendit_status: "PAID",
        paid_at: now,
      })
      .select()
      .single();

    if (txnError || !txn) {
      console.error("[checkout] txn error:", txnError);
      return NextResponse.json<ApiResponse>(
        { error: "Failed to create transaction." },
        { status: 500 }
      );
    }

    // 2. Create transaction items
    const txnItems = courses.map((c) => ({
      transaction_id: txn.id,
      course_id: c.id,
      instructor_id: c.instructor_id,
      price_at_purchase: Number(c.price),
    }));

    const { error: itemsError } = await supabase
      .from("transaction_items")
      .insert(txnItems);

    if (itemsError) {
      // Best effort cleanup
      await supabase.from("transactions").delete().eq("id", txn.id);
      console.error("[checkout] items error:", itemsError);
      return NextResponse.json<ApiResponse>(
        { error: "Failed to create transaction items." },
        { status: 500 }
      );
    }

    // 3. Create enrollments
    const enrollments = courses.map((c) => ({
      user_id: session.userId,
      course_id: c.id,
    }));

    const { error: enrError } = await supabase
      .from("enrollments")
      .insert(enrollments);

    // Ignore unique constraint violations (already enrolled — shouldn't happen but just in case)
    if (enrError && enrError.code !== "23505") {
      // Best effort cleanup
      await supabase
        .from("transaction_items")
        .delete()
        .eq("transaction_id", txn.id);
      await supabase.from("transactions").delete().eq("id", txn.id);
      console.error("[checkout] enrollment error:", enrError);
      return NextResponse.json<ApiResponse>(
        { error: "Failed to create enrollments." },
        { status: 500 }
      );
    }

    // 4. Clear purchased items from cart
    await supabase
      .from("cart_items")
      .delete()
      .eq("user_id", session.userId)
      .in("course_id", courseIds);

    const out: Transaction = {
      id: txn.id,
      userId: txn.user_id,
      totalAmount: Number(txn.total_amount),
      xenditInvoiceId: txn.xendit_invoice_id,
      xenditPaymentMethod: txn.xendit_payment_method,
      xenditStatus: txn.xendit_status,
      paidAt: txn.paid_at,
      createdAt: txn.created_at,
    };

    return NextResponse.json<{ transaction: Transaction }>({
      transaction: out,
    });
  } catch (e) {
    console.error("[checkout]", e);
    return NextResponse.json<ApiResponse>(
      { error: "Checkout failed. Please try again." },
      { status: 500 }
    );
  }
}