import Link from "next/link";
import { ArrowRight, Home, Plus } from "lucide-react";

export default function NotFound() {
  return (
    <section className="mx-auto flex min-h-[calc(100vh-12rem)] max-w-3xl flex-col items-center justify-center text-center">
      <p className="text-sm font-black uppercase tracking-wide text-orange-600">
        404
      </p>
      <h1 className="mt-3 text-4xl font-black tracking-tight text-zinc-900">
        This VedaAI page is not a route
      </h1>
      <p className="mt-4 max-w-xl text-base leading-7 text-zinc-500">
        Use the app routes below. If you reached this from localhost, the server
        is running but the URL path is wrong.
      </p>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link
          href="/"
          className="inline-flex h-12 items-center gap-2 rounded-full bg-white px-6 text-sm font-bold text-zinc-900 shadow-sm transition hover:bg-zinc-50"
        >
          <Home className="h-4 w-4" />
          Home
        </Link>
        <Link
          href="/assignments"
          className="inline-flex h-12 items-center gap-2 rounded-full bg-zinc-950 px-6 text-sm font-bold text-white transition hover:bg-zinc-800"
        >
          Assignments
        </Link>
        <Link
          href="/groups"
          className="inline-flex h-12 items-center gap-2 rounded-full bg-white px-6 text-sm font-bold text-zinc-900 shadow-sm transition hover:bg-zinc-50"
        >
          Groups
        </Link>
        <Link
          href="/toolkit"
          className="inline-flex h-12 items-center gap-2 rounded-full bg-white px-6 text-sm font-bold text-zinc-900 shadow-sm transition hover:bg-zinc-50"
        >
          Toolkit
        </Link>
        <Link
          href="/library"
          className="inline-flex h-12 items-center gap-2 rounded-full bg-white px-6 text-sm font-bold text-zinc-900 shadow-sm transition hover:bg-zinc-50"
        >
          Library
        </Link>
        <Link
          href="/settings"
          className="inline-flex h-12 items-center gap-2 rounded-full bg-white px-6 text-sm font-bold text-zinc-900 shadow-sm transition hover:bg-zinc-50"
        >
          Settings
        </Link>
        <Link
          href="/assignments/create"
          className="inline-flex h-12 items-center gap-2 rounded-full bg-white px-6 text-sm font-bold text-zinc-900 shadow-sm transition hover:bg-zinc-50"
        >
          <Plus className="h-4 w-4" />
          Create
        </Link>
      </div>
    </section>
  );
}
