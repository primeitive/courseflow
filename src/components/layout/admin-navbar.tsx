"use client";

import * as React from "react";
import { useRouterStore } from "@/store/router";
import { useAuthStore } from "@/store/auth";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import {
  LayoutDashboard,
  BookOpen,
  Users,
  DollarSign,
  GraduationCap,
  LogOut,
  ShieldCheck,
  Menu,
} from "lucide-react";
import { getInitials } from "@/lib/format";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import type { Route } from "@/types";

interface NavItem {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  route: Route;
  match: string[];
}

const NAV_ITEMS: NavItem[] = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    route: { name: "admin" },
    match: ["admin"],
  },
  {
    label: "Courses",
    icon: BookOpen,
    route: { name: "admin-courses" },
    match: ["admin-courses"],
  },
  {
    label: "Users",
    icon: Users,
    route: { name: "admin-users" },
    match: ["admin-users"],
  },
  {
    label: "Instructors",
    icon: GraduationCap,
    route: { name: "admin-instructors" },
    match: ["admin-instructors"],
  },
  {
    label: "Transactions",
    icon: DollarSign,
    route: { name: "admin-transactions" },
    match: ["admin-transactions"],
  },
];

export function AdminNavbar() {
  const navigate = useRouterStore((s) => s.navigate);
  const route = useRouterStore((s) => s.route);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const handleLogout = async () => {
    await logout();
    navigate({ name: "home" });
  };
  const go = (r: Route) => {
    navigate(r);
    setMobileOpen(false);
  };
  const isActive = (item: NavItem) => item.match.includes(route.name);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => go({ name: "admin" })}
          className="flex shrink-0 items-center gap-2"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <ShieldCheck className="h-5 w-5" />
          </span>
          <span className="hidden text-lg font-semibold tracking-tight sm:inline">
            Courseflow
            <span className="ml-1.5 text-xs font-normal text-muted-foreground">
              Admin
            </span>
          </span>
        </button>

        <nav className="ml-6 hidden items-center gap-1 lg:flex">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <Button
                key={item.label}
                variant={isActive(item) ? "secondary" : "ghost"}
                size="sm"
                onClick={() => go(item.route)}
                className="text-sm font-medium"
              >
                <Icon className="mr-1.5 h-3.5 w-3.5" />
                {item.label}
              </Button>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => go({ name: "home" })}
            className="hidden sm:inline-flex"
          >
            Exit admin
          </Button>
          <ThemeToggle />
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="ml-1 rounded-full ring-offset-background transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  aria-label="Open user menu"
                >
                  <Avatar className="h-9 w-9 border border-border">
                    {user.avatarUrl && (
                      <AvatarImage src={user.avatarUrl} alt={user.fullName} />
                    )}
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                      {getInitials(user.fullName)}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium leading-none">
                    {user.fullName}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {user.email}
                  </p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => go({ name: "home" })}>
                  <GraduationCap className="mr-2 h-4 w-4" /> Student view
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => go({ name: "profile" })}>
                  Profile
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" /> Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px]">
              <SheetHeader>
                <SheetTitle>Admin menu</SheetTitle>
              </SheetHeader>
              <div className="mt-6 flex flex-col gap-2">
                {NAV_ITEMS.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Button
                      key={item.label}
                      variant={isActive(item) ? "secondary" : "ghost"}
                      className="justify-start"
                      onClick={() => go(item.route)}
                    >
                      <Icon className="mr-2 h-4 w-4" />
                      {item.label}
                    </Button>
                  );
                })}
                <div className="my-2 h-px bg-border" />
                <Button
                  variant="ghost"
                  className="justify-start"
                  onClick={() => go({ name: "home" })}
                >
                  <GraduationCap className="mr-2 h-4 w-4" /> Exit admin
                </Button>
                <Button
                  variant="ghost"
                  className="justify-start text-destructive"
                  onClick={handleLogout}
                >
                  <LogOut className="mr-2 h-4 w-4" /> Log out
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
