"use client";

import { useEffect, useMemo, useState } from "react";
import { Users, UserPlus, X, Trash2 } from "lucide-react";
import { PageIntro } from "@/components/layout/PageIntro";
import { Assignment } from "@/types";
import { Input } from "@/components/ui/input";
import { useAssignmentStore } from "@/stores/useAssignmentStore";

type ClassGroup = {
  _id?: string;
  name: string;
  subject: string;
  assignments?: number;
  studentCount?: number;
  description?: string;
};

function buildGroups(assignments: Assignment[]): ClassGroup[] {
  const map = new Map<string, ClassGroup>();

  for (const assignment of assignments) {
    const className =
      assignment.generatedPaper?.metadata?.class || "General";
    const subject =
      assignment.generatedPaper?.metadata?.subject || "Mixed";
    const key = `${className}::${subject}`;
    const existing = map.get(key);
    if (existing) {
      existing.assignments = (existing.assignments || 0) + 1;
    } else {
      map.set(key, {
        name: className,
        subject,
        assignments: 1,
      });
    }
  }

  return Array.from(map.values()).sort((a, b) => (b.assignments || 0) - (a.assignments || 0));
}

export default function GroupsPage() {
  const assignments = useAssignmentStore((state) => state.assignments);
  const setAssignments = useAssignmentStore((state) => state.setAssignments);
  const [manualGroups, setManualGroups] = useState<ClassGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    subject: "",
    studentCount: "",
    description: "",
  });
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [assignmentsRes, groupsRes] = await Promise.all([
          fetch("/api/assignments"),
          fetch("/api/groups"),
        ]);
        
        if (assignmentsRes.ok) {
          const data = await assignmentsRes.json();
          setAssignments(
            (data.assignments || []).map((assignment: Assignment) => ({
              ...assignment,
              dueDate: new Date(assignment.dueDate),
              createdAt: new Date(assignment.createdAt),
              updatedAt: new Date(assignment.updatedAt),
            }))
          );
        }
        
        if (groupsRes.ok) {
          const data = await groupsRes.json();
          setManualGroups(data.groups || []);
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [setAssignments]);

  const autoGroups = useMemo(() => buildGroups(assignments), [assignments]);
  const allGroups = [...manualGroups, ...autoGroups];

  const handleDeleteGroup = async (groupId: string, groupName: string, groupSubject: string, isManual: boolean) => {
    const confirmMessage = isManual 
      ? "Are you sure you want to delete this group?"
      : `Are you sure you want to delete "${groupName} - ${groupSubject}"? This will also delete all ${autoGroups.find(g => g.name === groupName && g.subject === groupSubject)?.assignments || 0} assignment(s) in this group.`;
    
    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      if (isManual) {
        // Delete manual group only
        const response = await fetch(`/api/groups?id=${groupId}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          throw new Error("Failed to delete group");
        }

        setManualGroups((current) => current.filter((g) => g._id !== groupId));
      } else {
        // Delete auto-generated group by deleting all assignments in that class/subject
        const assignmentsToDelete = assignments.filter(a => {
          const className = a.generatedPaper?.metadata?.class || "General";
          const subject = a.generatedPaper?.metadata?.subject || "Mixed";
          return className === groupName && subject === groupSubject;
        });

        // Delete all assignments in parallel
        await Promise.all(
          assignmentsToDelete.map(async (assignment) => {
            const response = await fetch(`/api/assignments?id=${assignment._id}`, {
              method: "DELETE",
            });
            if (!response.ok) {
              throw new Error("Failed to delete one or more assignments");
            }
          })
        );

        // Update local state
        setAssignments(assignments.filter(a => {
          const className = a.generatedPaper?.metadata?.class || "General";
          const subject = a.generatedPaper?.metadata?.subject || "Mixed";
          return !(className === groupName && subject === groupSubject);
        }));
      }
    } catch (error) {
      alert("Failed to delete group. Please try again.");
    }
  };

  const handleCreateGroup = async () => {
    if (!formData.name.trim() || !formData.subject.trim()) {
      alert("Name and subject are required");
      return;
    }

    setIsCreating(true);
    try {
      const response = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name.trim(),
          subject: formData.subject.trim(),
          studentCount: parseInt(formData.studentCount) || 0,
          description: formData.description.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create group");
      }

      const { group } = await response.json();
      setManualGroups((current) => [group, ...current]);
      setShowCreateModal(false);
      setFormData({ name: "", subject: "", studentCount: "", description: "" });
    } catch (error) {
      alert("Failed to create group. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <>
      <section className="mx-auto max-w-6xl">
        <PageIntro
          title="My Groups"
          description="Manage your class groups and view auto-generated groups from assignments."
        />

        <div className="mb-5 flex justify-end">
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex h-11 items-center gap-2 rounded-full bg-zinc-950 px-5 text-sm font-bold text-white transition hover:bg-zinc-800"
          >
            <UserPlus className="h-4 w-4" />
            Create Group
          </button>
        </div>

        {loading ? (
          <p className="py-16 text-center text-sm font-semibold text-zinc-500">
            Loading groups...
          </p>
        ) : allGroups.length === 0 ? (
          <p className="rounded-lg border border-dashed border-zinc-200 bg-white/80 py-16 text-center text-sm font-semibold text-zinc-500">
            No groups yet. Create a group or generate assignments to see auto-groups.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {allGroups.map((group, index) => {
              const isManualGroup = manualGroups.some(g => g._id === group._id);
              return (
              <article
                key={group._id || `${group.name}-${group.subject}-${index}`}
                className="rounded-lg border border-white/80 bg-white/90 p-6 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="grid h-11 w-11 place-items-center rounded-full bg-orange-100 text-orange-600">
                    <Users className="h-5 w-5" />
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-bold text-zinc-600">
                      {group.subject}
                    </span>
                    <button
                      onClick={() => handleDeleteGroup(group._id || '', group.name, group.subject, isManualGroup)}
                      className="grid h-8 w-8 place-items-center rounded-full text-zinc-400 hover:bg-red-50 hover:text-red-600 transition"
                      title={isManualGroup ? "Delete group" : "Delete group and all assignments"}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <h2 className="mt-4 text-xl font-black text-zinc-900">
                  {group.name}
                </h2>
                {group.description && (
                  <p className="mt-1 text-xs text-zinc-500">{group.description}</p>
                )}
                <p className="mt-2 text-sm font-medium text-zinc-500">
                  {group.studentCount ? `${group.studentCount} students` : 
                   group.assignments ? `${group.assignments} assignment${group.assignments === 1 ? "" : "s"}` :
                   "No students"}
                </p>
              </article>
            )})}
          </div>
        )}
      </section>

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-black text-zinc-900">Create New Group</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="grid h-8 w-8 place-items-center rounded-full text-zinc-500 hover:bg-zinc-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-bold text-zinc-900">
                  Group Name *
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Class 10-A"
                  className="h-11"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-zinc-900">
                  Subject *
                </label>
                <Input
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="e.g., Physics"
                  className="h-11"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-zinc-900">
                  Number of Students
                </label>
                <Input
                  type="number"
                  value={formData.studentCount}
                  onChange={(e) => setFormData({ ...formData, studentCount: e.target.value })}
                  placeholder="e.g., 30"
                  className="h-11"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-zinc-900">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Optional description"
                  rows={3}
                  className="w-full rounded-lg border border-zinc-300 px-4 py-2 text-sm outline-none focus:border-orange-500"
                />
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 sm:flex-none whitespace-nowrap rounded-full border border-zinc-300 py-2 px-6 text-sm font-bold text-zinc-700 transition hover:bg-zinc-50 min-w-[120px]"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateGroup}
                disabled={isCreating}
                className="flex-1 sm:flex-none whitespace-nowrap rounded-full bg-zinc-950 py-2 px-6 text-sm font-bold text-white transition hover:bg-zinc-800 disabled:opacity-50 min-w-[160px]"
              >
                {isCreating ? "Creating..." : "Create Group"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
