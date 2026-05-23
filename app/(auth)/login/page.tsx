"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/stores/useAuthStore";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setUser = useAuthStore((state) => state.setUser);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Sign in failed");
      }

      setUser(data.user);
      const from = searchParams.get("from") || "/assignments";
      router.push(from);
      router.refresh();
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "Sign in failed"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
      <div className="mb-8 text-center">
        <div className="relative mx-auto mb-4 h-16 w-16 overflow-hidden rounded-2xl bg-zinc-950 shadow-lg shadow-black/10">
          <img src="/logo.png" alt="VedaAI" className="h-full w-full object-cover" />
        </div>
        <h1 className="text-3xl font-black text-zinc-900">Welcome back</h1>
        <p className="mt-2 text-sm font-medium text-zinc-500">
          Sign in to create AI assessment papers
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-lg border border-white/80 bg-white/90 p-6 shadow-xl shadow-zinc-500/10"
      >
        <label className="mb-4 block text-sm font-black text-zinc-900">
          Email
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-2 h-12 rounded-full"
            required
          />
        </label>
        <label className="mb-6 block text-sm font-black text-zinc-900">
          Password
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-2 h-12 rounded-full"
            required
          />
        </label>

        {error && (
          <p className="mb-4 rounded-md bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="h-12 w-full rounded-full bg-zinc-950 text-sm font-bold text-white transition hover:bg-zinc-800 disabled:opacity-60"
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm font-medium text-zinc-600">
        New teacher?{" "}
        <Link href="/signup" className="font-bold text-orange-600 hover:underline">
          Create an account
        </Link>
      </p>
    </section>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
