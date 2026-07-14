"use client";

import * as React from "react";
import { useFetch } from "@/hooks/use-fetch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DollarSign,
  ShoppingBag,
  TrendingUp,
  Loader2,
  Sparkles,
} from "lucide-react";
import { LoadingState, ErrorState } from "@/components/common/states";
import { formatPrice, formatDate } from "@/lib/format";

interface RevenueData {
  revenue: {
    total: number;
    sales: number;
    byCourse: Array<{
      courseId: string;
      title: string;
      thumbnailUrl: string | null;
      sales: number;
      revenue: number;
    }>;
    series: Array<{ date: string; amount: number }>;
  };
  courses: Array<{ status: string; count: number }>;
  recentTransactions: Array<{
    id: string;
    courseTitle: string;
    amount: number;
    paidAt: string | null;
  }>;
}

export function TeachRevenueView() {
  const { data, isLoading, error, refetch } = useFetch<RevenueData>({
    url: "/api/teach/revenue",
  });

  if (isLoading) return <LoadingState label="Loading revenue…" />;
  if (error || !data)
    return (
      <ErrorState
        title="Couldn't load revenue"
        description={error ?? undefined}
        onRetry={refetch}
      />
    );

  const { revenue, recentTransactions } = data;
  const avgPerSale = revenue.sales > 0 ? revenue.total / revenue.sales : 0;
  const maxByCourse = Math.max(...revenue.byCourse.map((c) => c.revenue), 1);
  const maxSeries = Math.max(...revenue.series.map((s) => s.amount), 1);

  return (
    <div className="animate-fade-in mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="mb-1 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
        Revenue
      </h1>
      <p className="mb-8 text-sm text-muted-foreground">
        Track your sales and earnings across all your courses.
      </p>

      {/* KPIs */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi
          icon={DollarSign}
          label="Total revenue"
          value={formatPrice(revenue.total)}
          sub={`${revenue.sales} sale${revenue.sales === 1 ? "" : "s"}`}
        />
        <Kpi
          icon={ShoppingBag}
          label="Total sales"
          value={String(revenue.sales)}
          sub="All-time"
        />
        <Kpi
          icon={TrendingUp}
          label="Avg. per sale"
          value={formatPrice(avgPerSale)}
          sub="Per transaction"
        />
        <Kpi
          icon={Sparkles}
          label="Active courses"
          value={String(revenue.byCourse.length)}
          sub="With sales"
        />
      </div>

      {/* Revenue chart (last 14 days) */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-base">Last 14 days</CardTitle>
          <CardDescription>Daily revenue from paid orders.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-44 items-end gap-1.5">
            {revenue.series.map((s) => (
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
              No sales in the last 14 days yet. Keep promoting your courses!
            </p>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* By course */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Revenue by course</CardTitle>
            <CardDescription>
              Which courses are earning the most.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {revenue.byCourse.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No sales yet.
              </p>
            ) : (
              <ul className="flex flex-col gap-3">
                {revenue.byCourse.map((c) => (
                  <li key={c.courseId} className="flex items-center gap-3">
                    <div className="h-9 w-9 shrink-0 overflow-hidden rounded-md bg-muted">
                      {c.thumbnailUrl && (
                         
                        <img
                          src={c.thumbnailUrl}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">
                        {c.title}
                      </p>
                      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{
                            width: `${(c.revenue / maxByCourse) * 100}%`,
                          }}
                        />
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {c.sales} sale{c.sales === 1 ? "" : "s"} ·{" "}
                        {formatPrice(c.revenue)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Recent transactions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent sales</CardTitle>
            <CardDescription>Your last 10 transactions.</CardDescription>
          </CardHeader>
          <CardContent>
            {recentTransactions.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No sales yet.
              </p>
            ) : (
              <ul className="flex flex-col divide-y divide-border">
                {recentTransactions.map((t) => (
                  <li
                    key={t.id}
                    className="flex items-center justify-between gap-2 py-2.5"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">
                        {t.courseTitle}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t.paidAt ? formatDate(t.paidAt) : "Pending"}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                      +{formatPrice(t.amount)}
                    </span>
                  </li>
                ))}
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
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <Card>
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
      </CardContent>
    </Card>
  );
}
