"use client";

import * as React from "react";
import { useRouterStore } from "@/store/router";
import { MainNavbar } from "@/components/layout/main-navbar";
import { TeachNavbar } from "@/components/layout/teach-navbar";
import { AdminNavbar } from "@/components/layout/admin-navbar";
import { GlobalFooter } from "@/components/layout/global-footer";
import { CourseEditorNavbar } from "@/components/layout/course-editor-navbar";

interface AppShellProps {
  mode: "main" | "teach" | "admin" | "course-editor";
  children: React.ReactNode;
  // Course editor navbar extra props
  editorTitle?: string;
  editorStatus?: "draft" | "published" | "archived";
  editorOnSave?: () => void;
  editorOnDelete?: () => void;
  editorSaving?: boolean;
}

export function AppShell({
  mode,
  children,
  editorTitle,
  editorStatus = "draft",
  editorOnSave,
  editorOnDelete,
  editorSaving,
}: AppShellProps) {
  const route = useRouterStore((s) => s.route);

  // The course-editor mode renders its own navbar; main content fills the rest.
  if (mode === "course-editor") {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <CourseEditorNavbar
          title={editorTitle ?? "Course"}
          status={editorStatus}
          onSave={editorOnSave}
          onDelete={editorOnDelete}
          saving={editorSaving}
        />
        <main className="flex-1">{children}</main>
      </div>
    );
  }

  const Navbar =
    mode === "teach" ? TeachNavbar : mode === "admin" ? AdminNavbar : MainNavbar;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1">{children}</main>
      <GlobalFooter />
    </div>
  );
}
