"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  BookOpen,
  Clock3,
  FileText,
  Plus,
  Sparkles,
  Users,
} from "lucide-react";
import { PageIntro } from "@/components/layout/PageIntro";
import { useAuthStore } from "@/stores/useAuthStore";

const quickLinks = [
  {
    title: "Assignments",
    description: "Create and manage AI-generated question papers.",
    href: "/assignments",
    icon: FileText,
  },
  {
    title: "My Groups",
    description: "View classes and student groups.",
    href: "/groups",
    icon: Users,
  },
  {
    title: "AI Teacher's Toolkit",
    description: "Lesson plans, rubrics, and AI teaching tools.",
    href: "/toolkit",
    icon: BookOpen,
  },
  {
    title: "My Library",
    description: "Saved papers, templates, and past assignments.",
    href: "/library",
    icon: Clock3,
  },
];

type RubricSummary = {
  _id: string;
  title: string;
  subject: string;
  totalPoints: number;
  criteria?: { name: string }[];
};

export default function HomePage() {
  const user = useAuthStore((state) => state.user);
  const [rubrics, setRubrics] = useState<RubricSummary[]>([]);
  const [rubricsLoading, setRubricsLoading] = useState(true);
  const firstName = user?.name?.split(" ")[0] || "Teacher";
  const schoolLine = user?.school
    ? `${user.school.name}${user.school.location ? `, ${user.school.location}` : ""}`
    : "Your school";

  useEffect(() => {
    const loadRubrics = async () => {
      try {
        const response = await fetch("/api/rubrics");
        if (!response.ok) return;
        const data = await response.json();
        setRubrics(data.rubrics || []);
      } finally {
        setRubricsLoading(false);
      }
    };
    loadRubrics();
  }, []);

  const visibleRubrics = rubrics.slice(0, 3);

  return (
    <section className="mx-auto max-w-6xl">
      <PageIntro
        title="Home"
        description="Welcome back. Pick a workspace to continue."
      />

      <div className="mb-8 rounded-lg border border-white/80 bg-white/70 p-6 shadow-sm sm:p-8">
        <h2 className="text-xl font-black text-zinc-900">
          Good morning, {firstName}
        </h2>
        <p className="mt-2 max-w-2xl text-sm font-medium leading-7 text-zinc-500">
          {schoolLine} — use Assignments to generate structured exam papers with
          sections, difficulty tags, and answer keys.
        </p>
        <Link
          href="/assignments/create"
          className="mt-6 inline-flex h-12 items-center gap-2 rounded-full bg-zinc-950 px-6 text-sm font-bold text-white transition hover:bg-zinc-800"
        >
          <Plus className="h-5 w-5" />
          Create Assignment
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {quickLinks.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="group rounded-lg border border-white/80 bg-white/90 p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-zinc-500/10"
          >
            <span className="grid h-12 w-12 place-items-center rounded-full bg-zinc-100 text-zinc-800 transition group-hover:bg-orange-100 group-hover:text-orange-600">
              <item.icon className="h-6 w-6" />
            </span>
            <h3 className="mt-4 text-lg font-black text-zinc-900">{item.title}</h3>
            <p className="mt-2 text-sm font-medium leading-6 text-zinc-500">
              {item.description}
            </p>
          </Link>
        ))}
      </div>

      <div className="mt-8 rounded-lg border border-white/80 bg-white/90 p-6 shadow-sm">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-black text-zinc-900">Saved Rubrics</h2>
            <p className="mt-1 text-sm font-medium text-zinc-500">
              Your latest grading rubrics for quick reuse.
            </p>
          </div>
          <Link
            href="/toolkit/rubric"
            className="inline-flex h-10 items-center justify-center rounded-full border border-zinc-200 px-4 text-sm font-bold text-zinc-700 transition hover:bg-zinc-50"
          >
            Open Rubric Builder
          </Link>
        </div>

        {rubricsLoading ? (
          <p className="py-6 text-sm font-semibold text-zinc-500">Loading rubrics...</p>
        ) : visibleRubrics.length === 0 ? (
          <p className="py-6 text-sm font-semibold text-zinc-500">
            No rubrics saved yet. Create one in the toolkit.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {visibleRubrics.map((rubric) => (
              <div
                key={rubric._id}
                className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-base font-black text-zinc-900">
                    {rubric.title}
                  </h3>
                  <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-bold text-orange-600">
                    {rubric.subject}
                  </span>
                </div>
                <p className="mt-2 text-sm font-medium text-zinc-600">
                  Criteria: {rubric.criteria?.length || 0} | Points: {rubric.totalPoints}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-6 flex items-center gap-2 rounded-lg bg-zinc-950 px-5 py-4 text-sm font-semibold text-white">
        <Sparkles className="h-5 w-5 text-orange-300" />
        AI grading and rubric tools are available in the toolkit.
      </div>
    </section>
  );
}
