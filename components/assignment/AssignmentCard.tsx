"use client";

import { Assignment } from "@/types";
import { MoreVertical, Trash2, Eye, Clock3 } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useAssignmentStore } from "@/stores/useAssignmentStore";
import { cn } from "@/lib/utils";

export function AssignmentCard({ assignment }: { assignment: Assignment }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const actionsRef = useRef<HTMLDivElement | null>(null);
  const deleteAssignment = useAssignmentStore((state) => state.deleteAssignment);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      if (!actionsRef.current) return;
      if (!actionsRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
    };
  }, []);

  const handleDelete = async () => {
    setIsMenuOpen(false);
    if (!confirm(`Delete "${assignment.title}"? This cannot be undone.`)) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/assignments/${assignment._id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete");
      }

      deleteAssignment(assignment._id);
    } catch {
      alert("Failed to delete assignment. Please try again.");
      setIsDeleting(false);
    }
  };

  return (
    <article className="group relative min-h-40 rounded-lg border border-white/70 bg-white/90 p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-zinc-500/10">
      <div className="flex items-start justify-between gap-4">
        <Link
          href={`/assignments/output?id=${assignment._id}`}
          className="text-2xl font-black leading-tight text-zinc-900 underline-offset-4 hover:underline"
        >
          {assignment.title}
        </Link>
        <div ref={actionsRef} className="relative shrink-0">
          <button
            type="button"
            onClick={() => setIsMenuOpen((value) => !value)}
            className="grid h-9 w-9 place-items-center rounded-full text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-900"
            aria-label={`Open actions for ${assignment.title}`}
            aria-haspopup="menu"
            aria-expanded={isMenuOpen}
          >
            <MoreVertical className="h-5 w-5" />
          </button>

          <div
            className={cn(
              "absolute right-0 top-10 z-20 w-40 rounded-lg bg-white p-2 text-sm font-semibold shadow-2xl shadow-zinc-500/20 ring-1 ring-zinc-100 transition",
              "pointer-events-none invisible opacity-0",
              isMenuOpen && "pointer-events-auto visible opacity-100"
            )}
          >
            <Link
              href={`/assignments/output?id=${assignment._id}`}
              onClick={() => setIsMenuOpen(false)}
              className="flex items-center gap-2 rounded-md px-3 py-2 text-zinc-800 hover:bg-zinc-50"
            >
              <Eye className="h-4 w-4" />
              View Assignment
            </Link>
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-rose-600 hover:bg-rose-50 disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" />
              {isDeleting ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
      </div>

      <div className="mt-16 flex flex-wrap items-center justify-between gap-3 text-base text-zinc-500">
        <p>
          <span className="font-black text-zinc-900">Assigned on : </span>
          <span>
            {format(new Date(assignment.createdAt), "dd-MM-yyyy")}
          </span>
        </p>
        {assignment.dueDate && (
          <p>
            <span className="font-black text-zinc-900">Due : </span>
            <span>
              {format(new Date(assignment.dueDate), "dd-MM-yyyy")}
            </span>
          </p>
        )}
      </div>


      <div className="mt-5 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-zinc-400">
        <Clock3 className="h-4 w-4" />
        {assignment.totalQuestions} questions / {assignment.totalMarks} marks
      </div>
    </article>
  );
}
