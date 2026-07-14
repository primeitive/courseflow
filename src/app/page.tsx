"use client";

import * as React from "react";
import { useRouterStore } from "@/store/router";
import { useAuthStore } from "@/store/auth";
import { AppShell } from "@/components/layout/app-shell";
import { LoadingState } from "@/components/common/states";
import { toast } from "sonner";
import type { Route } from "@/types";

// ─── View imports ───────────────────────────────────────────────────────────
import { HomeView } from "@/views/main/home-view";
import { AllCoursesView } from "@/views/main/all-courses-view";
import { MyLearningView } from "@/views/main/my-learning-view";
import { CourseDetailView } from "@/views/main/course-detail-view";
import { CartView } from "@/views/main/cart-view";
import { CheckoutView } from "@/views/main/checkout-view";
import { PaymentSuccessView } from "@/views/main/payment-success-view";
import { ProfileView } from "@/views/main/profile-view";

import { LoginView } from "@/views/auth/login-view";
import { SignupView } from "@/views/auth/signup-view";
import { VerifyCodeView } from "@/views/auth/verify-code-view";

import { TeachDashboardView } from "@/views/teach/teach-dashboard-view";
import { CourseEditorView } from "@/views/teach/course-editor-view";
import { TeachRevenueView } from "@/views/teach/teach-revenue-view";

import { AdminDashboardView } from "@/views/admin/admin-dashboard-view";
import { AdminCoursesView } from "@/views/admin/admin-courses-view";
import { AdminUsersView } from "@/views/admin/admin-users-view";
import { AdminTransactionsView } from "@/views/admin/admin-transactions-view";

export default function HomePage() {
  const route = useRouterStore((s) => s.route);
  const navigate = useRouterStore((s) => s.navigate);
  const user = useAuthStore((s) => s.user);
  const isLoadingAuth = useAuthStore((s) => s.isLoading);
  const hasFetchedAuth = useAuthStore((s) => s.hasFetched);
  const fetchAuth = useAuthStore((s) => s.fetch);

  // Hydrate auth on first paint
  React.useEffect(() => {
    fetchAuth();
  }, [fetchAuth]);

  // ─── Route guards ──────────────────────────────────────────────────────
  // If the route requires auth or a specific role, redirect when the user
  // doesn't qualify. We only redirect after auth has finished loading to
  // avoid flicker.
  React.useEffect(() => {
    if (!hasFetchedAuth) return;

    const requiresAuth = [
      "profile",
      "cart",
      "checkout",
      "my-learning",
      "teach",
      "teach-courses",
      "teach-course-edit",
      "teach-revenue",
      "admin",
      "admin-courses",
      "admin-users",
      "admin-instructors",
      "admin-transactions",
      "payment-success",
    ];

    if (!user && requiresAuth.includes(route.name)) {
      navigate({ name: "login" });
      return;
    }

    if (user) {
      const instructorOnly = [
        "teach",
        "teach-courses",
        "teach-course-edit",
        "teach-revenue",
      ];
      const adminOnly = [
        "admin",
        "admin-courses",
        "admin-users",
        "admin-instructors",
        "admin-transactions",
      ];
      if (instructorOnly.includes(route.name) && user.role === "student") {
        toast.error("Instructor access required");
        navigate({ name: "home" });
        return;
      }
      if (adminOnly.includes(route.name) && user.role !== "admin") {
        toast.error("Admin access required");
        navigate({ name: "home" });
        return;
      }
    }
  }, [route.name, user, hasFetchedAuth, navigate]);

  // ─── Loading screen during initial auth fetch ─────────────────────────
  if (isLoadingAuth && !hasFetchedAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <LoadingState label="Loading Courseflow…" />
      </div>
    );
  }

  // ─── Course editor mode (own navbar, no global footer) ────────────────
  if (route.name === "teach-course-edit") {
    return (
      <AppShell mode="course-editor">
        <CourseEditorView courseId={route.courseId ?? ""} />
      </AppShell>
    );
  }

  // ─── Auth views (own layout, no main navbar) ──────────────────────────
  if (route.name === "login") return <LoginView />;
  if (route.name === "signup") return <SignupView />;
  if (route.name === "verify") return <VerifyCodeView email={route.email} />;

  // ─── Determine mode by route prefix ───────────────────────────────────
  const isAdminRoute = route.name.startsWith("admin");
  const isTeachRoute = route.name.startsWith("teach");
  const mode: "main" | "teach" | "admin" = isAdminRoute
    ? "admin"
    : isTeachRoute
    ? "teach"
    : "main";

  return (
    <AppShell mode={mode}>
      <RouteRenderer route={route} />
    </AppShell>
  );
}

function RouteRenderer({ route }: { route: Route }) {
  switch (route.name) {
    // Main
    case "home":
      return <HomeView />;
    case "courses":
      return <AllCoursesView />;
    case "my-learning":
      return <MyLearningView />;
    case "course":
      return <CourseDetailView courseId={route.courseId} />;
    case "cart":
      return <CartView />;
    case "checkout":
      return <CheckoutView />;
    case "payment-success":
      return <PaymentSuccessView transactionId={route.transactionId} />;
    case "profile":
      return <ProfileView />;

    // Teach
    case "teach":
    case "teach-courses":
      return <TeachDashboardView />;
    case "teach-revenue":
      return <TeachRevenueView />;

    // Admin
    case "admin":
      return <AdminDashboardView />;
    case "admin-courses":
      return <AdminCoursesView />;
    case "admin-users":
      return (
        <AdminUsersView
          title="Manage users"
          description="View and manage user roles across the platform."
        />
      );
    case "admin-instructors":
      return (
        <AdminUsersView
          filterRole="instructor"
          title="Instructors"
          description="Manage instructor accounts and their courses."
        />
      );
    case "admin-transactions":
      return <AdminTransactionsView />;

    default:
      return <HomeView />;
  }
}
