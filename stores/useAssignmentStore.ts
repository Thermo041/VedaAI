import { create } from "zustand";
import { Assignment } from "@/types";

type AssignmentStore = {
  assignments: Assignment[];
  currentAssignment: Partial<Assignment> | null;
  setAssignments: (assignments: Assignment[]) => void;
  addAssignment: (assignment: Assignment) => void;
  updateAssignment: (id: string, data: Partial<Assignment>) => void;
  deleteAssignment: (id: string) => void;
  setCurrentAssignment: (assignment: Partial<Assignment> | null) => void;
  updateCurrentAssignment: (data: Partial<Assignment>) => void;
  resetCurrentAssignment: () => void;
};

export const useAssignmentStore = create<AssignmentStore>((set) => ({
  assignments: [],
  currentAssignment: null,
  
  setAssignments: (assignments) => set({ assignments }),
  
  addAssignment: (assignment) =>
    set((state) => ({ assignments: [assignment, ...state.assignments] })),
  
  updateAssignment: (id, data) =>
    set((state) => ({
      assignments: state.assignments.map((a) =>
        a._id === id ? { ...a, ...data } : a
      ),
    })),
  
  deleteAssignment: (id) =>
    set((state) => ({
      assignments: state.assignments.filter((a) => a._id !== id),
    })),
  
  setCurrentAssignment: (assignment) => set({ currentAssignment: assignment }),
  
  updateCurrentAssignment: (data) =>
    set((state) => ({
      currentAssignment: state.currentAssignment
        ? { ...state.currentAssignment, ...data }
        : data,
    })),
  
  resetCurrentAssignment: () => set({ currentAssignment: null }),
}));
