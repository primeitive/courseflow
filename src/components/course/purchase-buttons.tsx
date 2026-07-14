"use client";

import * as React from "react";
import { useRouterStore } from "@/store/router";
import { useCartStore } from "@/store/cart";
import { useAuthStore } from "@/store/auth";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Check, Loader2, Lock } from "lucide-react";
import { toast } from "sonner";

interface AddToCartButtonProps {
  courseId: string;
  inCart: boolean;
  isEnrolled: boolean;
  isOwn: boolean;
}

export function AddToCartButton({
  courseId,
  inCart,
  isEnrolled,
  isOwn,
}: AddToCartButtonProps) {
  const navigate = useRouterStore((s) => s.navigate);
  const user = useAuthStore((s) => s.user);
  const add = useCartStore((s) => s.add);
  const [loading, setLoading] = React.useState(false);

  if (isOwn) {
    return (
      <Button variant="outline" disabled className="h-11 w-full">
        Your own course
      </Button>
    );
  }
  if (isEnrolled) {
    return (
      <Button variant="outline" disabled className="h-11 w-full">
        <Check className="mr-2 h-4 w-4" />
        Enrolled
      </Button>
    );
  }
  if (inCart) {
    return (
      <Button
        variant="outline"
        className="h-11 w-full"
        onClick={() => navigate({ name: "cart" })}
      >
        <Check className="mr-2 h-4 w-4" />
        In cart — view cart
      </Button>
    );
  }

  const handleAdd = async () => {
    if (!user) {
      toast.info("Please sign in to add to cart");
      navigate({ name: "login" });
      return;
    }
    setLoading(true);
    try {
      await add(courseId);
      toast.success("Added to cart");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not add to cart");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      className="h-11 w-full"
      onClick={handleAdd}
      disabled={loading}
    >
      {loading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <ShoppingCart className="mr-2 h-4 w-4" />
      )}
      Add to cart
    </Button>
  );
}

interface BuyNowButtonProps {
  courseId: string;
  isEnrolled: boolean;
  isOwn: boolean;
}

export function BuyNowButton({ courseId, isEnrolled, isOwn }: BuyNowButtonProps) {
  const navigate = useRouterStore((s) => s.navigate);
  const user = useAuthStore((s) => s.user);
  const add = useCartStore((s) => s.add);
  const [loading, setLoading] = React.useState(false);

  if (isOwn) return null;
  if (isEnrolled) {
    return (
      <Button variant="secondary" className="h-11 w-full" disabled>
        <Check className="mr-2 h-4 w-4" />
        Already enrolled
      </Button>
    );
  }

  const handleBuyNow = async () => {
    if (!user) {
      toast.info("Please sign in to continue");
      navigate({ name: "login" });
      return;
    }
    setLoading(true);
    try {
      await add(courseId);
      navigate({ name: "checkout" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not start checkout");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      className="h-11 w-full"
      onClick={handleBuyNow}
      disabled={loading}
    >
      {loading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Lock className="mr-2 h-4 w-4" />
      )}
      Buy now
    </Button>
  );
}
