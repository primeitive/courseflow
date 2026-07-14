"use client";

import * as React from "react";
import { useRouterStore } from "@/store/router";
import { useAuthStore } from "@/store/auth";
import { useCartStore as useCart } from "@/store/cart";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  EmptyState,
  LoadingState,
} from "@/components/common/states";
import {
  ShoppingCart,
  Trash2,
  ArrowRight,
  Loader2,
  GraduationCap,
} from "lucide-react";
import { formatPrice } from "@/lib/format";
import { toast } from "sonner";

export function CartView() {
  const navigate = useRouterStore((s) => s.navigate);
  const user = useAuthStore((s) => s.user);
  const { items, isLoading, hasFetched, fetch, remove } = useCart();
  const [removingId, setRemovingId] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (user) fetch();
  }, [user, fetch]);

  const total = items.reduce(
    (sum, i) => sum + (i.course?.price ?? 0),
    0
  );

  const handleRemove = async (courseId: string, title: string) => {
    setRemovingId(courseId);
    try {
      await remove(courseId);
      toast.success(`Removed "${title}" from cart`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to remove");
    } finally {
      setRemovingId(null);
    }
  };

  if (!user) {
    return (
      <EmptyState
        icon={ShoppingCart}
        title="Sign in to view your cart"
        description="Your cart is tied to your account. Sign in to pick up where you left off."
        action={
          <Button onClick={() => navigate({ name: "login" })}>Sign in</Button>
        }
      />
    );
  }

  if (isLoading && !hasFetched) {
    return <LoadingState label="Loading your cart…" />;
  }

  if (items.length === 0) {
    return (
      <EmptyState
        icon={ShoppingCart}
        title="Your cart is empty"
        description="Browse the catalogue and add courses you want to learn."
        action={
          <Button onClick={() => navigate({ name: "courses" })}>
            Browse courses
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        }
      />
    );
  }

  return (
    <div className="animate-fade-in mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="mb-1 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
        Your cart
      </h1>
      <p className="mb-8 text-sm text-muted-foreground">
        {items.length} {items.length === 1 ? "course" : "courses"} ready to
        check out.
      </p>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Items */}
        <div className="lg:col-span-2">
          <ul className="flex flex-col gap-4">
            {items.map((item) => {
              const course = item.course;
              if (!course) return null;
              return (
                <li
                  key={item.id}
                  className="flex gap-4 rounded-xl border border-border bg-card p-4"
                >
                  {/* Thumbnail */}
                  <button
                    onClick={() =>
                      navigate({ name: "course", courseId: course.id })
                    }
                    className="relative aspect-video w-32 shrink-0 overflow-hidden rounded-lg bg-muted sm:w-40"
                  >
                    {course.thumbnailUrl ? (
                       
                      <img
                        src={course.thumbnailUrl}
                        alt={course.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <GraduationCap className="h-6 w-6 text-muted-foreground/50" />
                      </div>
                    )}
                  </button>

                  {/* Info */}
                  <div className="flex min-w-0 flex-1 flex-col">
                    <button
                      onClick={() =>
                        navigate({ name: "course", courseId: course.id })
                      }
                      className="line-clamp-2 text-left text-sm font-semibold text-foreground hover:text-primary"
                    >
                      {course.title}
                    </button>
                    {course.subtitle && (
                      <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                        {course.subtitle}
                      </p>
                    )}
                    {course.instructor && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {course.instructor.fullName}
                      </p>
                    )}
                    <div className="mt-auto flex items-center justify-between pt-2">
                      <span className="text-sm font-semibold text-foreground">
                        {formatPrice(course.price)}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemove(course.id, course.title)}
                        disabled={removingId === course.id}
                        className="text-destructive hover:text-destructive"
                      >
                        {removingId === course.id ? (
                          <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                        )}
                        Remove
                      </Button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Summary */}
        <aside>
          <div className="lg:sticky lg:top-20 rounded-xl border border-border bg-card p-5">
            <h2 className="text-sm font-semibold tracking-tight text-foreground">
              Order summary
            </h2>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>
                  Subtotal ({items.length}{" "}
                  {items.length === 1 ? "course" : "courses"})
                </span>
                <span className="text-foreground">{formatPrice(total)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Estimated tax</span>
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
            <Button
              className="mt-5 h-11 w-full"
              size="lg"
              onClick={() => navigate({ name: "checkout" })}
            >
              Checkout
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <p className="mt-3 text-center text-xs text-muted-foreground">
              <GraduationCap className="mr-1 inline h-3 w-3" />
              30-day money-back guarantee
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
