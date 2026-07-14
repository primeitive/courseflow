"use client";

import * as React from "react";
import { useRouterStore } from "@/store/router";
import { useAuthStore } from "@/store/auth";
import { useCartStore } from "@/store/cart";
import { Button } from "@/components/ui/button";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { GraduationCap, ArrowRight, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { AuthLayout } from "@/views/auth/login-view";

export function VerifyCodeView({ email }: { email: string }) {
  const navigate = useRouterStore((s) => s.navigate);
  const fetchAuth = useAuthStore((s) => s.fetch);
  const fetchCart = useCartStore((s) => s.fetch);

  const [code, setCode] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [resending, setResending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) {
      setError("Please enter the 6-digit code.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, token: code }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Verification failed");

      // Hydrate session + cart
      await fetchAuth();
      await fetchCart();

      toast.success("You're signed in!", {
        description: "Welcome to Courseflow.",
      });
      navigate({ name: "home" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Verification failed");
    } finally {
      setSubmitting(false);
    }
  };

  const onResend = async () => {
    setResending(true);
    try {
      // Resend OTP — for demo we just call /login again with the same email.
      // (Server expects password; since we don't store it client-side, we just
      // show a friendly toast. The OTP "123456" always works.)
      toast.success("A new code has been sent", {
        description: "Demo code: 123456",
      });
    } finally {
      setResending(false);
    }
  };

  return (
    <AuthLayout
      title="Check your inbox"
      subtitle={`We sent a 6-digit verification code to ${email}.`}
      footer={
        <p className="text-sm text-muted-foreground">
          Wrong email?{" "}
          <button
            onClick={() => navigate({ name: "login" })}
            className="font-medium text-primary hover:underline"
          >
            Use a different email
          </button>
        </p>
      }
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-5">
        <div className="flex flex-col items-center gap-2">
          <label
            htmlFor="otp"
            className="text-sm font-medium text-foreground"
          >
            Enter verification code
          </label>
          <InputOTP
            id="otp"
            maxLength={6}
            value={code}
            onChange={(v) => setCode(v)}
            autoFocus
          >
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
        </div>

        {error && (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-center text-sm text-destructive">
            {error}
          </div>
        )}

        <Button
          type="submit"
          disabled={submitting || code.length !== 6}
          className="h-10 w-full"
          size="lg"
        >
          {submitting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <ArrowRight className="mr-2 h-4 w-4" />
          )}
          Verify and continue
        </Button>

        <div className="text-center">
          <button
            type="button"
            onClick={onResend}
            disabled={resending}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition hover:text-foreground disabled:opacity-50"
          >
            {resending ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <RefreshCw className="h-3 w-3" />
            )}
            Resend code
          </button>
        </div>

        <div className="rounded-md border border-dashed border-border bg-muted/30 px-3 py-2 text-center text-[11px] text-muted-foreground">
          <span className="font-medium text-foreground">Demo mode:</span> use
          code{" "}
          <span className="font-mono font-semibold text-foreground">123456</span>
        </div>
      </form>
    </AuthLayout>
  );
}
