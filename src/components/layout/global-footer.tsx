"use client";

import { useRouterStore } from "@/store/router";
import { Globe } from "lucide-react";

export function GlobalFooter() {
  const navigate = useRouterStore((s) => s.navigate);
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-border/70 bg-card/40">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <button
              onClick={() => navigate({ name: "home" })}
              className="font-semibold text-foreground hover:text-primary transition-colors"
            >
              Courseflow
            </button>
            <span aria-hidden>·</span>
            <span>© {year} Courseflow. All rights reserved.</span>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <button
              onClick={() => navigate({ name: "courses" })}
              className="hover:text-foreground transition-colors"
            >
              Courses
            </button>
            <button
              onClick={() => navigate({ name: "teach" })}
              className="hover:text-foreground transition-colors"
            >
              Teach
            </button>
            <span className="flex items-center gap-1">
              <Globe className="h-3.5 w-3.5" />
              <span>English</span>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
