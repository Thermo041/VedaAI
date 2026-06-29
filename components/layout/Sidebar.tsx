"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  BookOpen,
  Clock3,
  FileText,
  LayoutGrid,
  Settings,
  Sparkles,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/useAuthStore";
import { useAssignmentStore } from "@/stores/useAssignmentStore";

const navigation = [
  { name: "Home", href: "/", icon: LayoutGrid },
  { name: "My Groups", href: "/groups", icon: Users },
  { name: "Assignments", href: "/assignments", icon: FileText },
  { name: "AI Teacher's Toolkit", href: "/toolkit", icon: BookOpen },
  { name: "My Library", href: "/library", icon: Clock3 },
];

export function Sidebar() {
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const assignments = useAssignmentStore((state) => state.assignments);
  const [counts, setCounts] = useState({ assignments: 0, library: 0 });

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch("/api/assignments");
        if (!response.ok) return;
        const data = await response.json();
        const total = data.assignments?.length || 0;
        setCounts({ assignments: total, library: total });
      } catch {
        // ignore
      }
    };
    load();
  }, [assignments]);

  const schoolName = user?.school?.name || "Your School";
  const schoolLocation = user?.school?.location || "";

  return (
    <aside className="no-print fixed left-4 top-4 z-30 hidden h-[calc(100vh-2rem)] w-72 flex-col rounded-lg border border-white/70 bg-white/90 p-5 shadow-2xl shadow-black/10 backdrop-blur-xl lg:flex">
      <Link href="/" className="flex items-center gap-3">
        <div className="relative h-11 w-11 overflow-hidden rounded-lg bg-zinc-950 shadow-lg shadow-black/20">
          <img src="/logo.png" alt="VedamAI" className="h-full w-full object-cover" />
        </div>
        <span className="text-3xl font-black tracking-tight text-zinc-900">VedamAI</span>
      </Link>

      <Link
        href="/assignments/create"
        className="mt-12 inline-flex h-12 items-center justify-center gap-3 rounded-full bg-zinc-950 px-5 text-sm font-semibold text-white shadow-[0_0_0_4px_rgba(255,98,55,0.74)] transition hover:-translate-y-0.5 hover:bg-zinc-800"
      >
        <Sparkles className="h-5 w-5" />
        Create Assignment
      </Link>

      <nav className="mt-14 flex-1 space-y-2">
        {navigation.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href + "/"));
          const badge =
            item.name === "Assignments"
              ? counts.assignments
              : item.name === "My Library"
                ? counts.library
                : 0;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex h-11 items-center gap-3 rounded-md px-4 text-base font-medium transition",
                isActive
                  ? "bg-zinc-100 text-zinc-950"
                  : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-950"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="min-w-0 flex-1 truncate">{item.name}</span>
              {badge > 0 && (
                <span className="rounded-full bg-orange-500 px-2.5 py-0.5 text-xs font-bold text-white">
                  {badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="space-y-4">
        <Link
          href="/settings"
          className="flex h-11 items-center gap-3 rounded-md px-4 text-base font-medium text-zinc-500 transition hover:bg-zinc-50 hover:text-zinc-950"
        >
          <Settings className="h-5 w-5" />
          Settings
        </Link>

        <div className="flex items-center gap-3 rounded-lg bg-zinc-100 p-3">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-white shadow-sm">
            <span className="text-sm font-black text-orange-600">
              {schoolName.slice(0, 3).toUpperCase()}
            </span>
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-zinc-900">{schoolName}</p>
            <p className="truncate text-xs font-medium text-zinc-500">
              {schoolLocation}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
