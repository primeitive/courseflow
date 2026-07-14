"use client";

import * as React from "react";
import Link from "next/link";
import { useRouterStore } from "@/store/router";
import { useAuthStore } from "@/store/auth";
import { useCartStore } from "@/store/cart";
import { useUIStore } from "@/store/ui";
import type { Route } from "@/types";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import {
  Search,
  ShoppingCart,
  GraduationCap,
  Menu,
  User,
  LogOut,
  BookOpen,
  LayoutDashboard,
  Sparkles,
} from "lucide-react";
import { getInitials } from "@/lib/format";

export function MainNavbar() {
  const navigate = useRouterStore((s) => s.navigate);
  const user = useAuthStore((s) => s.user);
  const fetchAuth = useAuthStore((s) => s.fetch);
  const logout = useAuthStore((s) => s.logout);
  const cartCount = useCartStore((s) => s.items.length);
  const fetchCart = useCartStore((s) => s.fetch);
  const searchQuery = useUIStore((s) => s.searchQuery);
  const setSearchQuery = useUIStore((s) => s.setSearchQuery);
  const [localSearch, setLocalSearch] = React.useState(searchQuery);
  const [mobileOpen, setMobileOpen] = React.useState(false);

  // Hydrate auth + cart once on mount
  React.useEffect(() => {
    fetchAuth();
    fetchCart();
  }, [fetchAuth, fetchCart]);

  const goTo = (r: Route) => {
    navigate(r);
    setMobileOpen(false);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(localSearch);
    goTo({ name: "courses" });
  };

  const handleLogout = async () => {
    await logout();
    goTo({ name: "home" });
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-background/85 backdrop-blur-md supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <button
          onClick={() => goTo({ name: "home" })}
          className="flex shrink-0 items-center gap-2 rounded-md"
          aria-label="Courseflow home"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
            <GraduationCap className="h-5 w-5" />
          </span>
          <span className="hidden text-lg font-semibold tracking-tight sm:inline">
            Courseflow
          </span>
        </button>

        {/* Search (desktop) */}
        <form
          onSubmit={handleSearchSubmit}
          className="relative hidden flex-1 max-w-xl md:block"
        >
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="Search for courses, topics, instructors…"
            className="h-10 pl-9 pr-3"
            aria-label="Search courses"
          />
        </form>

        {/* Right cluster */}
        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          {/* Nav links */}
          <nav className="hidden items-center gap-1 md:flex">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => goTo({ name: "courses" })}
              className="text-sm font-medium"
            >
              All courses
            </Button>
            {user && (user.role === "instructor" || user.role === "admin") && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => goTo({ name: "teach" })}
                className="text-sm font-medium"
              >
                <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                Teach
              </Button>
            )}
            {user && user.role === "admin" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => goTo({ name: "admin" })}
                className="text-sm font-medium"
              >
                <LayoutDashboard className="mr-1.5 h-3.5 w-3.5" />
                Admin
              </Button>
            )}
          </nav>

          {/* Cart */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => goTo({ name: "cart" })}
            aria-label={`Cart with ${cartCount} items`}
            className="relative"
          >
            <ShoppingCart className="h-5 w-5" />
            {cartCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
                {cartCount}
              </span>
            )}
          </Button>

          <ThemeToggle />

          {/* Avatar menu (when logged in) */}
          {user ? (
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
                <DropdownMenuItem onClick={() => goTo({ name: "profile" })}>
                  <User className="mr-2 h-4 w-4" /> Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => goTo({ name: "my-learning" })}>
                  <BookOpen className="mr-2 h-4 w-4" /> My learning
                </DropdownMenuItem>
                {user.role === "instructor" && (
                  <DropdownMenuItem onClick={() => goTo({ name: "teach" })}>
                    <Sparkles className="mr-2 h-4 w-4" /> Instructor dashboard
                  </DropdownMenuItem>
                )}
                {user.role === "admin" && (
                  <DropdownMenuItem onClick={() => goTo({ name: "admin" })}>
                    <LayoutDashboard className="mr-2 h-4 w-4" /> Admin dashboard
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" /> Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => goTo({ name: "login" })}
              >
                Log in
              </Button>
              <Button size="sm" onClick={() => goTo({ name: "signup" })}>
                Sign up
              </Button>
            </div>
          )}

          {/* Mobile menu trigger */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[360px]">
              <SheetHeader>
                <SheetTitle>Menu</SheetTitle>
              </SheetHeader>
              <div className="mt-6 flex flex-col gap-3">
                <form onSubmit={handleSearchSubmit} className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={localSearch}
                    onChange={(e) => setLocalSearch(e.target.value)}
                    placeholder="Search courses…"
                    className="h-10 pl-9"
                  />
                </form>
                <Button
                  variant="ghost"
                  className="justify-start"
                  onClick={() => goTo({ name: "courses" })}
                >
                  <BookOpen className="mr-2 h-4 w-4" /> All courses
                </Button>
                {user && (user.role === "instructor" || user.role === "admin") && (
                  <Button
                    variant="ghost"
                    className="justify-start"
                    onClick={() => goTo({ name: "teach" })}
                  >
                    <Sparkles className="mr-2 h-4 w-4" /> Teach
                  </Button>
                )}
                {user && user.role === "admin" && (
                  <Button
                    variant="ghost"
                    className="justify-start"
                    onClick={() => goTo({ name: "admin" })}
                  >
                    <LayoutDashboard className="mr-2 h-4 w-4" /> Admin
                  </Button>
                )}
                {user ? (
                  <>
                    <Button
                      variant="ghost"
                      className="justify-start"
                      onClick={() => goTo({ name: "profile" })}
                    >
                      <User className="mr-2 h-4 w-4" /> Profile
                    </Button>
                    <Button
                      variant="ghost"
                      className="justify-start text-destructive"
                      onClick={handleLogout}
                    >
                      <LogOut className="mr-2 h-4 w-4" /> Log out
                    </Button>
                  </>
                ) : (
                  <div className="flex flex-col gap-2 pt-2">
                    <Button onClick={() => goTo({ name: "login" })}>
                      Log in
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => goTo({ name: "signup" })}
                    >
                      Sign up
                    </Button>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
