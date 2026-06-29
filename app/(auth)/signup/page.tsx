"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/stores/useAuthStore";

export default function SignupPage() {
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    schoolName: "",
    schoolLocation: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Signup failed");
      }

      setUser(data.user);
      router.push("/assignments");
      router.refresh();
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "Signup failed"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-6 py-10">
      <div className="mb-8 text-center">
        <div className="relative mx-auto mb-4 h-16 w-16 overflow-hidden rounded-2xl bg-zinc-950 shadow-lg shadow-black/10">
          <img src="/logo.png" alt="VedamAI" className="h-full w-full object-cover" />
        </div>
        <h1 className="text-3xl font-black text-zinc-900">Create teacher account</h1>
        <p className="mt-2 text-sm font-medium text-zinc-500">
          Join VedamAI to generate structured question papers
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-lg border border-white/80 bg-white/90 p-6 shadow-xl shadow-zinc-500/10"
      >
        <div className="space-y-4">
          <label className="block text-sm font-black text-zinc-900">
            Full name
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="mt-2 h-12 rounded-full"
              required
            />
          </label>
          <label className="block text-sm font-black text-zinc-900">
            Email
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="mt-2 h-12 rounded-full"
              required
            />
          </label>
          <label className="block text-sm font-black text-zinc-900">
            Password
            <Input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="mt-2 h-12 rounded-full"
              minLength={8}
              required
            />
          </label>
          <label className="block text-sm font-black text-zinc-900">
            School name
            <Input
              value={form.schoolName}
              onChange={(e) => setForm({ ...form, schoolName: e.target.value })}
              className="mt-2 h-12 rounded-full"
              required
            />
          </label>
          <label className="block text-sm font-black text-zinc-900">
            School location
            <Input
              value={form.schoolLocation}
              onChange={(e) =>
                setForm({ ...form, schoolLocation: e.target.value })
              }
              className="mt-2 h-12 rounded-full"
              required
            />
          </label>
        </div>

        {error && (
          <p className="mt-4 rounded-md bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-6 h-12 w-full rounded-full bg-zinc-950 text-sm font-bold text-white transition hover:bg-zinc-800 disabled:opacity-60"
        >
          {loading ? "Creating account..." : "Sign Up"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm font-medium text-zinc-600">
        Already have an account?{" "}
        <Link href="/login" className="font-bold text-orange-600 hover:underline">
          Sign in
        </Link>
      </p>
    </section>
  );
}
