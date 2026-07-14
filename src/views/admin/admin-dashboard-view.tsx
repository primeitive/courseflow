"use client";

import * as React from "react";
import { useRouterStore } from "@/store/router";
import { useFetch } from "@/hooks/use-fetch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  DollarSign,
  BookOpen,
  GraduationCap,
  TrendingUp,
  ArrowRight,
  ShoppingBag,
} from "lucide-react";
import { LoadingState, ErrorState } from "@/components/common/states";
import { formatPrice, formatDate, formatRelative, getInitials } from "@/lib/format";

interface AdminStats {
  totalUsers: number;
  totalInstructors: number;
  totalStudents: number;
  totalCourses: number;
  publishedCourses: number;
  draftCourses: number;
  totalTransactions: number;
  paidTransactions: number;
  totalRevenue: number;
  totalEnrollments: number;
  revenueSeries: Array<{ date: string; amount: number }>;
}

interface RecentTransaction {
  id: string;
  totalAmount: number;
  xenditStatus: string | null;
  xenditPaymentMethod: string | null;
  paidAt: string | null;
  createdAt: string;
  user: { id: string; fullName: string; email: string; avatarUrl: string | null };
  itemCount: number;
}

interface AdminStatsResponse {
  stats: AdminStats;
  recentTransactions: RecentTransaction[];
  recentUsers: Array<{
    id: string;
    fullName: string;
    email: string;
    role: string;
    avatarUrl: string | null;
    createdAt: string;
  }>;
  topCourses: Array<{
    id: string;
    title: string;
    price: number;
    status: string;
    instructor: { id: string; fullName: string };
    enrollmentCount: number;
  }>;
}

export function AdminDashboardView() {
  const navigate = useRouterStore((s) => s.navigate);
  const { data, isLoading, error, refetch } = useFetch<AdminStatsResponse>({
    url: "/api/admin/stats",
  });

  if (isLoading) return <LoadingState label="Loading platform stats…" />;
  if (error || !data)
    return (
      <ErrorState
        title="Couldn't load admin dashboard"
        description={error ?? undefined}
        onRetry={refetch}
      />
    );

  const { stats, recentTransactions, recentUsers, topCourses } = data;
  const maxSeries = Math.max(...stats.revenueSeries.map((s) => s.amount), 1);

  return (
    <div className="animate-fade-in mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="mb-1 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
        Admin dashboard
      </h1>
      <p className="mb-8 text-sm text-muted-foreground">
        Platform-wide metrics and activity.
      </p>

      {/* KPI grid */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi
          icon={DollarSign}
          label="Total revenue"
          value={formatPrice(stats.totalRevenue)}
          sub={`${stats.paidTransactions} paid transactions`}
          action={() => navigate({ name: "admin-transactions" })}
        />
        <Kpi
          icon={Users}
          label="Total users"
          value={String(stats.totalUsers)}
          sub={`${stats.totalStudents} students · ${stats.totalInstructors} instructors`}
          action={() => navigate({ name: "admin-users" })}
        />
        <Kpi
          icon={BookOpen}
          label="Total courses"
          value={String(stats.totalCourses)}
          sub={`${stats.publishedCourses} published · ${stats.draftCourses} draft`}
          action={() => navigate({ name: "admin-courses" })}
        />
        <Kpi
          icon={ShoppingBag}
          label="Enrollments"
          value={String(stats.totalEnrollments)}
          sub={`${stats.totalTransactions} total transactions`}
        />
      </div>

      {/* Revenue chart */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-base">Revenue (last 14 days)</CardTitle>
          <CardDescription>
            Sum of paid transactions per day across the platform.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-44 items-end gap-1.5">
            {stats.revenueSeries.map((s) => (
              <div
                key={s.date}
                className="group relative flex flex-1 flex-col items-center justify-end"
                title={`${formatDate(s.date)}: ${formatPrice(s.amount)}`}
              >
                <div
                  className="w-full rounded-t bg-primary/80 transition group-hover:bg-primary"
                  style={{
                    height: `${Math.max(
                      (s.amount / maxSeries) * 100,
                      s.amount > 0 ? 4 : 0
                    )}%`,
                  }}
                />
                <span className="mt-1 hidden text-[10px] text-muted-foreground sm:block">
                  {new Date(s.date).getDate()}
                </span>
              </div>
            ))}
          </div>
          {maxSeries === 0 && (
            <p className="py-12 text-center text-sm text-muted-foreground">
              No revenue yet.
            </p>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent transactions */}
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Recent transactions</CardTitle>
              <CardDescription>Latest paid orders.</CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate({ name: "admin-transactions" })}
            >
              View all
              <ArrowRight className="ml-1.5 h-3 w-3" />
            </Button>
          </CardHeader>
          <CardContent>
            {recentTransactions.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No transactions yet.
              </p>
            ) : (
              <ul className="flex flex-col divide-y divide-border">
                {recentTransactions.map((t) => (
                  <li key={t.id} className="flex items-center gap-3 py-3">
                    <Avatar className="h-8 w-8 border border-border">
                      {t.user.avatarUrl && (
                        <AvatarImage
                          src={t.user.avatarUrl}
                          alt={t.user.fullName}
                        />
                      )}
                      <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                        {getInitials(t.user.fullName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">
                        {t.user.fullName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t.itemCount} course{t.itemCount === 1 ? "" : "s"} ·{" "}
                        {formatRelative(t.paidAt ?? t.createdAt)}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-foreground">
                      {formatPrice(t.totalAmount)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Top courses */}
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Top courses</CardTitle>
              <CardDescription>Most enrolled.</CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate({ name: "admin-courses" })}
            >
              View all
              <ArrowRight className="ml-1.5 h-3 w-3" />
            </Button>
          </CardHeader>
          <CardContent>
            {topCourses.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No courses yet.
              </p>
            ) : (
              <ol className="flex flex-col divide-y divide-border">
                {topCourses.map((c, idx) => (
                  <li key={c.id} className="flex items-center gap-3 py-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                      {idx + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">
                        {c.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {c.instructor.fullName} · {formatPrice(c.price)}
                      </p>
                    </div>
                    <Badge variant="secondary">{c.enrollmentCount}</Badge>
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>

        {/* Recent users */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">New users</CardTitle>
              <CardDescription>Latest signups.</CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate({ name: "admin-users" })}
            >
              View all
              <ArrowRight className="ml-1.5 h-3 w-3" />
            </Button>
          </CardHeader>
          <CardContent>
            {recentUsers.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No users yet.
              </p>
            ) : (
              <ul className="flex flex-col divide-y divide-border sm:grid sm:grid-cols-2 sm:divide-y-0">
                {recentUsers.map((u) => {
                  const RoleIcon =
                    u.role === "admin"
                      ? Shield
                      : u.role === "instructor"
                      ? GraduationCap
                      : Users;
                  return (
                    <li key={u.id} className="flex items-center gap-3 py-3 sm:py-2">
                      <Avatar className="h-8 w-8 border border-border">
                        {u.avatarUrl && (
                          <AvatarImage src={u.avatarUrl} alt={u.fullName} />
                        )}
                        <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                          {getInitials(u.fullName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">
                          {u.fullName}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {u.email}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <RoleIcon className="h-3 w-3" />
                        <span className="capitalize">{u.role}</span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Kpi({
  icon: Icon,
  label,
  value,
  sub,
  action,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  sub?: string;
  action?: () => void;
}) {
  return (
    <Card className="card-hover">
      <CardContent className="p-5">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Icon className="h-4 w-4 text-primary" />
          <span className="text-xs font-medium uppercase tracking-wider">
            {label}
          </span>
        </div>
        <p className="mt-2 text-2xl font-bold tracking-tight text-foreground">
          {value}
        </p>
        {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
        {action && (
          <Button
            variant="link"
            size="sm"
            onClick={action}
            className="mt-2 h-auto p-0 text-xs"
          >
            View details →
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

// local shield icon (lucide has one but we re-use)
function Shield({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
    </svg>
  );
}
