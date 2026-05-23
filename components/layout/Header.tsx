"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  Bell,
  ChevronDown,
  FileText,
  LayoutGrid,
  Library,
  Menu,
  Plus,
  Sparkles,
  ArrowLeft,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/useAuthStore";
import { useNotificationStore } from "@/stores/useNotificationStore";
import { formatDistanceToNow } from "date-fns";

const mobileTabs = [
  { name: "Home", href: "/", icon: LayoutGrid },
  { name: "Assignments", href: "/assignments", icon: FileText },
  { name: "Library", href: "/library", icon: Library },
  { name: "AI Toolkit", href: "/toolkit", icon: Sparkles },
];

function routeLabel(pathname: string) {
  if (pathname === "/") return "Home";
  if (pathname.includes("/assignments/create")) return "Create Assignment";
  if (pathname.includes("/assignments/output")) return "Question Paper";
  if (pathname.includes("/assignments")) return "Assignment";
  if (pathname.includes("/groups")) return "My Groups";
  if (pathname.includes("/toolkit")) return "AI Teacher's Toolkit";
  if (pathname.includes("/library")) return "My Library";
  if (pathname.includes("/settings")) return "Settings";
  return "VedaAI";
}

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function Header({ title }: { title?: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const notifications = useNotificationStore((state) => state.notifications);
  const markAsRead = useNotificationStore((state) => state.markAsRead);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const label = title ?? routeLabel(pathname);
  const showBack = pathname !== "/";
  const displayName = user?.name || "Teacher";
  const avatar = initials(displayName);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    setShowMobileMenu(false);

    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      logout();
      router.push("/login");
      router.refresh();
      setIsLoggingOut(false);
    }
  };

  return (
    <>
      <header className="no-print sticky top-0 z-50 bg-white/95 backdrop-blur-xl border-b border-zinc-200 lg:relative lg:bg-transparent lg:border-none lg:px-6 lg:pt-4">
        <div className="hidden h-14 items-center justify-between rounded-lg border border-white/75 bg-white/90 px-5 shadow-sm backdrop-blur-xl lg:flex">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="grid h-9 w-9 place-items-center rounded-full text-zinc-700 transition hover:bg-zinc-100"
              aria-label="Go back"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2 text-sm font-medium text-zinc-400">
              <LayoutGrid className="h-4 w-4" />
              {label}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative grid h-10 w-10 place-items-center rounded-full text-zinc-800 transition hover:bg-zinc-100"
                aria-label="Notifications"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-orange-500 ring-2 ring-white" />
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 top-12 z-50 w-80 rounded-lg border border-zinc-200 bg-white shadow-xl">
                  <div className="flex items-center justify-between border-b border-zinc-200 p-4">
                    <h3 className="text-sm font-bold text-zinc-900">Notifications</h3>
                    <button
                      onClick={() => setShowNotifications(false)}
                      className="grid h-6 w-6 place-items-center rounded-full hover:bg-zinc-100"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="p-4 text-center text-sm text-zinc-500">No notifications</p>
                    ) : (
                      notifications.map((notif) => (
                        <div
                          key={notif.id}
                          onClick={() => markAsRead(notif.id)}
                          className={cn(
                            "border-b border-zinc-100 p-4 hover:bg-zinc-50 cursor-pointer",
                            !notif.read && "bg-orange-50/50"
                          )}
                        >
                          <p className="text-sm font-medium text-zinc-900">{notif.message}</p>
                          <p className="mt-1 text-xs text-zinc-500">
                            {formatDistanceToNow(notif.createdAt, { addSuffix: true })}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            <Link
              href="/settings"
              className="flex items-center gap-3 rounded-full py-1.5 pl-1.5 pr-2 transition hover:bg-zinc-100"
            >
              <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-orange-100 to-zinc-200 text-sm font-black text-zinc-800">
                {avatar}
              </span>
              <span className="text-sm font-bold text-zinc-900">{displayName}</span>
              <ChevronDown className="h-4 w-4 text-zinc-500" />
            </Link>
          </div>
        </div>

        <div className="flex h-16 items-center justify-between px-4 lg:hidden">
          <Link href="/" className="flex items-center gap-2">
            <div className="relative h-8 w-8 overflow-hidden rounded-md bg-zinc-950">
              <img src="/logo.png" alt="VedaAI" className="h-full w-full object-cover" />
            </div>
            <span className="text-xl font-black tracking-tight">VedaAI</span>
          </Link>
          <div className="flex items-center gap-2">
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  if (!showNotifications) setShowMobileMenu(false);
                }}
                className="relative grid h-9 w-9 place-items-center rounded-full bg-zinc-100 text-zinc-900"
                aria-label="Notifications"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-orange-500 ring-2 ring-white" />
                )}
              </button>

              {showNotifications && (
                <div className="fixed left-4 right-4 top-16 z-50 rounded-lg border border-zinc-200 bg-white shadow-xl sm:absolute sm:left-auto sm:right-0 sm:top-12 sm:w-80">
                  <div className="flex items-center justify-between border-b border-zinc-200 p-4">
                    <h3 className="text-sm font-bold text-zinc-900">Notifications</h3>
                    <button
                      onClick={() => setShowNotifications(false)}
                      className="grid h-6 w-6 place-items-center rounded-full hover:bg-zinc-100"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="p-4 text-center text-sm text-zinc-500">No notifications</p>
                    ) : (
                      notifications.map((notif) => (
                        <div
                          key={notif.id}
                          onClick={() => {
                            markAsRead(notif.id);
                            setShowNotifications(false);
                          }}
                          className={cn(
                            "border-b border-zinc-100 p-4 hover:bg-zinc-50 cursor-pointer",
                            !notif.read && "bg-orange-50/50"
                          )}
                        >
                          <p className="text-sm font-medium text-zinc-900">{notif.message}</p>
                          <p className="mt-1 text-xs text-zinc-500">
                            {formatDistanceToNow(notif.createdAt, { addSuffix: true })}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            <Link
              href="/settings"
              className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-orange-100 to-zinc-200 text-xs font-black"
            >
              {avatar}
            </Link>
            <button
              type="button"
              onClick={() => {
                setShowMobileMenu(!showMobileMenu);
                if (!showMobileMenu) setShowNotifications(false);
              }}
              className="grid h-9 w-9 place-items-center rounded-full text-zinc-900"
              aria-label="Open menu"
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="flex items-center justify-center pb-3 lg:hidden">
          {showBack && (
            <button
              type="button"
              onClick={() => router.back()}
              className="absolute left-4 grid h-8 w-8 place-items-center rounded-full bg-zinc-100 text-zinc-800 shadow-sm"
              aria-label="Go back"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
          )}
          <div className="text-sm font-black text-zinc-900">{label}</div>
        </div>
      </header>

      <Link
        href="/assignments/create"
        className="no-print fixed bottom-24 right-5 z-30 grid h-14 w-14 place-items-center rounded-full bg-orange-500 text-white shadow-2xl shadow-orange-500/40 lg:hidden"
        aria-label="Create assignment"
      >
        <Plus className="h-6 w-6" />
      </Link>

      <nav className="no-print fixed bottom-0 left-0 right-0 z-30 grid h-[4.5rem] grid-cols-5 border-t border-zinc-800 bg-zinc-950 px-2 pb-safe shadow-2xl lg:hidden">
        {mobileTabs.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href + "/"));
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 rounded-md text-xs font-semibold transition",
                isActive ? "text-white" : "text-zinc-500 hover:text-zinc-200"
              )}
            >
              <item.icon className="h-6 w-6" />
              {item.name}
            </Link>
          );
        })}
        <Link
          href="/groups"
          className={cn(
            "flex flex-col items-center justify-center gap-1 rounded-md text-xs font-semibold transition",
            pathname.includes("/groups") ? "text-white" : "text-zinc-500 hover:text-zinc-200"
          )}
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          Groups
        </Link>
      </nav>

      {showMobileMenu && (
        <div className="fixed inset-0 z-[60] bg-black/50 lg:hidden" onClick={() => setShowMobileMenu(false)}>
          <div className="absolute left-4 right-4 top-20 w-auto rounded-lg border border-zinc-200 bg-white shadow-xl sm:left-auto sm:w-64" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-zinc-200 p-4">
              <div className="flex items-center gap-3">
                <span className="grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-orange-100 to-zinc-200 text-sm font-black">
                  {avatar}
                </span>
                <div>
                  <p className="text-sm font-bold text-zinc-900">{displayName}</p>
                  <p className="text-xs text-zinc-500">{user?.school?.name || "Teacher"}</p>
                </div>
              </div>
              <button
                onClick={() => setShowMobileMenu(false)}
                className="grid h-8 w-8 place-items-center rounded-full text-zinc-500 hover:bg-zinc-100 transition"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-2">
              <Link
                href="/settings"
                onClick={() => setShowMobileMenu(false)}
                className="flex items-center gap-3 rounded-md px-4 py-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Settings
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="flex w-full items-center gap-3 rounded-md px-4 py-3 text-left text-sm font-medium text-rose-600 hover:bg-rose-50"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                {isLoggingOut ? "Logging out..." : "Logout"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
