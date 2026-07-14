"use client";

import * as React from "react";
import { useRouterStore } from "@/store/router";
import { useCartStore } from "@/store/cart";
import { useAuthStore } from "@/store/auth";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { EmptyState, LoadingState } from "@/components/common/states";
import {
  ShoppingCart,
  CreditCard,
  Wallet,
  Landmark,
  Lock,
  Loader2,
  ArrowLeft,
  CheckCircle2,
} from "lucide-react";
import { formatPrice } from "@/lib/format";
import { toast } from "sonner";
import type { Transaction } from "@/types";

const PAYMENT_METHODS = [
  {
    id: "CREDIT_CARD",
    label: "Credit / debit card",
    description: "Visa, Mastercard, JCB, Amex",
    icon: CreditCard,
  },
  {
    id: "EWALLET",
    label: "E-wallet",
    description: "GoPay, OVO, DANA, ShopeePay",
    icon: Wallet,
  },
  {
    id: "BANK_TRANSFER",
    label: "Bank transfer",
    description: "Virtual account (BCA, Mandiri, BNI, BRI)",
    icon: Landmark,
  },
] as const;

export function CheckoutView() {
  const navigate = useRouterStore((s) => s.navigate);
  const user = useAuthStore((s) => s.user);
  const { items, isLoading, hasFetched, fetch: refreshCart } = useCartStore();
  const [paymentMethod, setPaymentMethod] = React.useState<string>("EWALLET");
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (user) refreshCart();
  }, [user, refreshCart]);

  const total = items.reduce(
    (sum, i) => sum + (i.course?.price ?? 0),
    0
  );

  const onCheckout = async () => {
    if (items.length === 0) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({ courseId: i.courseId })),
          paymentMethod,
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Checkout failed");

      const txn = body.transaction as Transaction;
      // Refresh cart after successful purchase
      await refreshCart();
      toast.success("Payment successful!");
      navigate({ name: "payment-success", transactionId: txn.id });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Checkout failed");
      toast.error(e instanceof Error ? e.message : "Checkout failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) {
    return (
      <EmptyState
        icon={Lock}
        title="Sign in to check out"
        description="You need an account to complete your purchase."
        action={
          <Button onClick={() => navigate({ name: "login" })}>Sign in</Button>
        }
      />
    );
  }

  if (isLoading && !hasFetched) {
    return <LoadingState label="Loading checkout…" />;
  }

  if (items.length === 0) {
    return (
      <EmptyState
        icon={ShoppingCart}
        title="Nothing to check out"
        description="Your cart is empty. Add a course first."
        action={
          <Button onClick={() => navigate({ name: "courses" })}>
            Browse courses
          </Button>
        }
      />
    );
  }

  return (
    <div className="animate-fade-in mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate({ name: "cart" })}
        className="mb-4"
      >
        <ArrowLeft className="mr-1.5 h-4 w-4" />
        Back to cart
      </Button>
      <h1 className="mb-1 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
        Checkout
      </h1>
      <p className="mb-8 text-sm text-muted-foreground">
        Complete your purchase. This is a sandbox — no real payment is processed.
      </p>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Items + payment */}
        <div className="space-y-6 lg:col-span-2">
          {/* Items */}
          <div>
            <h2 className="mb-3 text-sm font-semibold text-foreground">
              You&apos;re buying ({items.length})
            </h2>
            <ul className="flex flex-col gap-3">
              {items.map((item) => {
                const c = item.course;
                if (!c) return null;
                return (
                  <li
                    key={item.id}
                    className="flex items-center gap-4 rounded-lg border border-border bg-card p-3"
                  >
                    <div className="aspect-video w-20 shrink-0 overflow-hidden rounded-md bg-muted">
                      {c.thumbnailUrl ? (
                        <img
                          src={c.thumbnailUrl}
                          alt={c.title}
                          className="h-full w-full object-cover"
                        />
                      ) : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-1 text-sm font-medium text-foreground">
                        {c.title}
                      </p>
                      {c.instructor && (
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {c.instructor.fullName}
                        </p>
                      )}
                    </div>
                    <span className="text-sm font-semibold text-foreground">
                      {formatPrice(c.price)}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Payment method */}
          <div>
            <h2 className="mb-3 text-sm font-semibold text-foreground">
              Payment method
            </h2>
            <RadioGroup
              value={paymentMethod}
              onValueChange={setPaymentMethod}
              className="grid gap-2"
            >
              {PAYMENT_METHODS.map((m) => {
                const Icon = m.icon;
                return (
                  <Label
                    key={m.id}
                    htmlFor={m.id}
                    className="flex cursor-pointer items-center gap-3 rounded-lg border border-border bg-card p-3 transition hover:border-primary/40 hover:bg-accent/40 has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                  >
                    <RadioGroupItem value={m.id} id={m.id} />
                    <Icon className="h-4 w-4 text-primary" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">
                        {m.label}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {m.description}
                      </p>
                    </div>
                  </Label>
                );
              })}
            </RadioGroup>

            <div className="mt-4 flex items-center gap-2 rounded-md border border-dashed border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
              <Lock className="h-3 w-3" />
              This is a demo. No real payment is processed — clicking
              &quot;Pay&quot; simulates a successful Xendit invoice immediately.
            </div>
          </div>
        </div>

        {/* Summary */}
        <aside>
          <div className="lg:sticky lg:top-20 rounded-xl border border-border bg-card p-5">
            <h2 className="text-sm font-semibold text-foreground">
              Order summary
            </h2>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span className="text-foreground">{formatPrice(total)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Processing fee</span>
                <span className="text-foreground">$0.00</span>
              </div>
            </div>
            <Separator className="my-4" />
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-medium text-foreground">Total</span>
              <span className="text-xl font-bold text-foreground">
                {formatPrice(total)}
              </span>
            </div>

            {error && (
              <div className="mt-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            )}

            <Button
              className="mt-5 h-11 w-full"
              size="lg"
              onClick={onCheckout}
              disabled={submitting}
            >
              {submitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Lock className="mr-2 h-4 w-4" />
              )}
              {submitting ? "Processing…" : `Pay ${formatPrice(total)}`}
            </Button>
            <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
              <CheckCircle2 className="h-3 w-3 text-primary" />
              Secure checkout · 30-day money-back guarantee
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}