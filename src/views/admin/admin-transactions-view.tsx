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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { LoadingState, ErrorState, EmptyState } from "@/components/common/states";
import {
  DollarSign,
  Search,
  X,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { formatPrice, formatDateTime } from "@/lib/format";

interface AdminTransaction {
  id: string;
  totalAmount: number;
  xenditInvoiceId: string | null;
  xenditPaymentMethod: string | null;
  xenditStatus: string | null;
  paidAt: string | null;
  createdAt: string;
  user: {
    id: string;
    fullName: string;
    email: string;
    avatarUrl: string | null;
  };
  items: Array<{
    id: string;
    priceAtPurchase: number;
    course: { id: string; title: string };
  }>;
}

interface AdminStatsResponse {
  stats: {
    totalRevenue: number;
    totalTransactions: number;
    paidTransactions: number;
    totalEnrollments: number;
    totalUsers: number;
    totalCourses: number;
    publishedCourses: number;
    draftCourses: number;
    totalInstructors: number;
    totalStudents: number;
    revenueSeries: Array<{ date: string; amount: number }>;
  };
  recentTransactions: AdminTransaction[];
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

export function AdminTransactionsView() {
  const { data, isLoading, error, refetch } = useFetch<AdminStatsResponse>({
    url: "/api/admin/stats",
  });

  const transactions = data?.recentTransactions ?? [];
  const [search, setSearch] = React.useState("");

  const filtered = transactions.filter((t) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      t.user.fullName.toLowerCase().includes(q) ||
      t.user.email.toLowerCase().includes(q) ||
      (t.xenditInvoiceId ?? "").toLowerCase().includes(q)
    );
  });

  if (isLoading) return <LoadingState label="Loading transactions…" />;
  if (error)
    return (
      <ErrorState
        title="Couldn't load transactions"
        description={error}
        onRetry={refetch}
      />
    );

  const totalRevenue = transactions
    .filter((t) => t.xenditStatus === "PAID")
    .reduce((s, t) => s + t.totalAmount, 0);

  return (
    <div className="animate-fade-in mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="mb-1 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
        Transactions
      </h1>
      <p className="mb-8 text-sm text-muted-foreground">
        All payment activity across the platform.
      </p>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 text-muted-foreground">
              <DollarSign className="h-4 w-4 text-primary" />
              <span className="text-xs font-medium uppercase tracking-wider">
                Recent revenue
              </span>
            </div>
            <p className="mt-2 text-2xl font-bold text-foreground">
              {formatPrice(totalRevenue)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              <span className="text-xs font-medium uppercase tracking-wider">
                Paid
              </span>
            </div>
            <p className="mt-2 text-2xl font-bold text-foreground">
              {transactions.filter((t) => t.xenditStatus === "PAID").length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4 text-amber-500" />
              <span className="text-xs font-medium uppercase tracking-wider">
                Pending
              </span>
            </div>
            <p className="mt-2 text-2xl font-bold text-foreground">
              {transactions.filter((t) => t.xenditStatus === "PENDING").length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search user or invoice ID…"
            className="h-9 pl-9 pr-9"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
              aria-label="Clear"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <p className="hidden text-xs text-muted-foreground sm:block">
          {filtered.length} of {transactions.length} shown
        </p>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={DollarSign}
          title="No transactions yet"
          description="Paid orders will appear here."
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent transactions</CardTitle>
            <CardDescription>
              Showing the latest paid and pending orders.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell>
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {t.user.fullName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {t.user.email}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[280px]">
                          {!t.items || t.items.length === 0 ? (
                            <span className="text-xs text-muted-foreground">
                              —
                            </span>
                          ) : (
                            <>
                              <p className="truncate text-xs font-medium text-foreground">
                                {t.items[0]?.course?.title ?? "Untitled"}
                              </p>
                              {t.items.length > 1 && (
                                <p className="text-xs text-muted-foreground">
                                  + {t.items.length - 1} more
                                </p>
                              )}
                            </>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-muted-foreground">
                          {t.xenditPaymentMethod ?? "—"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <StatusPill status={t.xenditStatus} />
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-muted-foreground">
                          {formatDateTime(t.paidAt ?? t.createdAt)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-sm font-semibold text-foreground">
                          {formatPrice(t.totalAmount)}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StatusPill({ status }: { status: string | null }) {
  if (status === "PAID")
    return (
      <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300">
        Paid
      </Badge>
    );
  if (status === "PENDING")
    return (
      <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 dark:bg-amber-950/60 dark:text-amber-300">
        Pending
      </Badge>
    );
  if (status === "FAILED" || status === "EXPIRED")
    return <Badge variant="destructive">{status}</Badge>;
  return <Badge variant="secondary">{status ?? "—"}</Badge>;
}
