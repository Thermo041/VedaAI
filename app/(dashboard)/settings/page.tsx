"use client";

import { useRouter } from "next/navigation";
import { PageIntro } from "@/components/layout/PageIntro";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/stores/useAuthStore";

export default function SettingsPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    logout();
    window.location.href = "/login";
  };

  return (
    <section className="mx-auto max-w-3xl">
      <PageIntro
        title="Settings"
        description="Manage your teacher profile and preferences."
      />

      <div className="space-y-6 rounded-lg border border-white/80 bg-white/90 p-6 shadow-sm sm:p-8">
        <div>
          <h2 className="text-lg font-black text-zinc-900">Profile</h2>
          <p className="mt-1 text-sm font-medium text-zinc-500">
            Signed in teacher account
          </p>
        </div>

        <div className="space-y-4">
          <label className="block text-sm font-black text-zinc-900">
            Full name
            <Input
              value={user?.name || ""}
              readOnly
              className="mt-2 h-12 rounded-full border-zinc-300 bg-zinc-50"
            />
          </label>
          <label className="block text-sm font-black text-zinc-900">
            Email
            <Input
              value={user?.email || ""}
              readOnly
              type="email"
              className="mt-2 h-12 rounded-full border-zinc-300 bg-zinc-50"
            />
          </label>
          <label className="block text-sm font-black text-zinc-900">
            School
            <Input
              value={
                user?.school
                  ? `${user.school.name}, ${user.school.location}`
                  : ""
              }
              readOnly
              className="mt-2 h-12 rounded-full border-zinc-300 bg-zinc-50"
            />
          </label>
        </div>

        <div className="border-t border-zinc-200 pt-6">
          <h2 className="text-lg font-black text-zinc-900">Session</h2>
          <button
            type="button"
            onClick={handleLogout}
            className="mt-4 inline-flex h-11 items-center rounded-full bg-rose-600 px-6 text-sm font-bold text-white transition hover:bg-rose-700"
          >
            Sign Out
          </button>
        </div>
      </div>
    </section>
  );
}
