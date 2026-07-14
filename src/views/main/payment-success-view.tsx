"use client";

import * as React from "react";
import { useRouterStore } from "@/store/router";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ArrowRight, BookOpen, Home } from "lucide-react";

export function PaymentSuccessView({
  transactionId,
}: {
  transactionId: string;
}) {
  const navigate = useRouterStore((s) => s.navigate);

  return (
    <div className="animate-fade-in mx-auto flex min-h-[calc(100vh-4rem)] max-w-lg flex-col items-center justify-center px-4 py-10 text-center">
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
        <CheckCircle2 className="h-8 w-8" />
      </div>
      <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
        Payment successful
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Thanks for your purchase. You now have lifetime access to your new
        courses.
      </p>
      <p className="mt-4 rounded-md border border-dashed border-border bg-muted/30 px-3 py-1.5 font-mono text-xs text-muted-foreground">
        Transaction ID: {transactionId}
      </p>

      <div className="mt-8 flex w-full flex-col gap-2 sm:flex-row sm:justify-center">
        <Button onClick={() => navigate({ name: "courses" })}>
          <BookOpen className="mr-2 h-4 w-4" />
          Start learning
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
        <Button variant="outline" onClick={() => navigate({ name: "home" })}>
          <Home className="mr-2 h-4 w-4" />
          Back to home
        </Button>
      </div>
    </div>
  );
}
