"use client";

import * as React from "react";
import { useFetch } from "@/hooks/use-fetch";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LoadingState, ErrorState, EmptyState } from "@/components/common/states";
import {
  Users,
  Search,
  X,
  Loader2,
  Shield,
  GraduationCap,
  BookUser,
} from "lucide-react";
import { formatDate, formatRelative, getInitials } from "@/lib/format";
import { toast } from "sonner";

interface AdminUser {
  id: string;
  email: string;
  fullName: string;
  avatarUrl: string | null;
  role: string;
  createdAt: string;
  updatedAt: string;
  enrollmentCount: number;
  courseCount: number;
  transactionCount: number;
}

export function AdminUsersView({
  filterRole,
  title,
  description,
}: {
  filterRole?: "instructor" | "student" | "admin";
  title?: string;
  description?: string;
}) {
  const { data, isLoading, error, refetch } = useFetch<{ users: AdminUser[] }>({
    url: "/api/admin/users",
  });
  const [search, setSearch] = React.useState("");
  const [updatingId, setUpdatingId] = React.useState<string | null>(null);

  const users = (data?.users ?? []).filter((u) => {
    if (filterRole && u.role !== filterRole) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        u.fullName.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const updateRole = async (userId: string, role: string) => {
    setUpdatingId(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Update failed");
      toast.success(`Role updated to ${role}`);
      refetch();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed");
    } finally {
      setUpdatingId(null);
    }
  };

  if (isLoading) return <LoadingState label="Loading users…" />;
  if (error)
    return (
      <ErrorState
        title="Couldn't load users"
        description={error}
        onRetry={refetch}
      />
    );

  return (
    <div className="animate-fade-in mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="mb-1 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
        {title ?? "Manage users"}
      </h1>
      <p className="mb-8 text-sm text-muted-foreground">
        {description ?? "View and manage user roles across the platform."}
      </p>

      {/* Search */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name or email…"
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
        <p className="text-xs text-muted-foreground">
          {users.length} {filterRole ?? "user"}
          {users.length === 1 ? "" : "s"}
        </p>
      </div>

      {users.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No users match"
          description="Try a different search."
        />
      ) : (
        <div className="grid gap-3">
          {users.map((u) => {
            const RoleIcon =
              u.role === "admin"
                ? Shield
                : u.role === "instructor"
                ? GraduationCap
                : BookUser;
            return (
              <Card key={u.id} className="card-hover">
                <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                  <Avatar className="h-11 w-11 shrink-0 border border-border">
                    {u.avatarUrl && (
                      <AvatarImage src={u.avatarUrl} alt={u.fullName} />
                    )}
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                      {getInitials(u.fullName)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {u.fullName}
                      </p>
                      <Badge
                        variant="secondary"
                        className="gap-1 capitalize"
                      >
                        <RoleIcon className="h-3 w-3" />
                        {u.role}
                      </Badge>
                    </div>
                    <p className="truncate text-xs text-muted-foreground">
                      {u.email}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                      <span>{u.enrollmentCount} enrollments</span>
                      <span>·</span>
                      <span>{u.courseCount} courses</span>
                      <span>·</span>
                      <span>{u.transactionCount} transactions</span>
                      <span>·</span>
                      <span>Joined {formatRelative(u.createdAt)}</span>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <Select
                      value={u.role}
                      onValueChange={(v) => updateRole(u.id, v)}
                      disabled={updatingId === u.id}
                    >
                      <SelectTrigger className="h-9 w-[130px]" size="sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="student">Student</SelectItem>
                        <SelectItem value="instructor">Instructor</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
