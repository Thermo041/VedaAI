"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Filter, Plus, Search, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { AssignmentCard } from "@/components/assignment/AssignmentCard";
import { EmptyState } from "@/components/assignment/EmptyState";
import { useAssignmentStore } from "@/stores/useAssignmentStore";
import { Assignment } from "@/types";

export default function AssignmentsPage() {
  const storedAssignments = useAssignmentStore((state) => state.assignments);
  const setAssignments = useAssignmentStore((state) => state.setAssignments);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAssignments = async () => {
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
    loadAssignments();
  }, [setAssignments]);

  const assignments = storedAssignments;
  const filteredAssignments = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return assignments;
    return assignments.filter((assignment) =>
      assignment.title.toLowerCase().includes(query)
    );
  }, [assignments, searchQuery]);

  if (!loading && assignments.length === 0) {
    return <EmptyState />;
  }

  return (
    <section className="mx-auto max-w-7xl">
      <div className="mb-5 hidden lg:block">
        <div className="mb-2 flex items-center gap-3">
          <span className="grid h-5 w-5 place-items-center rounded-full bg-emerald-100">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
          </span>
          <h1 className="text-2xl font-black tracking-tight text-zinc-900">
            Assignments
          </h1>
        </div>
        <p className="pl-8 text-sm font-medium text-zinc-500">
          Manage and create assignments for your classes.
        </p>
      </div>

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center rounded-lg bg-white/80 p-3 shadow-sm lg:h-16 lg:px-5">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400" />
          <Input
            placeholder="Search Assignment"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-12 rounded-full border-zinc-300 bg-white pl-12 pr-4 text-base shadow-none"
          />
        </div>
      </div>

      {loading ? (
        <p className="py-20 text-center text-sm font-semibold text-zinc-500">
          Loading assignments...
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:gap-5">
          {filteredAssignments.map((assignment) => (
            <AssignmentCard key={assignment._id} assignment={assignment} />
          ))}
        </div>
      )}

      {filteredAssignments.length === 0 && !loading && (
        <div className="rounded-lg bg-white/75 py-16 text-center">
          <p className="text-lg font-black text-zinc-900">No matching assignments</p>
        </div>
      )}

      <div className="sticky bottom-6 mt-8 hidden justify-center lg:flex">
        <Link
          href="/assignments/create"
          className="inline-flex h-12 items-center gap-2 rounded-full bg-zinc-950 px-7 text-sm font-bold text-white shadow-2xl shadow-black/20 transition hover:-translate-y-0.5 hover:bg-zinc-800"
        >
          <Plus className="h-5 w-5" />
          Create Assignment
        </Link>
      </div>
    </section>
  );
}
