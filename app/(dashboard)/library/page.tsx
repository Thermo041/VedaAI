"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { Clock3, FileText } from "lucide-react";
import { PageIntro } from "@/components/layout/PageIntro";
import { Assignment } from "@/types";
import { useAssignmentStore } from "@/stores/useAssignmentStore";

export default function LibraryPage() {
  const items = useAssignmentStore((state) => state.assignments);
  const setAssignments = useAssignmentStore((state) => state.setAssignments);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch("/api/assignments");
        if (!response.ok) return;
        const data = await response.json();
        setAssignments(
          (data.assignments || []).map((assignment: Assignment) => ({
            ...assignment,
            dueDate: new Date(assignment.dueDate),
            createdAt: new Date(assignment.createdAt),
            updatedAt: new Date(assignment.updatedAt),
          }))
        );
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [setAssignments]);

  return (
    <section className="mx-auto max-w-6xl">
      <PageIntro
        title="My Library"
        description="Saved assignments and generated papers from your account."
      />

      {loading ? (
        <p className="py-16 text-center text-sm font-semibold text-zinc-500">
          Loading library...
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <Link
              key={item._id}
              href={`/assignments/output?id=${item._id}`}
              className="rounded-lg border border-white/80 bg-white/90 p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              <div className="flex items-center justify-between">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-zinc-100 text-zinc-700">
                  <FileText className="h-5 w-5" />
                </span>
                <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-bold capitalize text-zinc-600">
                  {item.status}
                </span>
              </div>
              <h2 className="mt-4 text-lg font-black text-zinc-900">{item.title}</h2>
              <p className="mt-2 flex items-center gap-2 text-sm font-medium text-zinc-500">
                <Clock3 className="h-4 w-4" />
                {format(new Date(item.createdAt), "dd MMM yyyy")}
              </p>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
