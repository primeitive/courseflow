"use client";

import * as React from "react";
import { useRouterStore } from "@/store/router";
import { useAuthStore } from "@/store/auth";
import { useCartStore } from "@/store/cart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GraduationCap, Mail, User, ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  AuthLayout,
  Divider,
  GoogleOAuthButton,
} from "@/views/auth/login-view";

export function SignupView() {
  const navigate = useRouterStore((s) => s.navigate);
  const fetchAuth = useAuthStore((s) => s.fetch);
  const fetchCart = useCartStore((s) => s.fetch);

  const [fullName, setFullName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (fullName.trim().length < 2) {
      setError("Please enter your full name.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email, password }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Sign up failed");

      // Setelah signUp sukses (dengan email confirmation dimatikan),
      // user otomatis login. Fetch user data + cart, lalu navigate ke home.
      await fetchAuth();
      await fetchCart();

      toast.success("Account created!", {
        description: "Welcome to Courseflow.",
      });
      navigate({ name: "home" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sign up failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Free to start. Learn at your own pace. Cancel anytime."
      footer={
        <p className="text-sm text-muted-foreground">
          Already have an account?{" "}
          <button
            onClick={() => navigate({ name: "login" })}
            className="font-medium text-primary hover:underline"
          >
            Log in
          </button>
        </p>
      }
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="fullName">Full name</Label>
          <div className="relative">
            <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="fullName"
              type="text"
              autoComplete="name"
              placeholder="Ada Lovelace"
              className="h-10 pl-9"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              className="h-10 pl-9"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            placeholder="At least 6 characters"
            className="h-10"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {error && (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        )}

        <p className="text-[11px] leading-relaxed text-muted-foreground">
          By continuing, you agree to Courseflow&apos;s Terms of Service and
          acknowledge our Privacy Policy.
        </p>

        <Button
          type="submit"
          disabled={submitting}
          className="h-10 w-full"
          size="lg"
        >
          {submitting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <ArrowRight className="mr-2 h-4 w-4" />
          )}
          Continue
        </Button>
      </form>

      <Divider />

      <GoogleOAuthButton
        onClick={() =>
          toast.info("Google OAuth is a stub in this demo", {
            description: "Use email + password instead.",
          })
        }
      />
    </AuthLayout>
  );
}