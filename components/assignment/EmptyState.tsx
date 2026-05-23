import Link from "next/link";
import { FileText, Plus, Search, Sparkles } from "lucide-react";

export function EmptyState() {
  return (
    <section className="flex min-h-[calc(100vh-13rem)] flex-col items-center justify-center px-2 text-center lg:min-h-[calc(100vh-7rem)]">
      <div className="relative mb-8 h-56 w-56 sm:h-64 sm:w-64">
        <div className="absolute inset-6 rounded-full bg-white/70 shadow-inner" />
        <div className="absolute left-1/2 top-10 h-32 w-28 -translate-x-1/2 rounded-lg bg-white shadow-xl shadow-zinc-400/20">
          <div className="mx-auto mt-6 h-3 w-14 rounded-full bg-slate-950" />
          <div className="mx-auto mt-6 h-3 w-20 rounded-full bg-zinc-300" />
          <div className="mx-auto mt-3 h-3 w-20 rounded-full bg-zinc-300" />
          <div className="mx-auto mt-3 h-3 w-16 rounded-full bg-zinc-300" />
        </div>
        <div className="absolute bottom-8 right-8 grid h-28 w-28 place-items-center rounded-full border-[10px] border-violet-200/80 bg-white/80 shadow-2xl shadow-zinc-400/30 backdrop-blur">
          <span className="text-6xl font-black leading-none text-rose-500">x</span>
        </div>
        <div className="absolute bottom-5 right-2 h-14 w-4 -rotate-45 rounded-full bg-violet-200" />
        <div className="absolute right-6 top-8 flex h-9 w-20 items-center gap-2 rounded-md bg-white p-2 shadow-lg">
          <span className="h-3 w-3 rounded-full bg-violet-200" />
          <span className="h-3 flex-1 rounded-full bg-zinc-300" />
        </div>
        <Search className="absolute left-7 top-20 h-10 w-10 rotate-12 text-slate-950" />
        <Sparkles className="absolute bottom-14 left-8 h-7 w-7 text-blue-500" />
        <span className="absolute right-1 top-32 h-3 w-3 rounded-full bg-sky-600" />
      </div>

      <h2 className="mb-3 text-2xl font-black text-zinc-900 sm:text-3xl">
        No assignments yet
      </h2>
      <p className="mb-8 max-w-xl text-base leading-7 text-zinc-500 sm:text-lg">
        Create your first assignment to start collecting and grading student submissions. 
        You can set up rubrics, define marking criteria, and let AI assist with grading.
      </p>

      <Link
        href="/assignments/create"
        className="inline-flex h-14 items-center justify-center gap-2 rounded-full bg-zinc-950 px-8 text-base font-bold text-white transition hover:bg-zinc-800"
      >
        <Plus className="h-5 w-5" />
        Create Your First Assignment
      </Link>

      <div className="mt-10 hidden items-center gap-3 rounded-full bg-white/60 px-4 py-2 text-sm font-medium text-zinc-500 shadow-sm lg:flex">
        <FileText className="h-4 w-4" />
        Structured AI papers, answer keys, and PDF export stay in one flow.
      </div>
    </section>
  );
}
