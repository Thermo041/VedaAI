import { create } from "zustand";
import { GenerationProgress } from "@/types";

type GenerationStore = {
  isGenerating: boolean;
  progress: GenerationProgress | null;
  setIsGenerating: (isGenerating: boolean) => void;
  setProgress: (progress: GenerationProgress | null) => void;
  resetGeneration: () => void;
};

export const useGenerationStore = create<GenerationStore>((set) => ({
  isGenerating: false,
  progress: null,
  
  setIsGenerating: (isGenerating) => set({ isGenerating }),
  
  setProgress: (progress) => set({ progress }),
  
  resetGeneration: () => set({ isGenerating: false, progress: null }),
}));
