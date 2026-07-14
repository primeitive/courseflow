"use client";

import * as React from "react";
import { useRouterStore } from "@/store/router";
import { useAuthStore } from "@/store/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  User,
  Mail,
  Save,
  LogOut,
  Loader2,
  Shield,
  Sparkles,
  GraduationCap,
  Upload,
} from "lucide-react";
import { getInitials } from "@/lib/format";
import { toast } from "sonner";

export function ProfileView() {
  const navigate = useRouterStore((s) => s.navigate);
  const user = useAuthStore((s) => s.user);
  const fetchAuth = useAuthStore((s) => s.fetch);
  const logout = useAuthStore((s) => s.logout);

  const [fullName, setFullName] = React.useState(user?.fullName ?? "");
  const [avatarUrl, setAvatarUrl] = React.useState(user?.avatarUrl ?? "");
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (user) {
      setFullName(user.fullName);
      setAvatarUrl(user.avatarUrl ?? "");
    }
  }, [user]);

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <p className="text-sm text-muted-foreground">
          Please sign in to view your profile.
        </p>
        <Button className="mt-4" onClick={() => navigate({ name: "login" })}>
          Sign in
        </Button>
      </div>
    );
  }

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (fullName.trim().length < 2) {
      toast.error("Full name must be at least 2 characters");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, avatarUrl: avatarUrl || null }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Failed to save");
      await fetchAuth();
      toast.success("Profile saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const onLogout = async () => {
    await logout();
    navigate({ name: "home" });
  };

  const roleIcon =
    user.role === "admin"
      ? Shield
      : user.role === "instructor"
      ? Sparkles
      : GraduationCap;
  const RoleIcon = roleIcon;

  const generateAvatar = () => {
    const seed = fullName || user.email;
    const url = `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(
      seed
    )}&backgroundColor=0f766e,155e50,134e4a,047857,065f46&textColor=ffffff`;
    setAvatarUrl(url);
    toast.success("Avatar generated");
  };

  return (
    <div className="animate-fade-in mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="mb-1 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
        Profile
      </h1>
      <p className="mb-8 text-sm text-muted-foreground">
        Manage your personal info and account settings.
      </p>

      <div className="grid gap-6">
        {/* Avatar + role */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Account</CardTitle>
            <CardDescription>
              Your identity across Courseflow.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
              <Avatar className="h-20 w-20 border border-border">
                {avatarUrl && <AvatarImage src={avatarUrl} alt={fullName} />}
                <AvatarFallback className="bg-primary/10 text-primary text-xl font-semibold">
                  {getInitials(fullName || user.email)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-base font-semibold text-foreground">
                    {user.fullName}
                  </p>
                  <Badge variant="secondary" className="gap-1">
                    <RoleIcon className="h-3 w-3" />
                    <span className="capitalize">{user.role}</span>
                  </Badge>
                </div>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {user.email}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Edit form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Edit profile</CardTitle>
            <CardDescription>
              Update your name and avatar. Email cannot be changed.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSave} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="fullName">Full name</Label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="h-10 pl-9"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    value={user.email}
                    disabled
                    className="h-10 pl-9 bg-muted/40 cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="avatarUrl">Avatar URL</Label>
                <div className="flex gap-2">
                  <Input
                    id="avatarUrl"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    placeholder="https://…"
                    className="h-10"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={generateAvatar}
                    title="Generate an avatar from your initials"
                  >
                    <Upload className="mr-1.5 h-3.5 w-3.5" />
                    Generate
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Paste an image URL or click Generate for an auto-avatar.
                </p>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <Button type="submit" disabled={saving}>
                  {saving ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Save changes
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Danger zone */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Session</CardTitle>
            <CardDescription>
              Sign out of your account on this device.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Separator className="mb-4" />
            <Button
              variant="outline"
              onClick={onLogout}
              className="text-destructive hover:text-destructive"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
